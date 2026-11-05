import { Injectable } from "@nestjs/common";

import { AuditService } from "../../../shared/audit/audit.service";
import { Database, type Tx } from "../../../shared/db/database";
import { ConflictError, NotFoundError, ValidationError } from "../../../shared/errors/app-error";
import { WebsiteRevalidator } from "../../../shared/website/website-revalidator";
import {
  type CreateFaqInput,
  type FaqStatus,
  type ListFaqsQuery,
  publishProblem,
  type ReorderFaqsInput,
  type UpdateFaqInput,
} from "../domain/faq";
import { type FaqPatch, FaqsRepo } from "../repo/faqs.repo";

interface Row {
  id: string;
  status: string;
  sortOrder: number;
  publishedAt: Date | null;
  createdAt: Date;
  updatedAt: Date;
  question: string;
  answer: string;
}

/**
 * Use cases for the shared FAQ list. Permissions are declared on the endpoints (`cms.faq.read` / `.create` / `.update` /
 * `.delete`). Every change writes an audit entry with ids and field names only, never the question or answer text. The website is
 * told to refresh after any change that affects the live list.
 */
@Injectable()
export class FaqsService {
  constructor(
    private readonly database: Database,
    private readonly repo: FaqsRepo,
    private readonly audit: AuditService,
    private readonly website: WebsiteRevalidator,
  ) {}

  async create(input: CreateFaqInput, actorId: string) {
    return this.database.transaction(async (tx) => {
      const inserted = await this.repo.insert(tx, {
        question: input.question,
        answer: input.answer,
        sortOrder: await this.repo.nextSortOrder(tx),
        createdBy: actorId,
      });
      await this.audit.record({ action: "cms.faq.created", actorId, entityType: "faq", entityId: inserted.id }, tx);
      return this.load(tx, inserted.id);
    });
  }

  async list(query: ListFaqsQuery) {
    const { items, total } = await this.repo.list({
      status: query.status,
      q: query.q || undefined,
      sort: query.sort,
      order: query.order,
      limit: query.pageSize,
      offset: (query.page - 1) * query.pageSize,
    });
    return { items: items.map((row) => this.present(row)), total, page: query.page, pageSize: query.pageSize };
  }

  async get(id: string) {
    return this.database.transaction((tx) => this.load(tx, id));
  }

  async update(id: string, input: UpdateFaqInput, actorId: string) {
    const updated = await this.database.transaction(async (tx) => {
      const row = await this.repo.findForUpdate(tx, id);
      if (!row) throw new NotFoundError("FAQ not found");

      const patch = Object.fromEntries(Object.entries(input).filter(([, value]) => value !== undefined)) as FaqPatch;
      await this.repo.update(tx, id, patch, actorId);
      await this.audit.record(
        { action: "cms.faq.updated", actorId, entityType: "faq", entityId: id, metadata: { fields: Object.keys(patch) } },
        tx,
      );
      return this.load(tx, id);
    });
    // A draft is not on the website, so only a live FAQ needs the website refreshed.
    if (updated.status === "published") await this.website.faqsChanged();
    return updated;
  }

  /** A draft goes live on every page that shows the shared list. */
  async publish(id: string, actorId: string) {
    const published = await this.database.transaction(async (tx) => {
      const row = await this.repo.findForUpdate(tx, id);
      if (!row) throw new NotFoundError("FAQ not found");
      if (row.status !== "draft") throw new ConflictError("Only a draft can be published");
      const problem = publishProblem(await this.repo.countPublished(tx));
      if (problem) throw new ConflictError(problem);

      await this.repo.update(tx, id, { status: "published", publishedAt: row.publishedAt ?? new Date() }, actorId);
      await this.recordStatus(tx, "published", id, actorId);
      return this.load(tx, id);
    });
    await this.website.faqsChanged();
    return published;
  }

  /** Takes the FAQ off the website and back to a draft. Nothing is deleted. */
  async unpublish(id: string, actorId: string) {
    const unpublished = await this.database.transaction(async (tx) => {
      const row = await this.repo.findForUpdate(tx, id);
      if (!row) throw new NotFoundError("FAQ not found");
      if (row.status !== "published") throw new ConflictError("Only a published FAQ can be unpublished");

      await this.repo.update(tx, id, { status: "draft" }, actorId);
      await this.recordStatus(tx, "unpublished", id, actorId);
      return this.load(tx, id);
    });
    await this.website.faqsChanged();
    return unpublished;
  }

  /** Sets the display order. The list must hold every FAQ exactly once. */
  async setOrder(input: ReorderFaqsInput, actorId: string) {
    await this.database.transaction(async (tx) => {
      const current = await this.repo.lockAllIds(tx);
      const wanted = input.ids;
      const sameSet =
        wanted.length === current.length && new Set(wanted).size === wanted.length && current.every((id) => wanted.includes(id));
      if (!sameSet) throw new ValidationError("Send every FAQ exactly once", { ids: "Send every FAQ exactly once" });

      for (const [position, id] of wanted.entries()) await this.repo.setSortOrder(tx, id, position, actorId);
      await this.audit.record(
        { action: "cms.faq.reordered", actorId, entityType: "faq", metadata: { count: wanted.length } },
        tx,
      );
    });
    await this.website.faqsChanged();
    return this.list({ page: 1, pageSize: 100, sort: "sortOrder", order: "asc" });
  }

  /** Deletes an FAQ for good, in any state (there is no consent or file behind it). The website refreshes if it was live. */
  async remove(id: string, actorId: string) {
    const wasLive = await this.database.transaction(async (tx) => {
      const row = await this.repo.findForUpdate(tx, id);
      if (!row) throw new NotFoundError("FAQ not found");

      await this.repo.delete(tx, id);
      await this.audit.record(
        {
          action: "cms.faq.deleted",
          actorId,
          entityType: "faq",
          entityId: id,
          metadata: { wasPublished: row.status === "published" },
        },
        tx,
      );
      return row.status === "published";
    });
    if (wasLive) await this.website.faqsChanged();
  }

  /** The published FAQs for the website, in display order, at most 100. An allow-listed shape: no id, status or audit columns. */
  async listPublic() {
    const rows = await this.repo.listPublished(this.database.db);
    return { faqs: rows.map((row) => ({ question: row.question, answer: row.answer })) };
  }

  private async load(tx: Tx, id: string) {
    const row = await this.repo.findById(tx, id);
    if (!row) throw new NotFoundError("FAQ not found");
    return this.present(row);
  }

  private recordStatus(tx: Tx, change: "published" | "unpublished", id: string, actorId: string) {
    return this.audit.record({ action: `cms.faq.${change}`, actorId, entityType: "faq", entityId: id }, tx);
  }

  private present(row: Row) {
    return {
      id: row.id,
      status: row.status as FaqStatus,
      sortOrder: row.sortOrder,
      publishedAt: row.publishedAt?.toISOString() ?? null,
      createdAt: row.createdAt.toISOString(),
      updatedAt: row.updatedAt.toISOString(),
      question: row.question,
      answer: row.answer,
    };
  }
}

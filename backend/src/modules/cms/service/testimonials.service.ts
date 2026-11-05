import { Injectable, Logger } from "@nestjs/common";

import { AuditService } from "../../../shared/audit/audit.service";
import { Database, type Tx } from "../../../shared/db/database";
import { ConflictError, NotFoundError, ValidationError } from "../../../shared/errors/app-error";
import { StorageService } from "../../../shared/storage/storage.service";
import type { ServiceId } from "../domain/case-study";
import {
  type CreateTestimonialInput,
  editProblem,
  type ListTestimonialsQuery,
  logoFolder,
  publishProblem,
  type ReorderTestimonialsInput,
  type TestimonialStatus,
  type UpdateTestimonialInput,
} from "../domain/testimonial";
import { type TestimonialPatch, TestimonialsRepo } from "../repo/testimonials.repo";
import { PublicImageStore } from "./public-image-store";
import { WebsiteRevalidator } from "../../../shared/website/website-revalidator";

/** An uploaded logo as the HTTP layer hands it over. Nothing here is trusted yet. */
export interface LogoUpload {
  buffer: Buffer;
}

interface Row {
  id: string;
  status: string;
  sortOrder: number;
  publishedAt: Date | null;
  createdAt: Date;
  updatedAt: Date;
  quote: string;
  name: string;
  role: string;
  company: string;
  service: string;
  consentConfirmed: boolean;
  logoInBlack: boolean;
  logoKey: string | null;
  logoWidth: number | null;
  logoHeight: number | null;
}

export type TestimonialLogo = { url: string; width: number; height: number } | null;

/**
 * Use cases for testimonials. Permissions are declared on the endpoints (`cms.testimonial.read` / `.create` / `.update` /
 * `.delete`). Every change writes an audit entry with ids and field names only: the quote, name, role and company are personal
 * data and never go in the audit log.
 */
@Injectable()
export class TestimonialsService {
  private readonly logger = new Logger(TestimonialsService.name);

  constructor(
    private readonly database: Database,
    private readonly repo: TestimonialsRepo,
    private readonly audit: AuditService,
    private readonly storage: StorageService,
    private readonly website: WebsiteRevalidator,
    private readonly images: PublicImageStore,
  ) {}

  async create(input: CreateTestimonialInput, actorId: string) {
    return this.database.transaction(async (tx) => {
      const inserted = await this.repo.insert(tx, {
        quote: input.quote,
        name: input.name,
        role: input.role,
        company: input.company,
        service: input.service,
        consentConfirmed: input.consentConfirmed,
        logoInBlack: input.logoInBlack,
        sortOrder: await this.repo.nextSortOrder(tx),
        createdBy: actorId,
      });
      await this.audit.record(
        { action: "cms.testimonial.created", actorId, entityType: "testimonial", entityId: inserted.id },
        tx,
      );
      return this.load(tx, inserted.id);
    });
  }

  async list(query: ListTestimonialsQuery) {
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

  async update(id: string, input: UpdateTestimonialInput, actorId: string) {
    const updated = await this.database.transaction(async (tx) => {
      const row = await this.repo.findForUpdate(tx, id);
      if (!row) throw new NotFoundError("Testimonial not found");
      const problem = editProblem(row, input);
      if (problem) throw new ConflictError(problem);

      const patch = Object.fromEntries(Object.entries(input).filter(([, value]) => value !== undefined)) as TestimonialPatch;
      await this.repo.update(tx, id, patch, actorId);
      await this.audit.record(
        {
          action: "cms.testimonial.updated",
          actorId,
          entityType: "testimonial",
          entityId: id,
          metadata: { fields: Object.keys(patch) },
        },
        tx,
      );
      return this.load(tx, id);
    });
    // A draft is not on the website, so only a live testimonial needs the website refreshed.
    if (updated.status === "published") await this.website.testimonialsChanged();
    return updated;
  }

  /** A draft goes live on the website. It needs the client's agreement, recorded with `consentConfirmed`. */
  async publish(id: string, actorId: string) {
    const published = await this.database.transaction(async (tx) => {
      const row = await this.repo.findForUpdate(tx, id);
      if (!row) throw new NotFoundError("Testimonial not found");
      if (row.status !== "draft") throw new ConflictError("Only a draft can be published");
      const problem = publishProblem(row);
      if (problem) throw new ValidationError(problem, { consentConfirmed: problem });

      await this.repo.update(tx, id, { status: "published", publishedAt: row.publishedAt ?? new Date() }, actorId);
      await this.recordStatus(tx, "published", id, actorId);
      return this.load(tx, id);
    });
    await this.website.testimonialsChanged();
    return published;
  }

  /** Takes the testimonial off the website and back to a draft. Nothing is deleted. */
  async unpublish(id: string, actorId: string) {
    const unpublished = await this.database.transaction(async (tx) => {
      const row = await this.repo.findForUpdate(tx, id);
      if (!row) throw new NotFoundError("Testimonial not found");
      if (row.status !== "published") throw new ConflictError("Only a published testimonial can be unpublished");

      await this.repo.update(tx, id, { status: "draft" }, actorId);
      await this.recordStatus(tx, "unpublished", id, actorId);
      return this.load(tx, id);
    });
    await this.website.testimonialsChanged();
    return unpublished;
  }

  /** Sets the display order. The list must hold every testimonial exactly once. */
  async setOrder(input: ReorderTestimonialsInput, actorId: string) {
    await this.database.transaction(async (tx) => {
      const current = await this.repo.lockAllIds(tx);
      const wanted = input.ids;
      const sameSet =
        wanted.length === current.length && new Set(wanted).size === wanted.length && current.every((id) => wanted.includes(id));
      if (!sameSet)
        throw new ValidationError("Send every testimonial exactly once", { ids: "Send every testimonial exactly once" });

      for (const [position, id] of wanted.entries()) await this.repo.setSortOrder(tx, id, position, actorId);
      await this.audit.record(
        { action: "cms.testimonial.reordered", actorId, entityType: "testimonial", metadata: { count: wanted.length } },
        tx,
      );
    });
    await this.website.testimonialsChanged();
    return this.list({ page: 1, pageSize: 100, sort: "sortOrder", order: "asc" });
  }

  /**
   * Uploads the company logo, or replaces it. The new file is stored first, under the next unused number (never a number used
   * before, so a cached copy of an old address cannot be served for the new picture); then the row is updated; then the old file
   * is deleted. A failure at any step leaves the testimonial as it was, at worst with one orphan file, which is logged.
   */
  async setLogo(id: string, upload: LogoUpload, actorId: string) {
    const detected = this.images.check(upload.buffer, "logo");
    if (!(await this.repo.findById(this.database.db, id))) throw new NotFoundError("Testimonial not found");

    const newKey = await this.images.store(logoFolder(id), "logo", upload.buffer, detected);
    let previousKey: string | null;
    try {
      previousKey = await this.database.transaction(async (tx) => {
        const row = await this.repo.findForUpdate(tx, id);
        if (!row) throw new NotFoundError("Testimonial not found");
        await this.repo.update(
          tx,
          id,
          {
            logoKey: newKey,
            logoWidth: detected.width,
            logoHeight: detected.height,
            logoSize: upload.buffer.length,
            logoType: detected.contentType,
          },
          actorId,
        );
        await this.audit.record(
          {
            action: "cms.testimonial.logo_replaced",
            actorId,
            entityType: "testimonial",
            entityId: id,
            metadata: { replaced: row.logoKey !== null, type: detected.contentType, size: upload.buffer.length },
          },
          tx,
        );
        return row.logoKey;
      });
    } catch (error) {
      await this.images.discard(newKey, "testimonial", id);
      throw error;
    }
    if (previousKey && previousKey !== newKey) await this.images.discard(previousKey, "testimonial", id);
    const saved = await this.get(id);
    if (saved.status === "published") await this.website.testimonialsChanged();
    return saved;
  }

  /**
   * Removes the logo. Allowed on a published testimonial too, since the logo is optional: the card then shows the company name.
   * Removing a logo that is not there changes nothing and is not an error.
   */
  async removeLogo(id: string, actorId: string) {
    const previousKey = await this.database.transaction(async (tx) => {
      const row = await this.repo.findForUpdate(tx, id);
      if (!row) throw new NotFoundError("Testimonial not found");
      if (!row.logoKey) return null;

      await this.repo.update(
        tx,
        id,
        { logoKey: null, logoWidth: null, logoHeight: null, logoSize: null, logoType: null },
        actorId,
      );
      await this.audit.record({ action: "cms.testimonial.logo_removed", actorId, entityType: "testimonial", entityId: id }, tx);
      return row.logoKey;
    });
    if (previousKey) await this.images.discard(previousKey, "testimonial", id);
    const saved = await this.get(id);
    if (previousKey && saved.status === "published") await this.website.testimonialsChanged();
    return saved;
  }

  /**
   * Deletes a draft for good, with every file in its logo folder. A published testimonial must be unpublished first, so nothing
   * live disappears by accident. The row goes first; if the files cannot be deleted afterwards the testimonial is still gone and
   * the files are an orphan folder, which is logged.
   */
  async remove(id: string, actorId: string) {
    await this.database.transaction(async (tx) => {
      const row = await this.repo.findForUpdate(tx, id);
      if (!row) throw new NotFoundError("Testimonial not found");
      if (row.status !== "draft") throw new ConflictError("Unpublish the testimonial before deleting it");

      await this.repo.delete(tx, id);
      await this.audit.record({ action: "cms.testimonial.deleted", actorId, entityType: "testimonial", entityId: id }, tx);
    });
    try {
      await this.storage.deletePublicPrefix(logoFolder(id));
    } catch {
      this.logger.error(`Could not delete the logo folder of deleted testimonial ${id}; remove it by hand`);
    }
  }

  /**
   * The published testimonials for the website, in display order, at most 50. An allow-listed shape: no id, status, consent flag
   * or audit columns.
   */
  async listPublic() {
    const rows = await this.repo.listPublished(this.database.db);
    return {
      items: rows.map((row) => ({
        quote: row.quote,
        name: row.name,
        role: row.role,
        company: row.company,
        service: row.service as ServiceId,
        logoInBlack: row.logoInBlack,
        logo: this.logo(row),
      })),
    };
  }

  private async load(tx: Tx, id: string) {
    const row = await this.repo.findById(tx, id);
    if (!row) throw new NotFoundError("Testimonial not found");
    return this.present(row);
  }

  private recordStatus(tx: Tx, change: "published" | "unpublished", id: string, actorId: string) {
    return this.audit.record({ action: `cms.testimonial.${change}`, actorId, entityType: "testimonial", entityId: id }, tx);
  }

  /** The logo as the admin needs it: a public URL, never the bucket key. Null when there is none. */
  private logo(row: Row): TestimonialLogo {
    if (!row.logoKey || row.logoWidth === null || row.logoHeight === null) return null;
    return { url: this.storage.publicUrl(row.logoKey), width: row.logoWidth, height: row.logoHeight };
  }

  private present(row: Row) {
    return {
      id: row.id,
      status: row.status as TestimonialStatus,
      sortOrder: row.sortOrder,
      publishedAt: row.publishedAt?.toISOString() ?? null,
      createdAt: row.createdAt.toISOString(),
      updatedAt: row.updatedAt.toISOString(),
      quote: row.quote,
      name: row.name,
      role: row.role,
      company: row.company,
      service: row.service as ServiceId,
      consentConfirmed: row.consentConfirmed,
      logoInBlack: row.logoInBlack,
      logo: this.logo(row),
    };
  }
}

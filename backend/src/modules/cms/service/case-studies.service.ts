import { Injectable, Logger } from "@nestjs/common";

import { AuditService } from "../../../shared/audit/audit.service";
import { Database, type Tx } from "../../../shared/db/database";
import { ConflictError, NotFoundError, ValidationError } from "../../../shared/errors/app-error";
import { StorageService } from "../../../shared/storage/storage.service";
import {
  type CaseStudyStat,
  type CaseStudyStatus,
  type CreateCaseStudyInput,
  imageFolder,
  type ListCaseStudiesQuery,
  publishProblem,
  type ReorderCaseStudiesInput,
  type ServiceId,
  slugify,
  type UpdateCaseStudyInput,
} from "../domain/case-study";
import { ALT_MAX_LENGTH } from "../domain/image";
import { type CaseStudyPatch, CaseStudiesRepo } from "../repo/case-studies.repo";
import { PublicImageStore } from "./public-image-store";
import { WebsiteRevalidator } from "./website-revalidator";

/** An uploaded image as the HTTP layer hands it over: the bytes and the alt text. Nothing here is trusted yet. */
export interface ImageUpload {
  buffer: Buffer;
  alt: string;
}

interface ImageColumns {
  imageKey: string | null;
  imageAlt: string | null;
  imageWidth: number | null;
  imageHeight: number | null;
}

interface SummaryRow extends ImageColumns {
  id: string;
  slug: string;
  title: string;
  client: string;
  service: string;
  category: string;
  status: string;
  sortOrder: number;
  publishedAt: Date | null;
  createdAt: Date;
}

interface DetailRow extends SummaryRow {
  summary: string;
  description: string;
  challenge: string;
  tags: string[];
  stats: CaseStudyStat[];
  seoTitle: string;
  seoDescription: string;
  imageSize: number | null;
  imageType: string | null;
  updatedAt: Date;
}

export type CaseStudyImage = { url: string; alt: string; width: number; height: number } | null;

/**
 * Use cases for case studies. Permissions are declared on the endpoints (`cms.case_study.read` / `.create` / `.update` /
 * `.delete`). Every change writes an audit entry with ids and field names only, never the text.
 */
@Injectable()
export class CaseStudiesService {
  private readonly logger = new Logger(CaseStudiesService.name);

  constructor(
    private readonly database: Database,
    private readonly repo: CaseStudiesRepo,
    private readonly audit: AuditService,
    private readonly storage: StorageService,
    private readonly images: PublicImageStore,
    private readonly website: WebsiteRevalidator,
  ) {}

  async create(input: CreateCaseStudyInput, actorId: string) {
    return this.database.transaction(async (tx) => {
      const slug = input.slug ?? slugify(input.title);
      const inserted = await this.repo.insert(tx, {
        slug,
        title: input.title,
        summary: input.summary,
        client: input.client,
        service: input.service,
        category: input.category,
        description: input.description,
        challenge: input.challenge,
        tags: input.tags,
        stats: input.stats,
        seoTitle: input.seoTitle,
        seoDescription: input.seoDescription,
        sortOrder: await this.repo.nextSortOrder(tx),
        createdBy: actorId,
      });
      // No random suffix on purpose: the URL and the image folder are the readable name, so a taken one is refused, not changed.
      if (!inserted) throw new ConflictError("A case study with this address already exists", { slug });

      await this.audit.record({ action: "cms.case_study.created", actorId, entityType: "case_study", entityId: inserted.id }, tx);
      return this.load(tx, inserted.id);
    });
  }

  async list(query: ListCaseStudiesQuery) {
    const { items, total } = await this.repo.list({
      status: query.status,
      q: query.q || undefined,
      sort: query.sort,
      order: query.order,
      limit: query.pageSize,
      offset: (query.page - 1) * query.pageSize,
    });
    return { items: items.map((row) => this.summary(row)), total, page: query.page, pageSize: query.pageSize };
  }

  async get(id: string) {
    return this.database.transaction((tx) => this.load(tx, id));
  }

  async update(id: string, input: UpdateCaseStudyInput, actorId: string) {
    const updated = await this.database.transaction(async (tx) => {
      const row = await this.repo.findForUpdate(tx, id);
      if (!row) throw new NotFoundError("Case study not found");
      if (input.imageAlt !== undefined && !row.imageKey)
        throw new ValidationError("Upload the image before describing it", { imageAlt: "Upload the image first" });

      const patch = Object.fromEntries(Object.entries(input).filter(([, value]) => value !== undefined)) as CaseStudyPatch;
      await this.repo.update(tx, id, patch, actorId);
      await this.audit.record(
        {
          action: "cms.case_study.updated",
          actorId,
          entityType: "case_study",
          entityId: id,
          metadata: { fields: Object.keys(patch) },
        },
        tx,
      );
      return this.load(tx, id);
    });
    // A draft is not on the website, so only a live study needs the website refreshed.
    if (updated.status === "published") await this.website.caseStudiesChanged();
    return updated;
  }

  /** A draft goes live on the website (within about a minute, because the site refreshes every 60 seconds). It needs its image. */
  async publish(id: string, actorId: string) {
    const published = await this.database.transaction(async (tx) => {
      const row = await this.repo.findForUpdate(tx, id);
      if (!row) throw new NotFoundError("Case study not found");
      if (row.status !== "draft") throw new ConflictError("Only a draft can be published");
      const problem = publishProblem(row);
      if (problem) throw new ValidationError(problem, { image: problem });

      await this.repo.update(tx, id, { status: "published", publishedAt: row.publishedAt ?? new Date() }, actorId);
      await this.recordStatus(tx, "published", id, actorId);
      return this.load(tx, id);
    });
    await this.website.caseStudiesChanged();
    return published;
  }

  /** Takes the study off the website and back to a draft. Nothing is deleted. */
  async unpublish(id: string, actorId: string) {
    const unpublished = await this.database.transaction(async (tx) => {
      const row = await this.repo.findForUpdate(tx, id);
      if (!row) throw new NotFoundError("Case study not found");
      if (row.status !== "published") throw new ConflictError("Only a published case study can be unpublished");

      await this.repo.update(tx, id, { status: "draft" }, actorId);
      await this.recordStatus(tx, "unpublished", id, actorId);
      return this.load(tx, id);
    });
    await this.website.caseStudiesChanged();
    return unpublished;
  }

  /** Sets the display order. The list must hold every case study exactly once. */
  async setOrder(input: ReorderCaseStudiesInput, actorId: string) {
    await this.database.transaction(async (tx) => {
      const current = await this.repo.lockAllIds(tx);
      const wanted = input.ids;
      const sameSet =
        wanted.length === current.length && new Set(wanted).size === wanted.length && current.every((id) => wanted.includes(id));
      if (!sameSet)
        throw new ValidationError("Send every case study exactly once", { ids: "Send every case study exactly once" });

      for (const [position, id] of wanted.entries()) await this.repo.setSortOrder(tx, id, position, actorId);
      await this.audit.record(
        { action: "cms.case_study.reordered", actorId, entityType: "case_study", metadata: { count: wanted.length } },
        tx,
      );
    });
    await this.website.caseStudiesChanged();
    return this.list({ page: 1, pageSize: 100, sort: "sortOrder", order: "asc" });
  }

  /**
   * Uploads the showcase image, or replaces it. The new file is stored first, under the next unused number (never a number that
   * was used before, so a cached copy of an old address can never be served for the new picture); then the row is updated; then
   * the old file is deleted. A failure at any step leaves the study as it was, at worst with one orphan file, which is logged.
   */
  async setImage(id: string, upload: ImageUpload, actorId: string) {
    const alt = upload.alt.trim();
    if (alt.length === 0 || alt.length > ALT_MAX_LENGTH)
      throw new ValidationError(`Describe the image in 1 to ${ALT_MAX_LENGTH} characters`, { alt: "Describe the image" });
    const detected = this.images.check(upload.buffer, "image");

    const study = await this.repo.findById(this.database.db, id);
    if (!study) throw new NotFoundError("Case study not found");

    const newKey = await this.images.store(imageFolder(study.slug), "image", upload.buffer, detected);
    let previousKey: string | null;
    try {
      previousKey = await this.database.transaction(async (tx) => {
        const row = await this.repo.findForUpdate(tx, id);
        if (!row) throw new NotFoundError("Case study not found");
        await this.repo.update(
          tx,
          id,
          {
            imageKey: newKey,
            imageAlt: alt,
            imageWidth: detected.width,
            imageHeight: detected.height,
            imageSize: upload.buffer.length,
            imageType: detected.contentType,
          },
          actorId,
        );
        await this.audit.record(
          {
            action: "cms.case_study.image_replaced",
            actorId,
            entityType: "case_study",
            entityId: id,
            metadata: { replaced: row.imageKey !== null, type: detected.contentType, size: upload.buffer.length },
          },
          tx,
        );
        return row.imageKey;
      });
    } catch (error) {
      await this.images.discard(newKey, "case study", id);
      throw error;
    }
    if (previousKey && previousKey !== newKey) await this.images.discard(previousKey, "case study", id);
    const saved = await this.get(id);
    if (saved.status === "published") await this.website.caseStudiesChanged();
    return saved;
  }

  /**
   * Deletes a draft for good, with every file in its image folder. A published study must be unpublished first, so nothing live
   * disappears by accident. The row goes first; if the files cannot be deleted afterwards the study is still gone and the files
   * are an orphan folder, which is logged.
   */
  async remove(id: string, actorId: string) {
    const slug = await this.database.transaction(async (tx) => {
      const row = await this.repo.findForUpdate(tx, id);
      if (!row) throw new NotFoundError("Case study not found");
      if (row.status !== "draft") throw new ConflictError("Unpublish the case study before deleting it");

      await this.repo.delete(tx, id);
      await this.audit.record({ action: "cms.case_study.deleted", actorId, entityType: "case_study", entityId: id }, tx);
      return row.slug;
    });
    try {
      await this.storage.deletePublicPrefix(imageFolder(slug));
    } catch {
      this.logger.error(`Could not delete the image folder of deleted case study ${id}; remove it by hand`);
    }
  }

  /** The published case studies for the website, in display order. An allow-listed shape: no id, status or audit columns. */
  async listPublic() {
    const rows = await this.repo.listPublished(this.database.db);
    return { items: rows.flatMap((row) => this.publicStudy(row)) };
  }

  /** One published case study. A draft, or one that was unpublished, does not exist as far as the public is concerned. */
  async getPublic(slug: string) {
    const row = await this.repo.findPublishedBySlug(this.database.db, slug);
    const [study] = row ? this.publicStudy(row) : [];
    if (!study) throw new NotFoundError("Case study not found");
    return study;
  }

  /** A one-item list, or none when the study has no usable image, so callers can flatMap it. */
  private publicStudy(row: DetailRow) {
    const image = this.image(row);
    if (!image) return [];
    return [
      {
        slug: row.slug,
        title: row.title,
        summary: row.summary,
        client: row.client,
        service: row.service as ServiceId,
        category: row.category as ServiceId,
        description: row.description,
        challenge: row.challenge,
        tags: row.tags,
        stats: row.stats,
        seoTitle: row.seoTitle,
        seoDescription: row.seoDescription,
        publishedAt: row.publishedAt?.toISOString() ?? null,
        image,
      },
    ];
  }

  private async load(tx: Tx, id: string) {
    const row = await this.repo.findById(tx, id);
    if (!row) throw new NotFoundError("Case study not found");
    return this.detail(row);
  }

  private recordStatus(tx: Tx, change: "published" | "unpublished", id: string, actorId: string) {
    return this.audit.record({ action: `cms.case_study.${change}`, actorId, entityType: "case_study", entityId: id }, tx);
  }

  /** The image as the admin and the website need it: a public URL, never the bucket key. Null until an image is uploaded. */
  private image(row: ImageColumns): CaseStudyImage {
    if (!row.imageKey || row.imageWidth === null || row.imageHeight === null) return null;
    return { url: this.storage.publicUrl(row.imageKey), alt: row.imageAlt ?? "", width: row.imageWidth, height: row.imageHeight };
  }

  private summary(row: SummaryRow) {
    return {
      id: row.id,
      slug: row.slug,
      title: row.title,
      client: row.client,
      service: row.service as ServiceId,
      category: row.category as ServiceId,
      status: row.status as CaseStudyStatus,
      sortOrder: row.sortOrder,
      publishedAt: row.publishedAt?.toISOString() ?? null,
      createdAt: row.createdAt.toISOString(),
      image: this.image(row),
    };
  }

  private detail(row: DetailRow) {
    return {
      ...this.summary(row),
      summary: row.summary,
      description: row.description,
      challenge: row.challenge,
      tags: row.tags,
      stats: row.stats,
      seoTitle: row.seoTitle,
      seoDescription: row.seoDescription,
      updatedAt: row.updatedAt.toISOString(),
    };
  }
}

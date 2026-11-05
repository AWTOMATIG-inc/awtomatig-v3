import { Injectable, Logger } from "@nestjs/common";

import { ConflictError, ValidationError } from "../../../shared/errors/app-error";
import { StorageService } from "../../../shared/storage/storage.service";
import {
  buildFileKey,
  type DetectedImage,
  detectImage,
  IMAGE_CACHE_CONTROL,
  MAX_IMAGE_BYTES,
  nextFileNumber,
} from "../domain/image";

/** How many neighbouring numbers an upload tries if a simultaneous upload took the one it picked. */
const KEY_ATTEMPTS = 5;

/**
 * The part of "upload or replace a picture" that is the same for every kind of content with images in the public bucket (case
 * study images, testimonial logos): checking the bytes, and storing a file under the next unused number without overwriting.
 * The row update in between differs per module, so it stays in each service. Order every caller follows: store the new file,
 * update the row, then discard the old file; discard the new file again if the row update fails.
 */
@Injectable()
export class PublicImageStore {
  private readonly logger = new Logger(PublicImageStore.name);

  constructor(private readonly storage: StorageService) {}

  /**
   * Works out what the file really is from its bytes (never from its name or the type the client sent). Throws a validation error
   * on the form field `field` when it is empty, over 5 MB, or not a PNG, JPEG or WebP.
   */
  check(buffer: Buffer, field: string): DetectedImage {
    if (buffer.length === 0) throw new ValidationError("The image file is empty", { [field]: "The image file is empty" });
    if (buffer.length > MAX_IMAGE_BYTES)
      throw new ValidationError("The image must be 5 MB or smaller", { [field]: "The image must be 5 MB or smaller" });
    const detected = detectImage(buffer);
    if (!detected) {
      const message = "Use a PNG, JPEG or WebP image";
      throw new ValidationError(message, { [field]: message });
    }
    return detected;
  }

  /**
   * Uploads to `<folder><name><N>.<ext>` where N is one more than the highest number already in the folder, and returns the key.
   * Never replaces a file and never reuses a number (see `nextFileNumber`).
   */
  async store(folder: string, name: string, buffer: Buffer, image: { contentType: string; extension: string }): Promise<string> {
    let number = nextFileNumber(await this.storage.listPublic(folder), name);
    for (let attempt = 0; attempt < KEY_ATTEMPTS; attempt++, number++) {
      const key = buildFileKey(folder, name, number, image.extension);
      if (await this.storage.putPublicIfAbsent(key, buffer, image.contentType, IMAGE_CACHE_CONTROL)) return key;
    }
    throw new ConflictError("Could not store the image. Try again.");
  }

  /** Best effort: a file that cannot be deleted is an orphan. Logged by owner and id, never by key, which can name the owner. */
  async discard(key: string, owner: string, ownerId: string): Promise<void> {
    try {
      await this.storage.deletePublic(key);
    } catch {
      this.logger.error(`Could not delete an unused image file of ${owner} ${ownerId}; remove it by hand`);
    }
  }
}

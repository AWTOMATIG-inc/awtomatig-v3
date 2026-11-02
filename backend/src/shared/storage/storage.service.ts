import {
  DeleteObjectCommand,
  GetObjectCommand,
  HeadObjectCommand,
  PutObjectCommand,
  S3Client,
  S3ServiceException,
} from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";
import { Inject, Injectable, Logger } from "@nestjs/common";

import { AppConfig } from "../config/app-config";
import type { Env } from "../config/env";
import { StorageUnavailableError } from "./storage.errors";

export const S3_CLIENT = Symbol("S3_CLIENT");

export interface StoredObject {
  size: number;
  contentType: string | undefined;
}

/** Builds the R2 client. R2 speaks the S3 API; the region is always "auto". */
export function createR2Client({ env }: { env: Env }): S3Client {
  const { R2_ACCOUNT_ID, R2_ACCESS_KEY_ID, R2_SECRET_ACCESS_KEY } = env;
  return new S3Client({
    region: "auto",
    endpoint: `https://${R2_ACCOUNT_ID}.r2.cloudflarestorage.com`,
    credentials: { accessKeyId: R2_ACCESS_KEY_ID, secretAccessKey: R2_SECRET_ACCESS_KEY },
    // Recent SDK versions add checksum headers by default, which R2 can reject and which break presigned links.
    requestChecksumCalculation: "WHEN_REQUIRED",
    responseChecksumValidation: "WHEN_REQUIRED",
  });
}

/**
 * Private file storage (resumes). Postgres keeps the object key; the bytes live here. Keys are built by the caller; anything
 * a user typed (a job title, a file name) is made safe first, never used as is. Every failure surfaces as `StorageUnavailableError`; details go to the log without the key.
 */
@Injectable()
export class StorageService {
  private readonly logger = new Logger(StorageService.name);
  private readonly bucket: string;

  constructor(
    @Inject(AppConfig) config: { env: Env },
    @Inject(S3_CLIENT) private readonly client: S3Client,
  ) {
    this.bucket = config.env.R2_PRIVATE_BUCKET;
  }

  async put(key: string, body: Buffer, contentType: string): Promise<void> {
    await this.run("put", () =>
      this.client.send(
        new PutObjectCommand({ Bucket: this.bucket, Key: key, Body: body, ContentType: contentType, ContentLength: body.length }),
      ),
    );
  }

  /**
   * Uploads only if nothing is stored under `key` yet, and says whether it did. R2 checks this itself (`If-None-Match: *`), so
   * two uploads of the same key at once cannot replace each other: one gets `true`, the other `false`.
   */
  async putIfAbsent(key: string, body: Buffer, contentType: string): Promise<boolean> {
    try {
      await this.client.send(
        new PutObjectCommand({
          Bucket: this.bucket,
          Key: key,
          Body: body,
          ContentType: contentType,
          ContentLength: body.length,
          IfNoneMatch: "*",
        }),
      );
      return true;
    } catch (error) {
      // 412: the key exists. 409: someone is writing the same key right now. Either way it is not ours.
      if (error instanceof S3ServiceException && [412, 409].includes(error.$metadata.httpStatusCode ?? 0)) return false;
      this.logger.error(`Storage put failed: ${describe(error)}`);
      throw new StorageUnavailableError();
    }
  }

  /** Removes an object. Deleting a key that does not exist is not an error. */
  async delete(key: string): Promise<void> {
    await this.run("delete", () => this.client.send(new DeleteObjectCommand({ Bucket: this.bucket, Key: key })));
  }

  /** Returns the object's size and type, or `null` when it does not exist. */
  async head(key: string): Promise<StoredObject | null> {
    try {
      const result = await this.client.send(new HeadObjectCommand({ Bucket: this.bucket, Key: key }));
      return { size: result.ContentLength ?? 0, contentType: result.ContentType };
    } catch (error) {
      if (error instanceof S3ServiceException && (error.$metadata.httpStatusCode === 404 || error.name === "NotFound"))
        return null;
      this.logger.error(`Storage head failed: ${describe(error)}`);
      throw new StorageUnavailableError();
    }
  }

  /** A time-limited link the browser can open directly. Nothing is fetched, so this does not prove the object exists. */
  async signedGetUrl(key: string, expiresInSeconds: number): Promise<{ url: string; expiresAt: Date }> {
    const url = await this.run("sign", () =>
      getSignedUrl(this.client, new GetObjectCommand({ Bucket: this.bucket, Key: key }), { expiresIn: expiresInSeconds }),
    );
    return { url, expiresAt: new Date(Date.now() + expiresInSeconds * 1000) };
  }

  private async run<T>(action: string, call: () => Promise<T>): Promise<T> {
    try {
      return await call();
    } catch (error) {
      this.logger.error(`Storage ${action} failed: ${describe(error)}`);
      throw new StorageUnavailableError();
    }
  }
}

// Error name and HTTP status only: provider messages can include the bucket, the key or the account.
function describe(error: unknown): string {
  if (error instanceof S3ServiceException) return `${error.name} (${error.$metadata.httpStatusCode ?? "no status"})`;
  return error instanceof Error ? error.name : "unknown error";
}

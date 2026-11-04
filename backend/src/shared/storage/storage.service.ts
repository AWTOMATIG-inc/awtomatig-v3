import {
  DeleteObjectCommand,
  DeleteObjectsCommand,
  GetObjectCommand,
  HeadObjectCommand,
  ListObjectsV2Command,
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
 * File storage: the private bucket (resumes, opened only through signed links) and the public bucket (case study images,
 * served from `R2_PUBLIC_BASE_URL`). Postgres keeps the object key; the bytes live here. Keys are built by the caller; anything
 * a user typed (a job title, a file name) is made safe first, never used as is. Every failure surfaces as `StorageUnavailableError`; details go to the log without the key.
 */
@Injectable()
export class StorageService {
  private readonly logger = new Logger(StorageService.name);
  private readonly bucket: string;
  private readonly publicBucket: string;
  private readonly publicBaseUrl: string;

  constructor(
    @Inject(AppConfig) config: { env: Env },
    @Inject(S3_CLIENT) private readonly client: S3Client,
  ) {
    this.bucket = config.env.R2_PRIVATE_BUCKET;
    this.publicBucket = config.env.R2_PUBLIC_BUCKET;
    this.publicBaseUrl = config.env.R2_PUBLIC_BASE_URL.replace(/\/+$/, "");
  }

  async put(key: string, body: Buffer, contentType: string): Promise<void> {
    await this.putTo(this.bucket, key, body, contentType);
  }

  /**
   * Uploads only if nothing is stored under `key` yet, and says whether it did. R2 checks this itself (`If-None-Match: *`), so
   * two uploads of the same key at once cannot replace each other: one gets `true`, the other `false`.
   */
  async putIfAbsent(key: string, body: Buffer, contentType: string): Promise<boolean> {
    return this.putToIfAbsent(this.bucket, key, body, contentType);
  }

  /** Removes an object. Deleting a key that does not exist is not an error. */
  async delete(key: string): Promise<void> {
    await this.run("delete", () => this.client.send(new DeleteObjectCommand({ Bucket: this.bucket, Key: key })));
  }

  // Public bucket (case study images). Objects are readable by anyone with the URL, so only content meant to be public goes here.

  async putPublic(key: string, body: Buffer, contentType: string, cacheControl?: string): Promise<void> {
    await this.putTo(this.publicBucket, key, body, contentType, cacheControl);
  }

  /** Like `putIfAbsent`, for the public bucket: a public file is never replaced, because a CDN may keep serving the old bytes. */
  async putPublicIfAbsent(key: string, body: Buffer, contentType: string, cacheControl?: string): Promise<boolean> {
    return this.putToIfAbsent(this.publicBucket, key, body, contentType, cacheControl);
  }

  async deletePublic(key: string): Promise<void> {
    await this.run("delete", () => this.client.send(new DeleteObjectCommand({ Bucket: this.publicBucket, Key: key })));
  }

  /** Returns the object's size and type from the public bucket, or `null` when it does not exist. */
  async headPublic(key: string): Promise<StoredObject | null> {
    return this.headIn(this.publicBucket, key);
  }

  /** Every key under a prefix, which must end with "/" (a bare or empty prefix would list the whole bucket). */
  async listPublic(prefix: string): Promise<string[]> {
    assertFolderPrefix(prefix);
    const keys: string[] = [];
    let token: string | undefined;
    do {
      const page = await this.run("list", () =>
        this.client.send(new ListObjectsV2Command({ Bucket: this.publicBucket, Prefix: prefix, ContinuationToken: token })),
      );
      for (const object of page.Contents ?? []) if (object.Key) keys.push(object.Key);
      token = page.IsTruncated ? page.NextContinuationToken : undefined;
    } while (token);
    return keys;
  }

  /** Deletes every object under a folder-style prefix and returns how many it removed. */
  async deletePublicPrefix(prefix: string): Promise<number> {
    const keys = await this.listPublic(prefix);
    for (let start = 0; start < keys.length; start += 1000) {
      const batch = keys.slice(start, start + 1000).map((Key) => ({ Key }));
      const result = await this.run("delete", () =>
        this.client.send(new DeleteObjectsCommand({ Bucket: this.publicBucket, Delete: { Objects: batch, Quiet: true } })),
      );
      if (result.Errors?.length) {
        this.logger.error(`Storage delete failed for ${result.Errors.length} object(s)`);
        throw new StorageUnavailableError();
      }
    }
    return keys.length;
  }

  /** The address a browser uses to load a public object. Nothing is fetched, so this does not prove the object exists. */
  publicUrl(key: string): string {
    return `${this.publicBaseUrl}/${key.split("/").map(encodeURIComponent).join("/")}`;
  }

  /** Returns the object's size and type, or `null` when it does not exist. */
  async head(key: string): Promise<StoredObject | null> {
    return this.headIn(this.bucket, key);
  }

  /** A time-limited link the browser can open directly. Nothing is fetched, so this does not prove the object exists. */
  async signedGetUrl(key: string, expiresInSeconds: number): Promise<{ url: string; expiresAt: Date }> {
    const url = await this.run("sign", () =>
      getSignedUrl(this.client, new GetObjectCommand({ Bucket: this.bucket, Key: key }), { expiresIn: expiresInSeconds }),
    );
    return { url, expiresAt: new Date(Date.now() + expiresInSeconds * 1000) };
  }

  private async putTo(bucket: string, key: string, body: Buffer, contentType: string, cacheControl?: string): Promise<void> {
    await this.run("put", () =>
      this.client.send(
        new PutObjectCommand({
          Bucket: bucket,
          Key: key,
          Body: body,
          ContentType: contentType,
          ContentLength: body.length,
          CacheControl: cacheControl,
        }),
      ),
    );
  }

  private async putToIfAbsent(
    bucket: string,
    key: string,
    body: Buffer,
    contentType: string,
    cacheControl?: string,
  ): Promise<boolean> {
    try {
      await this.client.send(
        new PutObjectCommand({
          Bucket: bucket,
          Key: key,
          Body: body,
          ContentType: contentType,
          ContentLength: body.length,
          CacheControl: cacheControl,
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

  private async headIn(bucket: string, key: string): Promise<StoredObject | null> {
    try {
      const result = await this.client.send(new HeadObjectCommand({ Bucket: bucket, Key: key }));
      return { size: result.ContentLength ?? 0, contentType: result.ContentType };
    } catch (error) {
      if (error instanceof S3ServiceException && (error.$metadata.httpStatusCode === 404 || error.name === "NotFound"))
        return null;
      this.logger.error(`Storage head failed: ${describe(error)}`);
      throw new StorageUnavailableError();
    }
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

function assertFolderPrefix(prefix: string): void {
  if (prefix.length < 2 || !prefix.endsWith("/") || prefix.startsWith("/") || prefix.includes("..")) {
    throw new Error("A storage prefix must be a folder path ending with '/'");
  }
}

// Error name and HTTP status only: provider messages can include the bucket, the key or the account.
function describe(error: unknown): string {
  if (error instanceof S3ServiceException) return `${error.name} (${error.$metadata.httpStatusCode ?? "no status"})`;
  return error instanceof Error ? error.name : "unknown error";
}

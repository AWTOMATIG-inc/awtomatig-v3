import {
  DeleteObjectCommand,
  DeleteObjectsCommand,
  HeadObjectCommand,
  ListObjectsV2Command,
  PutObjectCommand,
  S3ServiceException,
  type S3Client,
} from "@aws-sdk/client-s3";

import type { Env } from "../config/env";
import { StorageUnavailableError } from "./storage.errors";
import { createR2Client, StorageService } from "./storage.service";

const env = {
  R2_ACCOUNT_ID: "acct",
  R2_ACCESS_KEY_ID: "key",
  R2_SECRET_ACCESS_KEY: "secret",
  R2_PRIVATE_BUCKET: "private-bucket",
  R2_PUBLIC_BUCKET: "public-bucket",
  R2_PUBLIC_BASE_URL: "https://cdn.test/",
} as Env;

function setup(send: jest.Mock) {
  return new StorageService({ env }, { send } as unknown as S3Client);
}

const firstCommand = (send: jest.Mock): unknown => (send.mock.calls as unknown[][])[0]?.[0];

function s3Error(name: string, status: number) {
  return new S3ServiceException({
    name,
    $fault: "client",
    $metadata: { httpStatusCode: status },
    message: "secret-bucket detail",
  });
}

describe("StorageService", () => {
  it("uploads to the private bucket with the content type", async () => {
    const send = jest.fn().mockResolvedValue({});
    await setup(send).put("career/a/b.pdf", Buffer.from("%PDF-1"), "application/pdf");

    const command = firstCommand(send) as PutObjectCommand;
    expect(command).toBeInstanceOf(PutObjectCommand);
    expect(command.input).toMatchObject({
      Bucket: "private-bucket",
      Key: "career/a/b.pdf",
      ContentType: "application/pdf",
      ContentLength: 6,
    });
  });

  it("uploads only if the key is free, and says so", async () => {
    const send = jest.fn().mockResolvedValue({});
    await expect(setup(send).putIfAbsent("career/a/b.pdf", Buffer.from("%PDF-1"), "application/pdf")).resolves.toBe(true);

    const command = firstCommand(send) as PutObjectCommand;
    expect(command.input).toMatchObject({ Bucket: "private-bucket", Key: "career/a/b.pdf", IfNoneMatch: "*" });
  });

  it("returns false, without throwing, when the key already exists or is being written", async () => {
    const send = jest
      .fn()
      .mockRejectedValueOnce(s3Error("PreconditionFailed", 412))
      .mockRejectedValueOnce(s3Error("ConditionalRequestConflict", 409));
    const storage = setup(send);

    await expect(storage.putIfAbsent("k", Buffer.from("x"), "text/plain")).resolves.toBe(false);
    await expect(storage.putIfAbsent("k", Buffer.from("x"), "text/plain")).resolves.toBe(false);
  });

  it("treats any other failure of a conditional upload as unavailable, without provider details", async () => {
    const send = jest.fn().mockRejectedValue(s3Error("InternalError", 500));
    const failure = await setup(send)
      .putIfAbsent("k", Buffer.from("x"), "text/plain")
      .catch((error: unknown) => error);

    expect(failure).toBeInstanceOf(StorageUnavailableError);
    expect((failure as Error).message).not.toMatch(/secret-bucket/);
  });

  it("deletes by key", async () => {
    const send = jest.fn().mockResolvedValue({});
    await setup(send).delete("career/a/b.pdf");
    expect(firstCommand(send)).toBeInstanceOf(DeleteObjectCommand);
  });

  it("returns size and type from head, and null when the object is missing", async () => {
    const send = jest
      .fn()
      .mockResolvedValueOnce({ ContentLength: 12, ContentType: "application/pdf" })
      .mockRejectedValueOnce(s3Error("NotFound", 404));
    const storage = setup(send);

    await expect(storage.head("k")).resolves.toEqual({ size: 12, contentType: "application/pdf" });
    await expect(storage.head("k")).resolves.toBeNull();
    expect(firstCommand(send)).toBeInstanceOf(HeadObjectCommand);
  });

  it("hides provider details when storage fails", async () => {
    const send = jest.fn().mockRejectedValue(s3Error("InternalError", 500));
    const failure = await setup(send)
      .put("k", Buffer.from("x"), "text/plain")
      .catch((error: unknown) => error);

    expect(failure).toBeInstanceOf(StorageUnavailableError);
    expect((failure as Error).message).not.toMatch(/secret-bucket/);
  });

  it("treats a head failure other than 404 as unavailable", async () => {
    const send = jest.fn().mockRejectedValue(s3Error("AccessDenied", 403));
    await expect(setup(send).head("k")).rejects.toBeInstanceOf(StorageUnavailableError);
  });

  describe("public bucket", () => {
    it("uploads to the public bucket, never the private one", async () => {
      const send = jest.fn().mockResolvedValue({});
      await setup(send).putPublic("case-study/a/image1.png", Buffer.from("x"), "image/png");

      const command = firstCommand(send) as PutObjectCommand;
      expect(command.input).toMatchObject({ Bucket: "public-bucket", Key: "case-study/a/image1.png", ContentType: "image/png" });
    });

    it("uploads only if the key is free, and says so", async () => {
      const send = jest.fn().mockResolvedValueOnce({}).mockRejectedValueOnce(s3Error("PreconditionFailed", 412));
      const storage = setup(send);

      await expect(storage.putPublicIfAbsent("k", Buffer.from("x"), "image/png")).resolves.toBe(true);
      await expect(storage.putPublicIfAbsent("k", Buffer.from("x"), "image/png")).resolves.toBe(false);
      expect(firstCommand(send)).toMatchObject({ input: { Bucket: "public-bucket", IfNoneMatch: "*" } });
    });

    it("sends the cache header when given one, and none otherwise", async () => {
      const send = jest.fn().mockResolvedValue({});
      const storage = setup(send);
      await storage.putPublicIfAbsent("a", Buffer.from("x"), "image/png", "public, max-age=31536000, immutable");
      await storage.putPublic("b", Buffer.from("x"), "image/png");

      const [first, second] = (send.mock.calls as unknown[][]).map((call) => call[0] as PutObjectCommand);
      expect(first?.input.CacheControl).toBe("public, max-age=31536000, immutable");
      expect(second?.input.CacheControl).toBeUndefined();
    });

    it("deletes and heads in the public bucket", async () => {
      const send = jest.fn().mockResolvedValueOnce({}).mockResolvedValueOnce({ ContentLength: 7, ContentType: "image/png" });
      const storage = setup(send);

      await storage.deletePublic("k");
      await expect(storage.headPublic("k")).resolves.toEqual({ size: 7, contentType: "image/png" });
      const calls = (send.mock.calls as unknown[][]).map((call) => call[0]);
      expect(calls[0]).toBeInstanceOf(DeleteObjectCommand);
      expect(calls[0]).toMatchObject({ input: { Bucket: "public-bucket" } });
      expect(calls[1]).toBeInstanceOf(HeadObjectCommand);
      expect(calls[1]).toMatchObject({ input: { Bucket: "public-bucket" } });
    });

    it("lists every page under a prefix", async () => {
      const send = jest
        .fn()
        .mockResolvedValueOnce({ Contents: [{ Key: "case-study/a/image1.png" }], IsTruncated: true, NextContinuationToken: "t" })
        .mockResolvedValueOnce({ Contents: [{ Key: "case-study/a/image2.png" }], IsTruncated: false });

      await expect(setup(send).listPublic("case-study/a/")).resolves.toEqual([
        "case-study/a/image1.png",
        "case-study/a/image2.png",
      ]);
      const calls = (send.mock.calls as unknown[][]).map((call) => call[0]);
      expect(calls[0]).toBeInstanceOf(ListObjectsV2Command);
      expect(calls[1]).toMatchObject({ input: { Prefix: "case-study/a/", ContinuationToken: "t" } });
    });

    it("deletes a whole folder in batches and reports the count", async () => {
      const keys = Array.from({ length: 1001 }, (_, i) => ({ Key: `case-study/a/image${i}.png` }));
      const send = jest.fn().mockResolvedValueOnce({ Contents: keys, IsTruncated: false }).mockResolvedValue({});

      await expect(setup(send).deletePublicPrefix("case-study/a/")).resolves.toBe(1001);
      const deletes = (send.mock.calls as unknown[][]).map((call) => call[0]).filter((c) => c instanceof DeleteObjectsCommand);
      expect(deletes).toHaveLength(2);
      expect((deletes[0] as DeleteObjectsCommand).input.Delete?.Objects).toHaveLength(1000);
    });

    it("fails when the provider reports a delete error", async () => {
      const send = jest
        .fn()
        .mockResolvedValueOnce({ Contents: [{ Key: "case-study/a/image1.png" }] })
        .mockResolvedValueOnce({ Errors: [{ Key: "case-study/a/image1.png", Code: "AccessDenied" }] });

      await expect(setup(send).deletePublicPrefix("case-study/a/")).rejects.toBeInstanceOf(StorageUnavailableError);
    });

    it("refuses a prefix that could reach the whole bucket", async () => {
      const send = jest.fn();
      const storage = setup(send);

      for (const prefix of ["", "/", "case-study", "/case-study/", "case-study/../"]) {
        await expect(storage.deletePublicPrefix(prefix)).rejects.toThrow(/folder path/);
      }
      expect(send).not.toHaveBeenCalled();
    });

    it("builds the public URL from the base URL, encoding each part and ignoring a trailing slash", () => {
      const storage = setup(jest.fn());
      expect(storage.publicUrl("case-study/royal-safari-tours/image1.png")).toBe(
        "https://cdn.test/case-study/royal-safari-tours/image1.png",
      );
      expect(storage.publicUrl("case-study/a b/image#1.png")).toBe("https://cdn.test/case-study/a%20b/image%231.png");
    });
  });

  it("signs a GET link without calling the network", async () => {
    const storage = new StorageService({ env }, createR2Client({ env }));
    const { url, expiresAt } = await storage.signedGetUrl("career/a/b.pdf", 300);

    const parsed = new URL(url);
    expect(parsed.hostname).toBe("private-bucket.acct.r2.cloudflarestorage.com");
    expect(parsed.pathname).toBe("/career/a/b.pdf");
    expect(parsed.searchParams.get("X-Amz-Expires")).toBe("300");
    expect(parsed.searchParams.get("X-Amz-Signature")).toBeTruthy();
    expect(parsed.searchParams.has("x-amz-checksum-mode")).toBe(false);
    expect(expiresAt.getTime()).toBeGreaterThan(Date.now());
  });
});

import { DeleteObjectCommand, HeadObjectCommand, PutObjectCommand, S3ServiceException, type S3Client } from "@aws-sdk/client-s3";

import type { Env } from "../config/env";
import { StorageUnavailableError } from "./storage.errors";
import { createR2Client, StorageService } from "./storage.service";

const env = {
  R2_ACCOUNT_ID: "acct",
  R2_ACCESS_KEY_ID: "key",
  R2_SECRET_ACCESS_KEY: "secret",
  R2_PRIVATE_BUCKET: "private-bucket",
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

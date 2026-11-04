import { imageFolder } from "./case-study";

/** The showcase image is roughly 551x525. Anything bigger than the upload cap is refused while it streams (see bootstrap.ts). */
export const MAX_IMAGE_BYTES = 5 * 1024 * 1024;

/** A sanity limit on the pixel size, so a file claiming absurd dimensions is refused. */
export const MAX_IMAGE_DIMENSION = 8000;

/**
 * Files are never overwritten (a CDN may keep the old bytes of a reused address), so each key is unique and can be cached for
 * good by browsers and the CDN.
 */
export const IMAGE_CACHE_CONTROL = "public, max-age=31536000, immutable";

export const ALT_MAX_LENGTH = 200;

export interface DetectedImage {
  /** The type found in the file itself, not the one the client claimed. */
  contentType: "image/png" | "image/jpeg" | "image/webp";
  extension: "png" | "jpg" | "webp";
  width: number;
  height: number;
}

const PNG_SIGNATURE = Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]);

/**
 * Works out what an uploaded file really is from its first bytes, and reads its pixel size, with no image library. Returns `null`
 * for anything that is not a PNG, JPEG or WebP, or that is truncated or has impossible dimensions. The file name and the content
 * type the client sent are never trusted.
 */
export function detectImage(buffer: Buffer): DetectedImage | null {
  const found = readPng(buffer) ?? readJpeg(buffer) ?? readWebp(buffer);
  if (!found) return null;
  const { width, height } = found;
  if (width < 1 || height < 1 || width > MAX_IMAGE_DIMENSION || height > MAX_IMAGE_DIMENSION) return null;
  return found;
}

function readPng(buffer: Buffer): DetectedImage | null {
  // Signature, then the IHDR chunk (length, "IHDR", width, height) must come first.
  if (buffer.length < 24 || !buffer.subarray(0, 8).equals(PNG_SIGNATURE) || buffer.toString("ascii", 12, 16) !== "IHDR")
    return null;
  return { contentType: "image/png", extension: "png", width: buffer.readUInt32BE(16), height: buffer.readUInt32BE(20) };
}

function readJpeg(buffer: Buffer): DetectedImage | null {
  if (buffer.length < 4 || buffer[0] !== 0xff || buffer[1] !== 0xd8) return null;
  let offset = 2;
  while (offset + 4 <= buffer.length) {
    if (buffer[offset] !== 0xff) return null;
    const marker = buffer[offset + 1]!;
    if (marker === 0xff) {
      offset += 1; // fill byte
      continue;
    }
    // Markers with no length: padding, restart markers, start of image.
    if (marker === 0x00 || marker === 0x01 || marker === 0xd8 || (marker >= 0xd0 && marker <= 0xd7)) {
      offset += 2;
      continue;
    }
    if (marker === 0xd9) return null; // end of image before any frame header
    const length = buffer.readUInt16BE(offset + 2);
    if (length < 2) return null;
    // Start-of-frame markers carry the size (C4, C8 and CC share the range but are not frame headers).
    if (marker >= 0xc0 && marker <= 0xcf && marker !== 0xc4 && marker !== 0xc8 && marker !== 0xcc) {
      if (offset + 9 > buffer.length) return null;
      return {
        contentType: "image/jpeg",
        extension: "jpg",
        height: buffer.readUInt16BE(offset + 5),
        width: buffer.readUInt16BE(offset + 7),
      };
    }
    offset += 2 + length;
  }
  return null;
}

function readWebp(buffer: Buffer): DetectedImage | null {
  if (buffer.length < 30 || buffer.toString("ascii", 0, 4) !== "RIFF" || buffer.toString("ascii", 8, 12) !== "WEBP") return null;
  const found = (width: number, height: number): DetectedImage => ({
    contentType: "image/webp",
    extension: "webp",
    width,
    height,
  });
  switch (buffer.toString("ascii", 12, 16)) {
    case "VP8 ": // lossy: frame tag (3 bytes), start code 9D 01 2A, then 14-bit width and height
      if (buffer[23] !== 0x9d || buffer[24] !== 0x01 || buffer[25] !== 0x2a) return null;
      return found(buffer.readUInt16LE(26) & 0x3fff, buffer.readUInt16LE(28) & 0x3fff);
    case "VP8L": {
      // lossless: signature byte 0x2F, then 14 bits each of width - 1 and height - 1
      if (buffer[20] !== 0x2f) return null;
      const bits = buffer.readUInt32LE(21);
      return found((bits & 0x3fff) + 1, ((bits >>> 14) & 0x3fff) + 1);
    }
    case "VP8X": // extended: 24-bit canvas width - 1 and height - 1
      return found(buffer.readUIntLE(24, 3) + 1, buffer.readUIntLE(27, 3) + 1);
    default:
      return null;
  }
}

const IMAGE_KEY = /image(\d+)\.[a-z0-9]+$/;

/** The key of image number `n` of a study, for example `case-study/royal-safari-tours/image2.png`. */
export function buildImageKey(slug: string, n: number, extension: string): string {
  return `${imageFolder(slug)}image${n}.${extension}`;
}

/**
 * The number the next upload takes: one more than the highest already in the folder (orphans from a failed cleanup included).
 * Never the lowest free number: a deleted `image1` must not come back, or a cache could show the old picture at that address.
 */
export function nextImageNumber(keys: string[]): number {
  let highest = 0;
  for (const key of keys) {
    const match = IMAGE_KEY.exec(key);
    if (match) highest = Math.max(highest, Number(match[1]));
  }
  return highest + 1;
}

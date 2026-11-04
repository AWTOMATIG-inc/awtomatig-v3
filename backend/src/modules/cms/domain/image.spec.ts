import { jpeg, png, webp, webpLossless, webpLossy } from "../../../../test/support/images";
import { buildImageKey, detectImage, MAX_IMAGE_DIMENSION, nextImageNumber } from "./image";

describe("detectImage", () => {
  it("reads a PNG's type and size", () => {
    expect(detectImage(png(551, 525))).toEqual({ contentType: "image/png", extension: "png", width: 551, height: 525 });
  });

  it("reads a JPEG's size past the segments before its frame header", () => {
    expect(detectImage(jpeg(1102, 1050))).toEqual({ contentType: "image/jpeg", extension: "jpg", width: 1102, height: 1050 });
  });

  it("reads all three WebP layouts", () => {
    expect(detectImage(webp(800, 600))).toEqual({ contentType: "image/webp", extension: "webp", width: 800, height: 600 });
    expect(detectImage(webpLossless(800, 600))).toMatchObject({ extension: "webp", width: 800, height: 600 });
    expect(detectImage(webpLossy(800, 600))).toMatchObject({ extension: "webp", width: 800, height: 600 });
  });

  it("does not care about the rest of the file", () => {
    expect(detectImage(png(10, 10, 100_000))).toMatchObject({ width: 10, height: 10 });
    expect(detectImage(jpeg(10, 10, 100_000))).toMatchObject({ width: 10, height: 10 });
  });

  it("refuses things that are not PNG, JPEG or WebP, whatever they are called", () => {
    expect(detectImage(Buffer.from("%PDF-1.7 not an image at all, but long enough to read"))).toBeNull();
    expect(detectImage(Buffer.from("GIF89a\x01\x00\x01\x00\x00\x00\x00;".padEnd(40, " ")))).toBeNull();
    expect(detectImage(Buffer.from("<svg xmlns='http://www.w3.org/2000/svg' width='10' height='10'></svg>"))).toBeNull();
    expect(detectImage(Buffer.from("MZ executable".padEnd(40, "\0")))).toBeNull();
    expect(detectImage(Buffer.alloc(0))).toBeNull();
    expect(detectImage(Buffer.alloc(64))).toBeNull();
  });

  it("refuses truncated files without throwing", () => {
    for (const buffer of [png(10, 10), jpeg(10, 10), webp(10, 10), webpLossless(10, 10), webpLossy(10, 10)]) {
      for (let length = 0; length < buffer.length - 1; length++) {
        expect(() => detectImage(buffer.subarray(0, length))).not.toThrow();
      }
    }
    expect(detectImage(png(10, 10).subarray(0, 20))).toBeNull();
    expect(detectImage(jpeg(10, 10).subarray(0, 25))).toBeNull();
  });

  it("refuses a JPEG that ends before any frame header", () => {
    expect(detectImage(Buffer.from([0xff, 0xd8, 0xff, 0xd9, 0x00, 0x00]))).toBeNull();
  });

  it("refuses a WebP whose chunk it does not know, or whose lossy start code is wrong", () => {
    const unknown = webp(10, 10);
    unknown.write("ABCD", 12, "ascii");
    expect(detectImage(unknown)).toBeNull();
    const badStart = webpLossy(10, 10);
    badStart[23] = 0;
    expect(detectImage(badStart)).toBeNull();
    const badLossless = webpLossless(10, 10);
    badLossless[20] = 0;
    expect(detectImage(badLossless)).toBeNull();
  });

  it("refuses zero or absurd dimensions", () => {
    expect(detectImage(png(0, 10))).toBeNull();
    expect(detectImage(png(10, 0))).toBeNull();
    expect(detectImage(png(MAX_IMAGE_DIMENSION, MAX_IMAGE_DIMENSION))).not.toBeNull();
    expect(detectImage(png(MAX_IMAGE_DIMENSION + 1, 10))).toBeNull();
    expect(detectImage(png(10, 4_000_000_000))).toBeNull();
  });
});

describe("buildImageKey", () => {
  it("puts the image in the study's folder with a number and the real extension", () => {
    expect(buildImageKey("royal-safari-tours", 1, "png")).toBe("case-study/royal-safari-tours/image1.png");
    expect(buildImageKey("royal-safari-tours", 12, "webp")).toBe("case-study/royal-safari-tours/image12.webp");
  });
});

describe("nextImageNumber", () => {
  it("starts at 1 for an empty folder", () => {
    expect(nextImageNumber([])).toBe(1);
  });

  it("is one more than the highest number, never the first free one", () => {
    expect(nextImageNumber(["case-study/a/image1.png"])).toBe(2);
    expect(nextImageNumber(["case-study/a/image2.jpg"])).toBe(3);
    // image1 was deleted by a replace: it must not come back
    expect(nextImageNumber(["case-study/a/image3.png", "case-study/a/image5.webp"])).toBe(6);
  });

  it("counts orphans from a failed cleanup, in any extension, and ignores other files", () => {
    expect(nextImageNumber(["case-study/a/image7.png", "case-study/a/image2.jpg"])).toBe(8);
    expect(nextImageNumber(["case-study/a/notes.txt", "case-study/a/image.png", "case-study/a/image-2.png"])).toBe(1);
  });
});

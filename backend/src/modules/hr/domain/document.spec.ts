import {
  detectDocument,
  displayFileName,
  documentFieldsSchema,
  documentKeyCandidates,
  employeeFolder,
  updateDocumentSchema,
} from "./document";

describe("detectDocument", () => {
  it("recognises PDF, PNG, JPEG and WebP by their first bytes", () => {
    expect(detectDocument(Buffer.from("%PDF-1.7\n..."))).toEqual({ contentType: "application/pdf", extension: "pdf" });
    expect(detectDocument(Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a, 0, 0]))).toEqual({
      contentType: "image/png",
      extension: "png",
    });
    expect(detectDocument(Buffer.from([0xff, 0xd8, 0xff, 0xe0, 0, 0]))).toEqual({ contentType: "image/jpeg", extension: "jpg" });
    expect(detectDocument(Buffer.from("RIFF\0\0\0\0WEBPVP8 "))).toEqual({ contentType: "image/webp", extension: "webp" });
  });

  it("refuses everything else, whatever the name says", () => {
    expect(detectDocument(Buffer.from("MZ\x90\x00 an executable"))).toBeNull();
    expect(detectDocument(Buffer.from("<html><script>alert(1)</script>"))).toBeNull();
    expect(detectDocument(Buffer.from("PK\x03\x04 a zip or docx"))).toBeNull();
    expect(detectDocument(Buffer.from("  %PDF-1.7"))).toBeNull();
    expect(detectDocument(Buffer.alloc(0))).toBeNull();
    expect(detectDocument(Buffer.from("RIFF\0\0\0\0WAVEfmt "))).toBeNull();
  });
});

describe("employeeFolder", () => {
  it("joins the EMP ID and a readable slug of the name", () => {
    expect(employeeFolder(1, "Jane Doe")).toBe("EMP-0001-jane-doe");
    expect(employeeFolder(42, "  Md. Rahim Uddin  ")).toBe("EMP-0042-md-rahim-uddin");
    expect(employeeFolder(7, "José Ñandú")).toBe("EMP-0007-jose-nandu");
  });

  it("falls back to the EMP ID alone for a name with no Latin letters or digits", () => {
    expect(employeeFolder(3, "রহিম উদ্দিন")).toBe("EMP-0003");
    expect(employeeFolder(3, "...")).toBe("EMP-0003");
  });

  it("keeps long names short and never ends with a dash", () => {
    const folder = employeeFolder(9, `${"a".repeat(39)} bbbbbbbb`);
    expect(folder.length).toBeLessThanOrEqual("EMP-0009-".length + 40);
    expect(folder.endsWith("-")).toBe(false);
  });

  it("cannot be turned into a path", () => {
    expect(employeeFolder(1, "../../etc/passwd")).toBe("EMP-0001-etc-passwd");
    expect(employeeFolder(1, "a/b\\c")).toBe("EMP-0001-a-b-c");
  });
});

describe("documentKeyCandidates", () => {
  const id = "01a1af61-92b5-7f13-a651-242289f00a11";
  const keys = (filename: string) => documentKeyCandidates("EMP-0001-jane-doe", "nid", filename, "pdf", id);

  it("builds hrm/employees/<employee>/<type>/<file>, then two longer names", () => {
    expect(keys("jane-nid.pdf")).toEqual([
      "hrm/employees/EMP-0001-jane-doe/nid/jane-nid.pdf",
      "hrm/employees/EMP-0001-jane-doe/nid/jane-nid-89f00a11.pdf",
      `hrm/employees/EMP-0001-jane-doe/nid/jane-nid-${id.replace(/-/g, "")}.pdf`,
    ]);
  });

  it("uses the detected extension, not the one in the name", () => {
    expect(documentKeyCandidates("EMP-0001", "passport", "scan.exe", "jpg", id)[0]).toBe(
      "hrm/employees/EMP-0001/passport/scan.jpg",
    );
    expect(documentKeyCandidates("EMP-0001", "passport", "scan", "png", id)[0]).toBe("hrm/employees/EMP-0001/passport/scan.png");
  });

  it("cannot escape the folder or hide a file", () => {
    for (const hostile of ["../../other/secret.pdf", "..\\..\\x.pdf", "/etc/passwd", ".hidden.pdf", "a\0b.pdf", "..."]) {
      for (const key of keys(hostile)) {
        expect(key.startsWith("hrm/employees/EMP-0001-jane-doe/nid/")).toBe(true);
        const file = key.slice("hrm/employees/EMP-0001-jane-doe/nid/".length);
        expect(file).not.toMatch(/[\\/]/);
        expect(file.startsWith(".")).toBe(false);
        expect(file).not.toContain("..");
      }
    }
  });

  it("keeps names in any script and falls back when nothing readable is left", () => {
    expect(keys("রহিম এনআইডি.pdf")[0]).toBe("hrm/employees/EMP-0001-jane-doe/nid/রহিম এনআইডি.pdf");
    expect(keys("???.pdf")[0]).toBe("hrm/employees/EMP-0001-jane-doe/nid/document.pdf");
  });
});

describe("displayFileName", () => {
  it("drops any folder part and bounds the length", () => {
    expect(displayFileName("C:\\Users\\x\\scan.pdf")).toBe("scan.pdf");
    expect(displayFileName("/a/b/scan.pdf")).toBe("scan.pdf");
    expect(displayFileName("")).toBe("document");
    expect(displayFileName("x".repeat(300)).length).toBe(200);
  });
});

describe("documentFieldsSchema", () => {
  it("accepts the types, defaults the text and needs a title only for Other", () => {
    expect(documentFieldsSchema.parse({ docType: "nid" })).toEqual({ docType: "nid", title: "", note: "" });
    expect(documentFieldsSchema.safeParse({ docType: "other" }).success).toBe(false);
    expect(documentFieldsSchema.safeParse({ docType: "other", title: "   " }).success).toBe(false);
    expect(documentFieldsSchema.safeParse({ docType: "other", title: "Visa" }).success).toBe(true);
    expect(documentFieldsSchema.safeParse({ docType: "licence" }).success).toBe(false);
  });

  it("checks the expiry date and the lengths", () => {
    expect(documentFieldsSchema.safeParse({ docType: "passport", expiresOn: "2030-06-30" }).success).toBe(true);
    expect(documentFieldsSchema.safeParse({ docType: "passport", expiresOn: "2030-02-31" }).success).toBe(false);
    expect(documentFieldsSchema.safeParse({ docType: "passport", title: "x".repeat(101) }).success).toBe(false);
    expect(documentFieldsSchema.safeParse({ docType: "passport", note: "x".repeat(301) }).success).toBe(false);
  });
});

describe("updateDocumentSchema", () => {
  it("needs a field, and lets the expiry be cleared with null", () => {
    expect(updateDocumentSchema.safeParse({}).success).toBe(false);
    expect(updateDocumentSchema.parse({ expiresOn: null })).toEqual({ expiresOn: null });
    expect(updateDocumentSchema.parse({ title: " Visa ", docType: "nid" })).toEqual({ title: "Visa" });
  });
});

import {
  applicationPayloadSchema,
  displayFileName,
  MAX_RESUME_BYTES,
  normalizeEmail,
  normalizePhone,
  resumeFileName,
  resumeFolder,
  resumeKeyCandidates,
  resumeProblem,
  updateApplicationSchema,
} from "./application";

const pdf = (extra = "") => Buffer.from(`%PDF-1.7\n${extra}`);

const valid = {
  submissionId: "6f1c3f4a-0000-4000-8000-000000000000",
  fullName: "  Rahim Uddin ",
  email: " Rahim@Example.com ",
  phone: "01712345678",
  educations: [
    { degree: "BSc", fieldOfStudy: "CSE", institution: "AUST", completedOn: "2025-11-20" },
    { degree: "MSc", fieldOfStudy: "CSE", institution: "BUET", ongoing: true },
  ],
  consent: true,
};

describe("normalizePhone", () => {
  it.each([
    "01712345678",
    "+8801712345678",
    "8801712345678",
    "008801712345678",
    "+88 01712-345678",
    "+880 (1712) 345 678",
    "01712 345 678",
    "1712345678",
  ])("makes %s the same Bangladesh number", (raw) => {
    expect(normalizePhone(raw)).toBe("8801712345678");
  });

  it("accepts every mobile prefix from 013 to 019 and rejects 010 to 012", () => {
    for (const prefix of ["013", "014", "015", "016", "017", "018", "019"]) {
      expect(normalizePhone(`${prefix}12345678`)).toBe(`880${prefix.slice(1)}12345678`);
    }
    for (const prefix of ["010", "011", "012"]) expect(normalizePhone(`${prefix}12345678`)).toBeNull();
  });

  it("keeps other countries when they carry a + or 00 prefix", () => {
    expect(normalizePhone("+1 (415) 555-2671")).toBe("14155552671");
    expect(normalizePhone("0044 7911 123456")).toBe("447911123456");
  });

  it.each([
    "",
    "abc",
    "0171234567", // one digit short
    "017123456789", // one digit long
    "+88017123456", // Bangladesh, too short
    "+880 2 9876543", // a landline
    "4155552671", // another country with no prefix
    "+0123456789", // a country code never starts with 0
    "1712-345-678-9",
    "01712345678x",
  ])("rejects %j", (raw) => {
    expect(normalizePhone(raw)).toBeNull();
  });
});

describe("normalizeEmail", () => {
  it("trims and lowercases", () => {
    expect(normalizeEmail("  Rahim@Example.COM ")).toBe("rahim@example.com");
  });
});

describe("resumeProblem", () => {
  const file = (patch: Partial<{ filename: string; mimetype: string; buffer: Buffer }> = {}) => ({
    filename: "CV.pdf",
    mimetype: "application/pdf",
    buffer: pdf(),
    ...patch,
  });

  it("accepts a real PDF, whatever the case of the extension", () => {
    expect(resumeProblem(file())).toBeNull();
    expect(resumeProblem(file({ filename: "MY CV.PDF" }))).toBeNull();
  });

  it("needs a file", () => {
    expect(resumeProblem(null)).toMatch(/Attach/);
  });

  it("rejects an empty file and one over 5 MB, accepting exactly 5 MB", () => {
    expect(resumeProblem(file({ buffer: Buffer.alloc(0) }))).toMatch(/empty/);
    expect(resumeProblem(file({ buffer: Buffer.concat([pdf(), Buffer.alloc(MAX_RESUME_BYTES)]) }))).toMatch(/5 MB/);
    expect(resumeProblem(file({ buffer: Buffer.concat([pdf(), Buffer.alloc(MAX_RESUME_BYTES - pdf().length)]) }))).toBeNull();
  });

  it("rejects a wrong extension, a wrong type, and a file that only claims to be a PDF", () => {
    expect(resumeProblem(file({ filename: "cv.docx" }))).toMatch(/PDF/);
    expect(resumeProblem(file({ filename: "cv.pdf.exe" }))).toMatch(/PDF/);
    expect(resumeProblem(file({ mimetype: "text/plain" }))).toMatch(/PDF/);
    expect(resumeProblem(file({ buffer: Buffer.from("MZ\u0090 not a pdf") }))).toMatch(/not a valid PDF/);
    expect(resumeProblem(file({ buffer: Buffer.from(" %PDF-1.7") }))).toMatch(/not a valid PDF/);
  });
});

describe("displayFileName and resumeKey", () => {
  it("keeps only the file name, without folders or control characters", () => {
    expect(displayFileName("C:\\Users\\me\\My CV.pdf")).toBe("My CV.pdf");
    expect(displayFileName("../../etc/passwd.pdf")).toBe("passwd.pdf");
    expect(displayFileName("a\u0000b\nc.pdf")).toBe("abc.pdf");
    expect(displayFileName("")).toBe("resume.pdf");
    expect(displayFileName(`${"x".repeat(300)}.pdf`).length).toBe(200);
  });

  it("keeps the job title as the folder and the candidate's file name as the file", () => {
    const [first] = resumeKeyCandidates("Project Manager", "My CV.pdf", "0192a3b4-c5d6-7e8f-9a0b-1c2d3e4f5a6b");
    expect(first).toBe("career/Project Manager/My CV.pdf");
  });

  it("tries the same name with a short id, then the full id, so nobody's file is replaced", () => {
    expect(resumeKeyCandidates("Project Manager", "resume.pdf", "0192a3b4-c5d6-7e8f-9a0b-1c2d3e4f5a6b")).toEqual([
      "career/Project Manager/resume.pdf",
      "career/Project Manager/resume-3e4f5a6b.pdf",
      "career/Project Manager/resume-0192a3b4c5d67e8f9a0b1c2d3e4f5a6b.pdf",
    ]);
  });

  it("makes titles and file names safe inside a key", () => {
    expect(resumeFolder("Dev/Ops: Lead? #1 \\ <Senior>")).toBe("Dev_Ops_ Lead_ _1 _ _Senior_");
    expect(resumeFolder("../..")).toBe("job");
    expect(resumeFolder("")).toBe("job");
    expect(resumeFolder("x".repeat(200)).length).toBe(80);
    expect(resumeFileName("../../etc/Résumé final (2).PDF")).toBe("Résumé final (2).pdf");
    expect(resumeFileName("Rahim?*%.pdf")).toBe("Rahim___.pdf");
    expect(resumeFileName(".pdf")).toBe("resume.pdf");
    expect(resumeFileName("...hidden.pdf")).toBe("hidden.pdf");
    expect(resumeFileName(`${"y".repeat(300)}.pdf`).length).toBeLessThanOrEqual(124);
  });

  it("keeps letters of other scripts and never produces a slash or a dot-dot", () => {
    expect(resumeFileName("সিভি রহিম.pdf")).toBe("সিভি রহিম.pdf");
    for (const key of resumeKeyCandidates("a/../b", "../x/../y.pdf", "id")) {
      expect(key.split("/")).toHaveLength(3);
      expect(key).not.toContain("..");
    }
  });
});

describe("applicationPayloadSchema", () => {
  it("trims, defaults and turns empty optional values into null", () => {
    const payload = applicationPayloadSchema.parse(valid);
    expect(payload).toMatchObject({
      fullName: "Rahim Uddin",
      email: "Rahim@Example.com",
      githubUrl: null,
      linkedinUrl: null,
      experiences: [],
      answers: [],
    });
    expect(payload.educations[0]).toMatchObject({ completedOn: "2025-11-20", ongoing: false, grade: null });
    expect(payload.educations[1]).toMatchObject({ completedOn: null, ongoing: true });
  });

  it("accepts profile links on the right site and nowhere else", () => {
    const ok = applicationPayloadSchema.parse({
      ...valid,
      githubUrl: "https://github.com/rahim",
      linkedinUrl: "https://www.linkedin.com/in/rahim",
    });
    expect(ok.githubUrl).toBe("https://github.com/rahim");
    expect(ok.linkedinUrl).toBe("https://www.linkedin.com/in/rahim");

    for (const githubUrl of [
      "http://github.com/rahim",
      "https://evilgithub.com/rahim",
      "https://github.com.evil.test/rahim",
      "https://user:pw@github.com/rahim",
      "github.com/rahim",
      "javascript:alert(1)",
    ]) {
      expect(applicationPayloadSchema.safeParse({ ...valid, githubUrl }).success).toBe(false);
    }
    expect(applicationPayloadSchema.safeParse({ ...valid, linkedinUrl: "https://github.com/rahim" }).success).toBe(false);
  });

  it.each([
    ["no education", { educations: [] }],
    ["11 educations", { educations: Array.from({ length: 11 }, () => valid.educations[0]) }],
    ["an education with neither a date nor ongoing", { educations: [{ degree: "a", fieldOfStudy: "b", institution: "c" }] }],
    [
      "an education with both a date and ongoing",
      { educations: [{ degree: "a", fieldOfStudy: "b", institution: "c", completedOn: "2025-01-01", ongoing: true }] },
    ],
    ["a bad email", { email: "rahim@" }],
    ["a bad phone", { phone: "12345" }],
    ["a missing name", { fullName: "  " }],
    ["no consent", { consent: false }],
    ["a bad submission id", { submissionId: "abc" }],
    [
      "an experience with neither an end date nor current",
      { experiences: [{ company: "a", title: "b", fromOn: "2020-01-01", responsibilities: "x" }] },
    ],
    [
      "an experience that ends before it starts",
      { experiences: [{ company: "a", title: "b", fromOn: "2020-06-01", toOn: "2020-01-01", responsibilities: "x" }] },
    ],
    [
      "16 experiences",
      {
        experiences: Array.from({ length: 16 }, () => ({
          company: "a",
          title: "b",
          fromOn: "2020-01-01",
          current: true,
          responsibilities: "x",
        })),
      },
    ],
    ["an answer over 2,000 characters", { answers: [{ questionId: valid.submissionId, answer: "x".repeat(2001) }] }],
  ])("rejects %s", (_name, patch) => {
    expect(applicationPayloadSchema.safeParse({ ...valid, ...patch }).success).toBe(false);
  });

  it("accepts a current job and an ended job", () => {
    const result = applicationPayloadSchema.parse({
      ...valid,
      experiences: [
        { company: "A", title: "Dev", fromOn: "2020-01-01", toOn: "2022-01-01", responsibilities: "Built it" },
        { company: "B", title: "Lead", fromOn: "2022-02-01", current: true, responsibilities: "Runs it" },
      ],
    });
    expect(result.experiences.map((experience) => [experience.toOn, experience.current])).toEqual([
      ["2022-01-01", false],
      [null, true],
    ]);
  });
});

describe("updateApplicationSchema", () => {
  it("takes a status, notes or both, and nothing else", () => {
    expect(updateApplicationSchema.parse({ status: "shortlisted" })).toEqual({ status: "shortlisted" });
    expect(updateApplicationSchema.parse({ notes: "Call on Monday" })).toEqual({ notes: "Call on Monday" });
    expect(updateApplicationSchema.safeParse({}).success).toBe(false);
    expect(updateApplicationSchema.safeParse({ status: "archived" }).success).toBe(false);
  });
});

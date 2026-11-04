// Copies the published case studies from one environment to another through the admin's public address, as a signed-in employee,
// so every rule of the API applies (validation, image checks, audit). Reads from the source API's public endpoint (no sign-in) and
// writes drafts then publishes them in the same order. A slug that already exists in the target is skipped, so it is safe to rerun.
//
//   TARGET_URL=https://admin.awtomatig.com TARGET_EMAIL=you@example.com TARGET_PASSWORD=... node scripts/copy-case-studies.mjs
//   add DRY_RUN=1 to only list what would be copied. SOURCE_API defaults to http://127.0.0.1:4000 (the local backend).
const SOURCE = (process.env.SOURCE_API ?? "http://127.0.0.1:4000").replace(/\/+$/, "");
const TARGET = (process.env.TARGET_URL ?? "").replace(/\/+$/, "");
const { TARGET_EMAIL: email, TARGET_PASSWORD: password, DRY_RUN: dry } = process.env;
if (!TARGET || !email || !password) {
  console.error("Set TARGET_URL, TARGET_EMAIL and TARGET_PASSWORD (see the top of this file).");
  process.exit(1);
}

let cookie = "";
async function call(method, path, { json, form } = {}) {
  const headers = { origin: TARGET, ...(cookie && { cookie }), ...(json && { "content-type": "application/json" }) };
  const response = await fetch(`${TARGET}/api/v1${path}`, { method, headers, body: json ? JSON.stringify(json) : form });
  const set = response.headers.getSetCookie?.() ?? [];
  if (set.length) cookie = set.map((c) => c.split(";")[0]).join("; ");
  const text = await response.text();
  if (!response.ok) throw new Error(`${method} ${path} failed (${response.status}): ${text.slice(0, 300)}`);
  return text ? JSON.parse(text) : null;
}

const source = await (await fetch(`${SOURCE}/api/v1/cms/public/case-studies`)).json();
console.log(`Source ${SOURCE}: ${source.items.length} published case studies`);
if (dry) {
  for (const s of source.items) console.log(`  would copy ${s.slug} (image ${s.image.url})`);
  process.exit(0);
}

await call("POST", "/auth/sign-in/email", { json: { email, password } });
const existing = new Set((await call("GET", "/cms/case-studies?pageSize=100")).items.map((i) => i.slug));

for (const s of source.items) {
  if (existing.has(s.slug)) {
    console.log(`  skipped ${s.slug} (already there)`);
    continue;
  }
  const picture = await fetch(s.image.url);
  if (!picture.ok) throw new Error(`Cannot download the image of ${s.slug} (${picture.status})`);
  const bytes = Buffer.from(await picture.arrayBuffer());

  const { slug, title, summary, seoTitle, seoDescription, client, service, category, description, challenge, tags, stats } = s;
  const created = await call("POST", "/cms/case-studies", {
    json: { slug, title, summary, seoTitle, seoDescription, client, service, category, description, challenge, tags, stats },
  });
  const form = new FormData();
  form.append("alt", s.image.alt);
  form.append("image", new Blob([bytes], { type: picture.headers.get("content-type") ?? "image/png" }), "image");
  await call("PUT", `/cms/case-studies/${created.id}/image`, { form });
  await call("POST", `/cms/case-studies/${created.id}/publish`);
  console.log(`  copied ${s.slug}`);
}
console.log("Done. Check the Case Studies list in the admin and the website's Home page.");

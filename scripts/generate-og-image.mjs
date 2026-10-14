// Renders public/og-image.png (the Open Graph / Twitter share image). Run: node scripts/generate-og-image.mjs
// A real file (not a route handler) so it is served at a stable /og-image.png on any static host.
// Design tokens are repeated as literals: ImageResponse renders inline styles without the stylesheet.
import { readFile, writeFile } from "node:fs/promises";
import { ImageResponse } from "next/og.js";

const CHARCOAL = "#1e1e1e";
const CYAN = "#02d5e8";
const CYAN_PALE = "#bdf4f9";
const MUTED = "rgba(255, 255, 255, 0.6)";
const HAIRLINE = "rgba(255, 255, 255, 0.12)";

const el = (type, style, children, props = {}) => ({ type, props: { style, children, ...props } });

async function loadFont() {
  const css = await (await fetch("https://fonts.googleapis.com/css2?family=Inter+Tight:wght@500")).text();
  const url = css.match(/src: url\((.+?)\)/)[1];
  return Buffer.from(await (await fetch(url)).arrayBuffer());
}

const logo = await readFile("public/images/awtomatig-full-logo.png");
const logoSrc = `data:image/png;base64,${logo.toString("base64")}`;
const tags = ["Websites", "Back-office", "ERP & Systems", "AdTech"];

const tree = el(
  "div",
  {
    width: "100%",
    height: "100%",
    display: "flex",
    flexDirection: "column",
    justifyContent: "space-between",
    padding: "64px 72px",
    background: `radial-gradient(ellipse 75% 95% at 100% 0%, rgba(2, 213, 232, 0.34), rgba(2, 213, 232, 0) 70%), ${CHARCOAL}`,
    color: "white",
    fontFamily: "Inter Tight",
  },
  [
    // The logo PNG is 3239×1099
    el("img", { display: "flex" }, undefined, { src: logoSrc, width: 265, height: 90 }),
    el("div", { display: "flex", flexDirection: "column" }, [
      el("div", { display: "flex", flexDirection: "column", fontSize: 92, lineHeight: 1, letterSpacing: -3.7, fontWeight: 500 }, [
        el("div", {}, "The operational layer behind"),
        el("div", { display: "flex" }, [
          el("span", { marginRight: 24 }, "modern"),
          el("span", { color: CYAN_PALE }, "businesses."),
        ]),
      ]),
      el(
        "div",
        { display: "flex", alignItems: "center", marginTop: 48, paddingTop: 28, borderTop: `1px solid ${HAIRLINE}` },
        tags.map((tag, i) =>
          el("div", { display: "flex", alignItems: "center", marginRight: 36, fontSize: 26, color: MUTED }, [
            el("div", { width: 10, height: 10, borderRadius: 10, background: CYAN, marginRight: 14 }, undefined),
            tag,
          ]),
        ),
      ),
    ]),
  ],
);

const image = new ImageResponse(tree, {
  width: 1200,
  height: 630,
  fonts: [{ name: "Inter Tight", data: await loadFont(), weight: 500, style: "normal" }],
});
await writeFile("public/og-image.png", Buffer.from(await image.arrayBuffer()));
console.log("wrote public/og-image.png");

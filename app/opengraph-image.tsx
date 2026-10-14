import { readFile } from "node:fs/promises";
import { join } from "node:path";
import { ImageResponse } from "next/og";
import { SITE } from "@/lib/site";

// Share image for every page (Open Graph and Twitter), rendered once at build time.
export const alt = SITE.title;
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

// ImageResponse renders inline styles without the stylesheet, so the design tokens are repeated here as literals:
// charcoal (--color-charcoal), cyan (--color-cyan), white at 60%.
const CHARCOAL = "#1e1e1e";
const CYAN = "#02d5e8";
const MUTED = "rgba(255, 255, 255, 0.6)";

export default async function Image() {
  const logo = await readFile(join(process.cwd(), "public/images/awtomatig-full-logo.png"));
  const logoSrc = `data:image/png;base64,${logo.toString("base64")}`;

  return new ImageResponse(
    <div
      style={{
        width: "100%",
        height: "100%",
        display: "flex",
        flexDirection: "column",
        justifyContent: "space-between",
        padding: 80,
        background: `radial-gradient(ellipse 70% 80% at 100% 0%, rgba(2, 213, 232, 0.28), transparent), ${CHARCOAL}`,
        color: "white",
      }}
    >
      {/* The logo PNG is 3239×1099 */}
      {/* eslint-disable-next-line @next/next/no-img-element -- ImageResponse renders plain <img>, next/image is not available */}
      <img src={logoSrc} alt="" width={330} height={112} />
      <div style={{ display: "flex", flexDirection: "column", gap: 24 }}>
        <div style={{ fontSize: 68, lineHeight: 1.05, letterSpacing: -2, fontWeight: 600, maxWidth: 900 }}>
          The operational layer behind modern businesses.
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: 16, fontSize: 28, color: MUTED }}>
          <div style={{ width: 12, height: 12, borderRadius: 12, background: CYAN }} />
          Websites · Back-office operations · ERP & business systems · AdTech
        </div>
      </div>
    </div>,
    size,
  );
}

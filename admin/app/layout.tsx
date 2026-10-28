import type { Metadata, Viewport } from "next";
import { Inter, Inter_Tight } from "next/font/google";

import { Providers } from "@/components/Providers";
import { APP_NAME } from "@/lib/config";

import "./globals.css";

// The same two families as the website (frontend/app/layout.tsx), self-hosted by next/font.
const inter = Inter({ variable: "--font-inter", subsets: ["latin"] });
const interTight = Inter_Tight({ variable: "--font-inter-tight", subsets: ["latin"] });

export const metadata: Metadata = {
  title: { default: `${APP_NAME} Admin`, template: `%s | ${APP_NAME} Admin` },
  description: "Internal tools for AWTOMATIG employees.",
  // Never indexed (also sent as X-Robots-Tag and in robots.ts).
  robots: { index: false, follow: false },
};

export const viewport: Viewport = { themeColor: "#1e1e1e" };

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en" className={`${inter.variable} ${interTight.variable}`}>
      <body>
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}

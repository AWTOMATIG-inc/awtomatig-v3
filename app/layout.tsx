import type { Metadata, Viewport } from "next";
import { Inter, Inter_Tight } from "next/font/google";
import "./globals.css";

// Body, UI copy and labels
const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
  axes: ["opsz"],
});

// Display and headings
const interTight = Inter_Tight({
  variable: "--font-inter-tight",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Awtomatig - Interactive Hero Section",
  description:
    "AWTOMATIG connects people, process, systems, and technology into one scalable ecosystem.",
};

export const viewport: Viewport = {
  // Lets the layout use env(safe-area-inset-*) so the fixed header clears notches / the dynamic island
  viewportFit: "cover",
  themeColor: "#1e1e1e",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="en" className={`${inter.variable} ${interTight.variable}`}>
      <body className="flex min-h-screen flex-col justify-between bg-surface-inverse font-sans text-fg-inverse selection:bg-action-primary selection:text-on-action">
        {children}
      </body>
    </html>
  );
}

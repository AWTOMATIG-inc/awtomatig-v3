import type { StaticImageData } from "next/image";
import BuildImage from "@/public/images/services/build.png";
import ImproveImage from "@/public/images/services/improve.png";
import OperateImage from "@/public/images/services/operate.png";

export type SupportTheme = "light" | "dark" | "cyan";

export type SupportMode = {
  title: string;
  description: string;
  image: StaticImageData;
  /** Nudges the image so its visible content (not its transparent padding) sits centred, as in the design */
  imageOffset: string;
  theme: SupportTheme;
};

// Full class strings so Tailwind can detect them
export const SUPPORT_THEMES: Record<SupportTheme, string> = {
  light: "bg-surface text-fg-strong",
  dark: "bg-surface-inverse text-fg-inverse",
  cyan: "bg-action-primary text-on-action",
};

export const SUPPORT_MODES: SupportMode[] = [
  {
    title: "Build",
    description: "Design and implement new websites, systems, integrations and operational workflows.",
    image: BuildImage,
    imageOffset: "",
    theme: "light",
  },
  {
    title: "Operate",
    description: "Provide ongoing support for the processes and systems your business relies on every day.",
    image: OperateImage,
    imageOffset: "translate-x-[2%] translate-y-[6.4%]",
    theme: "dark",
  },
  {
    title: "Improve",
    description: "Optimize existing infrastructure, automation and workflows as requirements evolve.",
    image: ImproveImage,
    imageOffset: "-translate-x-[5%] translate-y-[6.4%]",
    theme: "cyan",
  },
];

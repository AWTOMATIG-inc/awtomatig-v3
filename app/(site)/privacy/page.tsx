import type { Metadata } from "next";
import LegalSection from "@/app/components/sections/shared/legal/LegalSection";
import { PRIVACY_POLICY } from "@/app/components/sections/shared/legal/legal";
import { pageMetadata } from "@/lib/metadata";

export const metadata: Metadata = pageMetadata({
  title: "Privacy Policy",
  description:
    "What personal information AWTOMATIG receives through this website, how it is used and kept, and the rights you have over your data.",
  path: "/privacy",
});

export default function PrivacyPage() {
  return <LegalSection doc={PRIVACY_POLICY} />;
}

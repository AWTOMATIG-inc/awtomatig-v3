import type { Metadata } from "next";
import LegalSection from "@/app/components/sections/shared/legal/LegalSection";
import { TERMS } from "@/app/components/sections/shared/legal/legal";
import { pageMetadata } from "@/lib/metadata";

export const metadata: Metadata = pageMetadata({
  title: "Terms & Conditions",
  description:
    "The terms that apply to your use of the AWTOMATIG website and to our work together, including ownership, links and liability.",
  path: "/terms",
});

export default function TermsPage() {
  return <LegalSection doc={TERMS} />;
}

import type { Metadata } from "next";
import CareersHeroSection from "@/app/components/sections/careers/hero/CareersHeroSection";
import OpeningsSection from "@/app/components/sections/careers/openings/OpeningsSection";
import { getOpenJobs } from "@/lib/careers";
import { pageMetadata } from "@/lib/metadata";

export const metadata: Metadata = pageMetadata({
  title: "Careers: Open Positions in Dhaka",
  description:
    "See the open positions at AWTOMATIG in Dhaka. Read the role details and apply online with your education, experience and resume.",
  path: "/careers",
});

// Static, rebuilt in the background at most once a minute, so a newly published opening shows up without a deploy. The
// backend decides whether a job takes applications, so a closed one stops accepting at once even while this page is cached.
export const revalidate = 30; // must be a literal; keep equal to CAREERS_REVALIDATE_SECONDS in lib/careers.ts

export default async function CareersPage() {
  const result = await getOpenJobs();

  return (
    <>
      <CareersHeroSection />
      <OpeningsSection result={result} />
    </>
  );
}

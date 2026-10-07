import type { Metadata } from "next";
import Footer from "../components/layout/footer/Footer";
import Header from "../components/layout/header/Header";
import CaseStudiesHeroSection from "../components/sections/case-studies/hero/CaseStudiesHeroSection";
import AllCaseStudiesSection from "../components/sections/case-studies/all-case-studies/AllCaseStudiesSection";
import CaseStudyListSection from "../components/sections/case-studies/case-study-list/CaseStudyListSection";

export const metadata: Metadata = {
  title: "Case Studies | AWTOMATIG",
  description:
    "How AWTOMATIG helps businesses improve digital infrastructure, streamline operations, connect systems and strengthen the workflows behind everyday execution.",
};

export default function CaseStudiesPage() {
  return (
    <>
      <Header />
      <main className="flex flex-1 flex-col">
        <CaseStudiesHeroSection />
        <AllCaseStudiesSection />
        <CaseStudyListSection />
      </main>
      <Footer />
    </>
  );
}

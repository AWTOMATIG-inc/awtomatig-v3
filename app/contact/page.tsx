import type { Metadata } from "next";
import Footer from "../components/layout/footer/Footer";
import Header from "../components/layout/header/Header";
import ContactHeroSection from "../components/sections/contact/hero/ContactHeroSection";
import InquirySection from "../components/sections/contact/inquiry/InquirySection";
import ProvenSection from "../components/sections/contact/proven/ProvenSection";

export const metadata: Metadata = {
  title: "Contact | AWTOMATIG",
  description:
    "Tell us what needs to work better. You don’t need a fully defined solution: share what’s getting stuck and we’ll help identify the right direction.",
};

export default function ContactPage() {
  return (
    <>
      <Header theme="light" />
      <main className="flex flex-1 flex-col">
        <ContactHeroSection />
        <InquirySection />
        <ProvenSection />
      </main>
      <Footer />
    </>
  );
}

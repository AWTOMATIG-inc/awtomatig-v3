import type { Metadata } from "next";
import ContactHeroSection from "@/app/components/sections/contact/hero/ContactHeroSection";
import BookingSection from "@/app/components/sections/contact/booking/BookingSection";
import FaqSection from "@/app/components/sections/contact/faq/FaqSection";
import InquirySection from "@/app/components/sections/contact/inquiry/InquirySection";
import ProvenSection from "@/app/components/sections/contact/proven/ProvenSection";
import { pageMetadata } from "@/lib/metadata";

export const metadata: Metadata = pageMetadata({
  title: "Contact",
  description:
    "Tell us what needs to work better. You don’t need a fully defined solution: share what’s getting stuck and we’ll help identify the right direction.",
  path: "/contact",
});

export default function ContactPage() {
  return (
    <>
      <ContactHeroSection />
      <InquirySection />
      <ProvenSection />
      <FaqSection />
      <BookingSection />
    </>
  );
}

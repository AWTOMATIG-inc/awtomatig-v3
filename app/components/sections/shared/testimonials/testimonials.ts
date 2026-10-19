import Member1 from "@/public/images/about/member_1.jpg";
import type { ServiceId } from "@/lib/services";

export type Testimonial = {
  id: string;
  quote: string;
  service: ServiceId;
  avatar: typeof Member1;
};

// Demo quotes matched to the Figma mockup, which itself shows "Client Name goes here" / "[Role] · [Company]"
// as literal placeholder copy, and reuses one placeholder portrait (same pattern as About → Team, D43).
// Replace with real client quotes, names, roles and photos when available.
export const TESTIMONIALS: Testimonial[] = [
  {
    id: "t1",
    quote:
      "What stood out was how quickly they understood the shape of the problem. They weren’t just adding technology. They looked at how our team worked and built the solution around that.",
    service: "website-infrastructure",
    avatar: Member1,
  },
  {
    id: "t2",
    quote:
      "AWTOMATIG has been reliable from the initial planning through delivery and ongoing support. We now have a much stronger foundation and a partner who understands how the wider operation fits together.",
    service: "erp-business-systems",
    avatar: Member1,
  },
  {
    id: "t3",
    quote:
      "We had multiple systems and processes that had grown separately over time. AWTOMATIG helped bring much more structure around them, a clearer way to manage the operation as it grows.",
    service: "back-office-operations",
    avatar: Member1,
  },
  {
    id: "t4",
    quote:
      "They treated our campaigns like a system, not a one-off project. Tracking and reporting finally line up across every channel, and we trust the numbers again.",
    service: "ad-tech",
    avatar: Member1,
  },
  {
    id: "t5",
    quote:
      "The handover was smooth and the documentation made sense to people who weren't in the room for the build. That alone saved us weeks when we onboarded new staff.",
    service: "website-infrastructure",
    avatar: Member1,
  },
];

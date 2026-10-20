import type { StaticImageData } from "next/image";
import type { ServiceId } from "@/lib/services";
import SmithLake from "@/public/images/partners/smith-lake.png";
import ObjectiveFocus from "@/public/images/partners/objective-focus.png";
import ZenithicsGloban from "@/public/images/partners/zenithics-globan.png";
import NoSpainNoGain from "@/public/images/partners/no-spain-no-gain.png";
import SellMyRig from "@/public/images/partners/sell-my-rig.png";
import WeWatch from "@/public/images/partners/we-watch.png";

export type Testimonial = {
  id: string;
  quote: string;
  /** The service tag on the card (which of our services the quote is about; assigned from the quote's content) */
  service: ServiceId;
  name: string;
  role: string;
  company: string;
  logo: StaticImageData;
  /** White logos are invisible on the white card, so they are shown in black */
  logoOnWhite?: boolean;
};

export const TESTIMONIALS: Testimonial[] = [
  {
    id: "smith-lake",
    quote:
      "Working with the Awtomatig team felt like having an elite Silicon Valley engineering and operations team right inside our company. Their attention to detail, proactive communication, and delivery speed were unmatched.",
    service: "website-infrastructure",
    name: "Sarah Jenkins",
    role: "Managing Director",
    company: "The Smith Lake Life",
    logo: SmithLake,
  },
  {
    id: "objective-focus",
    quote:
      "We were very satisfied with the amount of operational clarity collected, and with their analysis and recommendations, we identified how to build a scalable, high-momentum position for our company.",
    service: "back-office-operations",
    name: "Elena Rostova",
    role: "Principal Product Architect",
    company: "Objective Focus",
    logo: ObjectiveFocus,
    logoOnWhite: true,
  },
  {
    id: "zenithics",
    quote:
      "Awtomatig has been extraordinarily professional throughout our entire system architecture overhaul, and we have learnt about our own operations from them. It has been an insightful and transformative experience partnering with them.",
    service: "erp-business-systems",
    name: "Marcus Sterling",
    role: "Chief Technology Officer",
    company: "Zenithics Global",
    logo: ZenithicsGloban,
  },
  {
    id: "no-spain-no-gain",
    quote:
      "They automated our client onboarding, contract execution, and payment reconciliation from end to end. What used to take days of manual drag is now completely autonomous with zero drop-off.",
    service: "back-office-operations",
    name: "Carlos Mendez",
    role: "Founder & Managing Partner",
    company: "No Spain No Gain",
    logo: NoSpainNoGain,
  },
  {
    id: "sell-my-rig",
    quote:
      "Awtomatig transformed our lead qualification and CRM operations completely. What used to take our sales reps four hours of daily manual sync is now completely autonomous with zero follow-ups required.",
    service: "erp-business-systems",
    name: "Michael Vance",
    role: "Head of Growth & Operations",
    company: "Sell My Rig",
    logo: SellMyRig,
  },
  {
    id: "we-watch",
    quote:
      "Awtomatig replaced our fragmented back-office tools with a single synchronized engine. The reliability, uptime, and SLA guarantees gave our leadership team total peace of mind to scale aggressively.",
    service: "back-office-operations",
    name: "David Chen",
    role: "VP of Digital Infrastructure",
    company: "We Watch",
    logo: WeWatch,
    logoOnWhite: true,
  },
];

import type { StaticImageData } from "next/image";
import Member1 from "@/public/images/about/member_1.jpg";

export type TeamMember = {
  name: string;
  role: string;
  photo: StaticImageData;
};

// The card uses member_1.jpg until the real portraits are added (see MEMORY.md open items)
export const TEAM: TeamMember[] = [{ name: "Nahid Bin Rafique", role: "Founder & CEO", photo: Member1 }];

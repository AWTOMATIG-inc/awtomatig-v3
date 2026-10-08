import type { StaticImageData } from "next/image";
import Member1 from "@/public/images/about/member_1.png";

export type TeamMember = {
  name: string;
  role: string;
  photo: StaticImageData;
};

// Every card uses member_1.png until the real portraits are added (see MEMORY.md open items)
export const TEAM: TeamMember[] = [
  { name: "Mark Colley", role: "Strategy / Operations", photo: Member1 },
  { name: "Anna William", role: "Design / Digital", photo: Member1 },
  { name: "Michael Abby", role: "Systems / Technology", photo: Member1 },
];

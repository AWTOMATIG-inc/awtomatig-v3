import type { StaticImageData } from "next/image";
import Nahid from "@/public/images/nahid.jpeg";

export type TeamMember = {
  name: string;
  role: string;
  photo: StaticImageData;
  linkedin?: string;
};

export const TEAM: TeamMember[] = [
  {
    name: "Nahid Bin Rafique",
    role: "Founder & CEO",
    photo: Nahid,
    linkedin: "https://www.linkedin.com/in/nahidbinrafique",
  },
];

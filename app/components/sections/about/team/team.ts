import type { StaticImageData } from "next/image";
import Nahid from "@/public/images/nahid.jpeg";

export type TeamMember = {
  name: string;
  role: string;
  photo: StaticImageData;
};

export const TEAM: TeamMember[] = [{ name: "Nahid Bin Rafique", role: "Founder & CEO", photo: Nahid }];

import Image from "next/image";
import Logo from "@/public/images/awtomatig-logo.png";

// Dark card with the brand logo, a stem down to a hairline and nine dashed lines that brighten towards the cyan glow
export default function LogoCard() {
  return (
    <div
      aria-hidden="true"
      className="bg-logo-card rounded-16 flex h-293 w-full flex-col items-center overflow-hidden pt-21 lg:mr-16 lg:w-auto lg:max-w-279"
    >
      <Image src={Logo} alt="" className="h-auto w-110 shrink-0" />
      <span className="bg-action-primary/40 h-24 w-px shrink-0" />
      <div className="border-action-primary/20 dash-grid text-action-primary/80 mx-24 h-62 w-[calc(100%-48px)] shrink-0 border-t" />
    </div>
  );
}

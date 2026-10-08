import Image from "next/image";
import Logo from "@/public/images/awtomatig-logo.png";

// Dark card with the brand logo, a stem down to a hairline and nine dashed lines that brighten towards the cyan glow
export default function LogoCard() {
  return (
    <div aria-hidden="true" className="bg-logo-card flex h-293 w-full flex-col items-center overflow-hidden rounded-16 pt-21 lg:mr-16 lg:w-auto lg:max-w-279">
      <Image src={Logo} alt="" className="h-auto w-110 shrink-0" priority={false} />
      <span className="h-24 w-px shrink-0 bg-action-primary/40" />
      <div className="mx-24 h-62 w-[calc(100%-48px)] shrink-0 border-t border-action-primary/20 dash-grid text-action-primary/80" />
    </div>
  );
}

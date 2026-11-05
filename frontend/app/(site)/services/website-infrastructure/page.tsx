import type { Metadata } from "next";
import BreakdownSection from "@/app/components/sections/services/detail/breakdown/BreakdownSection";
import CapabilitiesSection from "@/app/components/sections/services/detail/CapabilitiesSection";
import ServiceCaseStudiesSection from "@/app/components/sections/services/detail/CaseStudiesSection";
import CtaSection from "@/app/components/sections/shared/cta/CtaSection";
import ConnectedSection from "@/app/components/sections/services/detail/ConnectedSection";
import FaqSection from "@/app/components/sections/shared/faq/FaqSection";
import GrowthCard from "@/app/components/sections/services/detail/GrowthCard";
import HowWeWorkSection from "@/app/components/sections/services/detail/HowWeWorkSection";
import OverviewSection from "@/app/components/sections/services/detail/OverviewSection";
import {
  BREAKDOWN_CARDS,
  CAPABILITIES,
  CHANGE_STEPS,
  CONNECTED_ITEMS,
  FAQS,
  OVERVIEW_FEATURES,
  WORK_COLUMNS,
  WORK_STEPS,
} from "@/app/components/sections/services/detail/websiteInfrastructure";
import ServiceDetailHero from "@/app/components/sections/services/detail/ServiceDetailHero";
import StepGridSection from "@/app/components/sections/shared/step-grid/StepGridSection";
import { pageMetadata } from "@/lib/metadata";
import { getService } from "@/lib/services";
import showcase from "@/public/images/services/web.png";

const SERVICE = getService("website-infrastructure");

export const metadata: Metadata = pageMetadata({
  title: "Website Infrastructure",
  description:
    "AWTOMATIG builds and maintains reliable digital infrastructure for your website: the entry point to your customers, content, campaigns, systems and internal workflows.",
  path: `/services/${SERVICE.id}`,
});

// A static route wins over the "Coming soon" `services/[slug]` page, so only this service has a real page so far.
export default function WebsiteInfrastructurePage() {
  return (
    <>
      <ServiceDetailHero
        id="website-infrastructure"
        eyebrow={SERVICE.name}
        title={
          <>
            Website
            <br /> Infrastructure
          </>
        }
        description="Your website is more than a marketing surface. It is often the entry point to your customers, content, campaigns, systems and internal workflows. AWTOMATIG builds and maintains reliable digital infrastructure from corporate websites to the platforms behind them."
        primary={{ label: "Start a Conversation", href: "/contact" }}
        secondary={{ label: "Explore Capabilities", href: "#capabilities" }}
        image={showcase}
      />
      <OverviewSection
        id="overview"
        eyebrow="Overview"
        title={
          <>
            More than a website.
            <br className="max-lg:hidden" /> The infrastructure behind it.
          </>
        }
        lead={
          <>
            Modern digital platforms sit at the center of more business activity
            <br className="max-lg:hidden" /> than ever. Content teams need control. Marketing teams need
            <br className="max-lg:hidden" /> speed. Customers expect performance. Internal systems need
            <br className="max-lg:hidden" /> reliable connections.
          </>
        }
        card={
          <GrowthCard>
            Built for
            <br /> performance,
            <br /> maintainability,
            <br /> reliability and scale.
          </GrowthCard>
        }
        features={OVERVIEW_FEATURES}
      />
      <BreakdownSection
        id="breakdown"
        eyebrow={
          <>
            Where things
            <br /> break down
          </>
        }
        title={
          <>
            Website problems
            <br className="max-lg:hidden" /> rarely stay website
            <br className="max-lg:hidden" /> problems.
          </>
        }
        lead={
          <>
            When digital infrastructure becomes difficult to
            <br className="max-lg:hidden" /> maintain, the impact spreads across
            <br className="max-lg:hidden" /> marketing, operations, internal teams and
            <br className="max-lg:hidden" /> customer experience.
          </>
        }
        cards={BREAKDOWN_CARDS}
      />
      <CapabilitiesSection
        id="capabilities"
        eyebrow="Capabilities"
        title={
          <>
            Everything required
            <br className="max-lg:hidden" /> to build and operate
            <br className="max-lg:hidden" /> the digital layer.
          </>
        }
        lead={
          <>
            The service is structured around eight core
            <br className="max-lg:hidden" /> capability areas, each designed to work
            <br className="max-lg:hidden" /> independently or as part of a wider Website
            <br className="max-lg:hidden" /> Infrastructure engagement.
          </>
        }
        items={CAPABILITIES}
      />
      <HowWeWorkSection
        id="how-we-work"
        eyebrow="How we work"
        title={
          <>
            From existing
            <br className="max-lg:hidden" /> infrastructure to a stronger
            <br className="max-lg:hidden" /> digital foundation.
          </>
        }
        lead={
          <>
            A disciplined delivery process keeps technical decisions connected
            <br className="max-lg:hidden" /> to business requirements, internal teams and long-term operation.
          </>
        }
        steps={WORK_STEPS}
        columns={WORK_COLUMNS}
      />
      <StepGridSection
        id="what-changes"
        eyebrow="What changes"
        title={
          <>
            Infrastructure that
            <br className="max-lg:hidden" /> creates less friction as
            <br className="max-lg:hidden" /> the business grows.
          </>
        }
        lead={
          <>
            The goal isn’t simply to launch another
            <br className="max-lg:hidden" /> website. It’s to create digital infrastructure
            <br className="max-lg:hidden" /> your business can continue relying on.
          </>
        }
        steps={CHANGE_STEPS}
        paddingClassName="pt-60 pb-60 lg:pt-90 lg:pb-90"
        gridClassName="mt-50 lg:mt-71"
      />
      <ConnectedSection
        id="connected-technology"
        eyebrow={
          <>
            Connected
            <br /> Technology
          </>
        }
        title={
          <>
            Built to work with the
            <br className="max-lg:hidden" /> systems around it.
          </>
        }
        lead={
          <>
            Website infrastructure rarely works alone. We build
            <br className="max-lg:hidden" /> around the platforms, workflows and systems
            <br className="max-lg:hidden" /> already supporting the business.
          </>
        }
        items={CONNECTED_ITEMS}
      />
      <ServiceCaseStudiesSection description="AWTOMATIG works across infrastructure, operations, business systems and AdTech to turn fragmented processes into clearer, more scalable ways of working." />
      <FaqSection
        items={FAQS}
        title={
          <>
            Questions about Website
            <br className="max-lg:hidden" /> Infrastructure.
          </>
        }
        paddingClassName="py-60 lg:pt-90 lg:pb-90"
      />
      <CtaSection
        layout="detail"
        title={
          <>
            Does your digital infrastructure
            <br className="max-lg:hidden" /> need a stronger foundation?
          </>
        }
        description={
          <>
            Whether you’re rebuilding an existing website, creating a new platform, improving performance
            <br className="max-lg:hidden" /> or connecting systems, tell us what needs to work better.
          </>
        }
        note={{
          title: "Start with the problem.",
          description:
            "You don’t need to know the exact solution yet. Tell us what’s getting stuck, and we’ll help map the right direction.",
        }}
      />
    </>
  );
}

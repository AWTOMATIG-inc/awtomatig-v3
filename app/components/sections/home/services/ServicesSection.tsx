import ServiceCard, { type ServiceCta } from "./ServiceCard";
import StackingCards from "./StackingCards";
import { SERVICES } from "./services";

type ServicesSectionProps = {
  /** Each card's button. Home leads to the Services page; the Services page itself leads to Contact. */
  cta?: ServiceCta;
};

// Four full-bleed service cards that stack over each other on scroll (Home and Services pages)
export default function ServicesSection({ cta = { label: "See service details", href: "/services" } }: ServicesSectionProps) {
  return (
    <section id="services" aria-labelledby="services-title">
      <h2 id="services-title" className="sr-only">
        Our business automation, ERP and web services
      </h2>
      <StackingCards>
        {SERVICES.map((service, i) => (
          <ServiceCard key={service.id} service={service} index={i} cta={cta} />
        ))}
      </StackingCards>
    </section>
  );
}

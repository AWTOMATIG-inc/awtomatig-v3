import ServiceCard from "./ServiceCard";
import StackingCards from "./StackingCards";
import { SERVICES } from "./services";

// Home services: four full-bleed cards that stack over each other on scroll
export default function ServicesSection() {
  return (
    <section id="services" aria-labelledby="services-title">
      <h2 id="services-title" className="sr-only">
        Our services
      </h2>
      <StackingCards>
        {SERVICES.map((service, i) => (
          <ServiceCard key={service.id} service={service} index={i} />
        ))}
      </StackingCards>
    </section>
  );
}

import Image from "next/image";
import { Fragment } from "react";
import { Button } from "@/app/components/ui";
import { SERVICE_THEMES, type Service } from "./services";

type ServiceCardProps = {
  service: Service;
  index: number;
};

// One full-bleed stacking card: index + title, description + CTA, then the points panel with the showcase image
export default function ServiceCard({ service, index }: ServiceCardProps) {
  const theme = SERVICE_THEMES[service.theme];
  const number = String(index + 1).padStart(2, "0");
  const titleId = `${service.id}-title`;

  return (
    <article id={service.id} aria-labelledby={titleId} data-stack-card className={`service-card flex min-h-dvh flex-col ${theme.card}`}>
      <div className="site-container pt-40 lg:pt-70">
        <div className="flex flex-col gap-20 lg:flex-row lg:items-start lg:justify-between lg:gap-40">
          <div className="flex items-baseline-last justify-between gap-12 lg:justify-start lg:gap-0">
            <span aria-hidden="true" className={`type-heading-34 order-last shrink-0 font-normal lg:order-first lg:w-100 ${theme.index}`}>
              {number}/
            </span>
            <h3 id={titleId} className="type-heading-60">
              {service.title.map((line, i) => (
                <Fragment key={line}>
                  {i > 0 && (
                    <>
                      {" "}
                      <br className="max-lg:hidden" />
                    </>
                  )}
                  {line}
                </Fragment>
              ))}
            </h3>
          </div>

          <div className="lg:w-392 lg:shrink-0 lg:pt-8">
            <p className="type-body-16 max-w-640">{service.description}</p>
            <Button
              href={service.href}
              variant={theme.button}
              size="lg"
              aria-label={`Explore our services: ${service.title.join(" ")}`}
              className="mt-16 w-full sm:w-250"
            >
              Explore our services
            </Button>
          </div>
        </div>
      </div>

      <div className="service-panel site-container mt-32 flex flex-1 flex-col lg:mt-50">
        <div className={`flex flex-1 flex-col overflow-hidden rounded-t-16 ${theme.panel}`}>
          {/* Below lg the odd items go second, so the rows read like the design (desktop row 1, then row 2) */}
          <ul className="grid grid-cols-2 gap-x-16 pt-8 pr-(--panel-pad-end) pl-(--panel-pad-start) sm:gap-x-20 lg:grid-flow-col lg:grid-cols-4 lg:grid-rows-2 lg:gap-x-25 lg:pt-16">
            {service.points.map((point, i) => (
              <li key={point} className={`${i % 2 ? "max-lg:order-1" : ""} type-body-14 flex items-center gap-10 border-b pt-8 pb-6 sm:pt-16 sm:pb-12 lg:type-body-16 lg:gap-12 ${theme.divider}`}>
                <span aria-hidden="true" className="size-6 shrink-0 rounded-full bg-current" />
                {point}
              </li>
            ))}
          </ul>

          {/* mt-auto keeps the image on the card's bottom edge when the card stretches to fill the screen */}
          <div className="mt-auto flex justify-center overflow-hidden pt-32 lg:pt-50">
            <Image
              src={service.image}
              alt={service.imageAlt}
              sizes="(min-width: 1440px) 1400px, (min-width: 1024px) calc(100vw - 40px), 1080px"
              className="h-300 w-auto max-w-none sm:h-360 lg:h-auto lg:w-full"
            />
          </div>
        </div>
      </div>
    </article>
  );
}

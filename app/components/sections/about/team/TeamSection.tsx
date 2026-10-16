import Image from "next/image";
import { Eyebrow } from "@/app/components/ui";
import { TEAM } from "./team";

// About page: a centred portrait card (photo, role, name) under a heading row
export default function TeamSection() {
  return (
    <section id="team" aria-labelledby="team-title" className="bg-surface-subtle text-fg-strong">
      <div className="site-container pt-60 pb-60 lg:pt-28 lg:pb-100">
        <div className="grid gap-20 lg:grid-cols-[305fr_651fr_375fr] lg:gap-0">
          <Eyebrow className="self-start lg:mt-6">The people</Eyebrow>
          <h2 id="team-title" className="type-heading-60">
            A focused team, built
            <br className="max-lg:hidden" /> around the work.
          </h2>
          <p className="type-body-16 text-fg-muted max-w-400 lg:-translate-y-3 lg:self-end">
            A growing team working across strategy, design, systems, technology and operations.
          </p>
        </div>

        <ul className="mt-40 flex justify-center lg:mt-52">
          {TEAM.map((member) => (
            <li key={member.name} className="w-full max-w-430">
              <Image
                src={member.photo}
                alt={`Portrait of ${member.name}`}
                sizes="(min-width: 1024px) 430px, (min-width: 768px) 33vw, 100vw"
                className="rounded-16 aspect-4/3 w-full object-cover lg:aspect-auto lg:h-387"
              />
              <p className="type-body-14 mt-16 uppercase">{member.role}</p>
              <h3 className="type-heading-34 mt-3">{member.name}</h3>
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}

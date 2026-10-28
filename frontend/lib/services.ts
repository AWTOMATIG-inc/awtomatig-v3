// The one list of services. Every place that names a service (nav areas, case study categories, the contact
// form's "what do you need help with", the footer links, the Home/Services cards) derives from this instead of
// repeating its own spelling. `id` is also used as the Home section anchor (`/#<id>`).

export const SERVICES = [
  { id: "website-infrastructure", name: "Website Infrastructure", short: "Websites" },
  { id: "back-office-operations", name: "Back-Office Operations", short: "Back-office" },
  { id: "erp-business-systems", name: "ERP & Business Systems", short: "ERP & Systems" },
  { id: "ad-tech", name: "AdTech", short: "AdTech" },
] as const;

export type ServiceId = (typeof SERVICES)[number]["id"];
export type ServiceInfo = (typeof SERVICES)[number];

const BY_ID = new Map<ServiceId, ServiceInfo>(SERVICES.map((service) => [service.id, service]));

/** Looks up a service's name / short label by id. Every `ServiceId` comes from `SERVICES`, so this never misses. */
export function getService(id: ServiceId): ServiceInfo {
  return BY_ID.get(id)!;
}

/** Timezone for every date and time shown (an IANA name). NEXT_PUBLIC_*, so server and browser format identically. */
export const APP_TIMEZONE = process.env.NEXT_PUBLIC_TIMEZONE ?? "UTC";

export const APP_NAME = "AWTOMATIG";

/** The public website, for links to a job's careers page. NEXT_PUBLIC_*, not a secret; set it per environment (http://localhost:3000 locally). */
export const WEBSITE_URL = (process.env.NEXT_PUBLIC_WEBSITE_URL ?? "https://awtomatig.com").replace(/\/+$/, "");

/** The address candidates see for one opening. Drafts have none: the website answers 404 until the job is published. */
export const jobPublicUrl = (slug: string) => `${WEBSITE_URL}/careers/${slug}`;

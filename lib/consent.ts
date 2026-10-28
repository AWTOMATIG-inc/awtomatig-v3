// Cookie consent (Google Consent Mode v2), the same for every visitor: analytics start denied and only run after
// "Accept". GTM's Google tag and Microsoft Clarity both read these signals. The choice is kept in localStorage.

declare global {
  interface Window {
    gtag?: (...args: unknown[]) => void;
    clarity?: (...args: unknown[]) => void;
  }
}

export type ConsentChoice = "granted" | "denied";

const STORAGE_KEY = "aw-consent";
/** Fired on window when the choice changes */
export const CONSENT_EVENT = "aw:consent";
/** Fired on window to reopen the banner (footer "Cookie settings") */
export const OPEN_CONSENT_EVENT = "aw:consent-open";

/** Inline, before GTM loads: every visitor starts denied, then a saved "granted" is re-applied */
export const CONSENT_DEFAULT_SCRIPT =
  `window.dataLayer=window.dataLayer||[];window.gtag=function(){dataLayer.push(arguments)};` +
  `gtag("consent","default",{ad_storage:"denied",ad_user_data:"denied",ad_personalization:"denied",analytics_storage:"denied"});` +
  `try{if(localStorage.getItem("${STORAGE_KEY}")==="granted")gtag("consent","update",{analytics_storage:"granted"})}catch(e){}`;

export function readConsent(): ConsentChoice | null {
  try {
    const value = localStorage.getItem(STORAGE_KEY);
    return value === "granted" || value === "denied" ? value : null;
  } catch {
    return null;
  }
}

export function saveConsent(choice: ConsentChoice) {
  try {
    localStorage.setItem(STORAGE_KEY, choice);
  } catch {}
  window.gtag?.("consent", "update", { analytics_storage: choice });
  window.clarity?.("consentv2", { ad_Storage: "denied", analytics_Storage: choice });
  window.dataLayer?.push({ event: "consent_update", analytics_storage: choice });
  if (choice === "denied") clearAnalyticsCookies();
  window.dispatchEvent(new Event(CONSENT_EVENT));
}

// Withdrawing consent also removes the GA4 (_ga*) and Clarity (_clck, _clsk) cookies already set
function clearAnalyticsCookies() {
  const root = location.hostname.replace(/^www\./, "");
  for (const cookie of document.cookie.split("; ")) {
    const name = cookie.split("=")[0];
    if (!/^(_ga|_gid|_gat|_clck|_clsk)/.test(name)) continue;
    for (const domain of ["", `; domain=${location.hostname}`, `; domain=.${root}`]) {
      document.cookie = `${name}=; max-age=0; path=/${domain}`;
    }
  }
}

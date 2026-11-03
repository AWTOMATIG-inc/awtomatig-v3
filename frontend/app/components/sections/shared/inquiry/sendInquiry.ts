"use server";

import { headers } from "next/headers";
import nodemailer from "nodemailer";
import { BUDGETS, HELP_OPTIONS, PROJECT_TYPES } from "./inquiry";

export type InquiryResult = { ok: true; help: string; type: string } | { ok: false; error: string };

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const LIMITS = { name: 120, email: 200, company: 160, improve: 5000 };

// Per-IP throttle, in memory: enough for one PM2 process on the VPS. Resets on restart.
const WINDOW_MS = 10 * 60 * 1000;
const MAX_PER_WINDOW = 5;
const hits = new Map<string, number[]>();

function throttled(ip: string) {
  const now = Date.now();
  const recent = (hits.get(ip) ?? []).filter((t) => now - t < WINDOW_MS);
  recent.push(now);
  hits.set(ip, recent);
  return recent.length > MAX_PER_WINDOW;
}

// The confirmation goes to an address the visitor typed, so it is capped per address too: nobody can use the form to
// flood someone else's inbox.
const CONFIRM_WINDOW_MS = 60 * 60 * 1000;
const MAX_CONFIRMATIONS_PER_ADDRESS = 3;
const confirmations = new Map<string, number[]>();

function confirmationAllowed(email: string) {
  const key = email.toLowerCase();
  const now = Date.now();
  const recent = (confirmations.get(key) ?? []).filter((t) => now - t < CONFIRM_WINDOW_MS);
  if (recent.length >= MAX_CONFIRMATIONS_PER_ADDRESS) return false;
  recent.push(now);
  confirmations.set(key, recent);
  return true;
}

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

type Inquiry = {
  name: string;
  email: string;
  company: string;
  budget: string;
  help: string;
  type: string;
  improve: string;
};

// Saves the inquiry in the CRM (the backend's POST /api/v1/crm/leads), where the team sees it in the admin dashboard. The
// backend only stores it; this action sends the emails. Returns false instead of throwing, so a backend problem never stops
// the emails going out.
async function storeLead(submissionId: string, inquiry: Inquiry): Promise<boolean> {
  const { CRM_API_URL, LEAD_INGEST_KEY } = process.env;
  if (!CRM_API_URL || !LEAD_INGEST_KEY) {
    console.warn("[inquiry] CRM_API_URL or LEAD_INGEST_KEY is not set, so the lead is only emailed");
    return false;
  }
  try {
    const response = await fetch(`${CRM_API_URL.replace(/\/$/, "")}/api/v1/crm/leads`, {
      method: "POST",
      headers: { "content-type": "application/json", "x-ingest-key": LEAD_INGEST_KEY },
      body: JSON.stringify({
        submissionId,
        name: inquiry.name,
        email: inquiry.email,
        company: inquiry.company,
        budget: inquiry.budget,
        helpWith: inquiry.help,
        projectType: inquiry.type,
        message: inquiry.improve,
        consent: true,
      }),
      cache: "no-store",
      signal: AbortSignal.timeout(8000),
    });
    if (!response.ok) {
      console.error("[inquiry] the CRM refused the lead, status", response.status);
      return false;
    }
    return true;
  } catch (err) {
    console.error("[inquiry] could not reach the CRM:", err instanceof Error ? err.message : err);
    return false;
  }
}

// Sends the Contact page inquiry to the team (CONTACT_TO) and a confirmation to the visitor, through SMTP, and stores it in the
// CRM. Reply-To on the team email is the visitor, so replying answers them. The visitor sees success when the lead was stored or
// the team was emailed: only if both fail is it reported as an error.
export async function sendInquiry(data: FormData): Promise<InquiryResult> {
  const value = (key: string) => String(data.get(key) ?? "").trim();

  // Honeypot: hidden from people, bots fill it. Pretend success so they don't retry.
  if (value("website")) return { ok: true, help: "", type: "" };

  const name = value("name");
  const email = value("email");
  const company = value("company");
  const budget = value("budget");
  const help = value("help");
  const type = value("type");
  const improve = value("improve");
  // One id per form, kept by the browser until the message is sent, so a retry cannot store the lead twice.
  const submissionId = UUID_RE.test(value("submissionId")) ? value("submissionId") : crypto.randomUUID();

  if (
    !name ||
    !improve ||
    !EMAIL_RE.test(email) ||
    data.get("consent") !== "on" ||
    name.length > LIMITS.name ||
    email.length > LIMITS.email ||
    company.length > LIMITS.company ||
    improve.length > LIMITS.improve ||
    !BUDGETS.includes(budget) ||
    !HELP_OPTIONS.includes(help) ||
    !PROJECT_TYPES.includes(type)
  ) {
    return { ok: false, error: "Please check the form and try again." };
  }

  const ip = (await headers()).get("x-forwarded-for")?.split(",")[0]?.trim() || "unknown";
  if (throttled(ip)) return { ok: false, error: "Too many messages from this connection. Please try again later." };

  const inquiry: Inquiry = { name, email, company, budget, help, type, improve };
  const details = [
    ["Name", name],
    ["Work email", email],
    ["Company", company],
    ["Budget / range", budget],
    ["Needs help with", help],
    ["Project type", type],
    ["What we're trying to improve", improve],
  ]
    .map(([label, v]) => `${label}: ${v || "-"}`)
    .join("\n\n");

  // The three jobs are independent, so none waits for another and one failing does not stop the others.
  const [stored, emailedTeam] = await Promise.all([
    storeLead(submissionId, inquiry),
    notifyTeam(inquiry, details),
    confirmToVisitor(inquiry, details),
  ]);

  if (!stored && !emailedTeam) return { ok: false, error: "We couldn't send your message right now." };
  return { ok: true, help, type };
}

function mailer() {
  const { SMTP_USER, SMTP_PASS, CONTACT_TO } = process.env;
  if (!SMTP_USER || !SMTP_PASS || !CONTACT_TO) {
    console.error("[inquiry] SMTP_USER, SMTP_PASS or CONTACT_TO is not set");
    return null;
  }
  const transport = nodemailer.createTransport({
    host: "smtp.gmail.com",
    port: 465,
    secure: true,
    auth: { user: SMTP_USER, pass: SMTP_PASS },
  });
  return { transport, from: SMTP_USER, team: CONTACT_TO.split(",").map((to) => to.trim()) };
}

// The email to the team (CONTACT_TO).
async function notifyTeam({ name, email, company }: Inquiry, details: string): Promise<boolean> {
  const mail = mailer();
  if (!mail) return false;
  try {
    await mail.transport.sendMail({
      from: { name: "AWTOMATIG website", address: mail.from },
      to: mail.team,
      replyTo: { name, address: email },
      subject: `Project inquiry: ${company || name}`,
      text: details,
    });
    return true;
  } catch (err) {
    console.error("[inquiry] sendMail to the team failed:", err instanceof Error ? err.message : err);
    return false;
  }
}

// The confirmation to the visitor, with what they filled in. Plain text, and no visitor text in a header (the subject is fixed).
async function confirmToVisitor({ name, email }: Inquiry, details: string): Promise<boolean> {
  const mail = mailer();
  if (!mail) return false;
  if (!confirmationAllowed(email)) {
    console.warn("[inquiry] confirmation skipped: too many for one address");
    return false;
  }
  try {
    await mail.transport.sendMail({
      from: { name: "AWTOMATIG", address: mail.from },
      to: { name, address: email },
      replyTo: mail.team[0],
      subject: "We received your inquiry",
      text: [
        `Hi ${name},`,
        "Thanks for getting in touch. We received your inquiry and will reply within 1 business day.",
        "This is what you sent us:",
        details,
        "If anything is wrong or you want to add something, just reply to this email.",
        "AWTOMATIG",
      ].join("\n\n"),
    });
    return true;
  } catch (err) {
    console.error("[inquiry] sendMail to the visitor failed:", err instanceof Error ? err.message : err);
    return false;
  }
}

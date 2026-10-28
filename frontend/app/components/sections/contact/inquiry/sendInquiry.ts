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

// Sends the Contact page inquiry to the team (CONTACT_TO) through SMTP. Reply-To is the visitor, so replying answers them.
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

  const { SMTP_USER, SMTP_PASS, CONTACT_TO } = process.env;
  if (!SMTP_USER || !SMTP_PASS || !CONTACT_TO) {
    console.error("[inquiry] SMTP_USER, SMTP_PASS or CONTACT_TO is not set");
    return { ok: false, error: "We couldn't send your message right now." };
  }

  const transport = nodemailer.createTransport({
    host: "smtp.gmail.com",
    port: 465,
    secure: true,
    auth: { user: SMTP_USER, pass: SMTP_PASS },
  });

  const text = [
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

  try {
    await transport.sendMail({
      from: { name: "AWTOMATIG website", address: SMTP_USER },
      to: CONTACT_TO.split(",").map((to) => to.trim()),
      replyTo: { name, address: email },
      subject: `Project inquiry: ${company || name}`,
      text,
    });
  } catch (err) {
    console.error("[inquiry] sendMail failed:", err instanceof Error ? err.message : err);
    return { ok: false, error: "We couldn't send your message right now." };
  }

  return { ok: true, help, type };
}

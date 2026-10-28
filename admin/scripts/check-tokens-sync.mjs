// Keeps the admin on the website's brand (DESIGN.md section 3.4). Compares admin/app/globals.css with
// ../frontend/app/globals.css and fails when a shared token or text style differs:
// 1. every custom property in the admin's @theme blocks that is not --admin-* must exist in the website with the same value;
// 2. every @utility type-* in the admin must exist in the website with the same declarations.
// The admin may omit tokens (it uses a subset). It must never invent or change one: change the website first, or add an
// --admin-* token.
import { readFileSync } from "node:fs";

const ADMIN = "app/globals.css";
const SITE = "../frontend/app/globals.css";

const strip = (css) => css.replace(/\/\*[\s\S]*?\*\//g, "");
const squash = (text) => text.replace(/\s+/g, " ").trim();

/** Returns the body between the braces that open at `open` (index of "{"). */
function block(css, open) {
  let depth = 0;
  for (let i = open; i < css.length; i++) {
    if (css[i] === "{") depth++;
    else if (css[i] === "}" && --depth === 0) return css.slice(open + 1, i);
  }
  throw new Error("Unbalanced braces in CSS");
}

function themeTokens(css) {
  const tokens = new Map();
  for (const match of css.matchAll(/@theme(?:\s+inline)?\s*\{/g)) {
    const body = block(css, match.index + match[0].length - 1);
    // Only top-level declarations: drop nested blocks (keyframes) first.
    const flat = body.replace(/@keyframes[^{]*\{(?:[^{}]|\{[^{}]*\})*\}/g, "");
    for (const decl of flat.matchAll(/(--[\w*-]+)\s*:\s*([^;]+);/g)) tokens.set(decl[1], squash(decl[2]));
  }
  return tokens;
}

function utilities(css) {
  const found = new Map();
  for (const match of css.matchAll(/@utility\s+([\w*-]+)\s*\{/g)) {
    found.set(match[1], squash(block(css, match.index + match[0].length - 1)));
  }
  return found;
}

const admin = strip(readFileSync(ADMIN, "utf8"));
const site = strip(readFileSync(SITE, "utf8"));
const errors = [];

const siteTokens = themeTokens(site);
for (const [name, value] of themeTokens(admin)) {
  if (name.startsWith("--admin-")) continue;
  if (!siteTokens.has(name)) errors.push(`${name} is not a website token. Add it to frontend first, or rename it --admin-*.`);
  else if (siteTokens.get(name) !== value)
    errors.push(`${name}: admin "${value}" differs from website "${siteTokens.get(name)}".`);
}

const siteUtilities = utilities(site);
for (const [name, body] of utilities(admin)) {
  if (!name.startsWith("type-")) continue;
  if (!siteUtilities.has(name)) errors.push(`@utility ${name} is not a website text style.`);
  else if (siteUtilities.get(name) !== body) errors.push(`@utility ${name} differs from the website's.`);
}

if (errors.length) {
  console.error("Admin tokens are out of sync with the website (DESIGN.md section 3.4):\n");
  console.error(errors.map((line) => `  - ${line}`).join("\n"));
  process.exit(1);
}
console.log(`check-tokens-sync: ${themeTokens(admin).size} tokens and the type styles match the website`);

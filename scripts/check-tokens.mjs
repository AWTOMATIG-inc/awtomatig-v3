// Design-system guardrails for component CSS (DESIGN.md §10.1 and §12):
// 1. UI is Tailwind only. A .css file under app/components is allowed only for an *effect* listed in
//    EFFECT_CSS below. Anything else belongs in JSX, or in a token / @utility in app/globals.css.
// 2. Effect CSS uses tokens, never raw color literals. Literal values belong in the @theme block of
//    app/globals.css. A deliberate exception (the hero's atmospheric background) is wrapped in
//    /* token-check: off */ … /* token-check: on */.
import { readdirSync, readFileSync } from "node:fs";
import { join } from "node:path";

const ROOT = "app/components";
const COLOR_LITERAL = /#[0-9a-f]{3,8}\b|\b(?:rgba?|hsla?)\(/i;

// The only component CSS files allowed. Add one only for a real effect (an animated or generated
// background, or scroll-driven motion whose math reads JS-set custom properties) and record why in MEMORY.md.
const EFFECT_CSS = new Set([
  "app/components/ui/lines-background/lines-background.css", // animated lines background (hero, CTA): glow + grain
  "app/components/sections/home/hero/hero.css", // interactive background + frame scale
  "app/components/sections/home/services/services.css", // scroll-driven stacking math
]);

function cssFiles(dir) {
  return readdirSync(dir, { withFileTypes: true }).flatMap((entry) => {
    const path = join(dir, entry.name).replaceAll("\\", "/");
    if (entry.isDirectory()) return cssFiles(path);
    return entry.name.endsWith(".css") ? [path] : [];
  });
}

const strayFiles = [];
const literals = [];
for (const file of cssFiles(ROOT)) {
  if (!EFFECT_CSS.has(file)) {
    strayFiles.push(file);
    continue;
  }
  let enabled = true;
  readFileSync(file, "utf8")
    .split(/\r?\n/)
    .forEach((line, i) => {
      if (line.includes("token-check: off")) enabled = false;
      else if (line.includes("token-check: on")) enabled = true;
      else if (enabled && COLOR_LITERAL.test(line)) literals.push(`${file}:${i + 1}  ${line.trim()}`);
    });
}

if (strayFiles.length) {
  console.error("Component CSS files are only for effects (DESIGN.md §10.1). Move these styles to Tailwind in JSX,");
  console.error("or to a token / @utility in app/globals.css:\n");
  console.error(strayFiles.join("\n") + "\n");
}
if (literals.length) {
  console.error("Raw color literals found. Use tokens from app/globals.css instead:\n");
  console.error(literals.join("\n"));
}
if (strayFiles.length || literals.length) process.exit(1);
console.log(`check-tokens: ${ROOT} is clean (effect CSS only: ${EFFECT_CSS.size} files)`);

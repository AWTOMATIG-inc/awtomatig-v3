// Fails when component CSS uses raw color literals instead of design tokens (DESIGN.md §12).
// Literal values belong in the @theme block of app/globals.css only. A deliberate exception
// (e.g. the hero's atmospheric background) is wrapped in /* token-check: off */ … /* token-check: on */.
import { readdirSync, readFileSync } from "node:fs";
import { join } from "node:path";

const ROOT = "app/components";
const COLOR_LITERAL = /#[0-9a-f]{3,8}\b|\b(?:rgba?|hsla?)\(/i;

function cssFiles(dir) {
  return readdirSync(dir, { withFileTypes: true }).flatMap((entry) => {
    const path = join(dir, entry.name);
    if (entry.isDirectory()) return cssFiles(path);
    return entry.name.endsWith(".css") ? [path] : [];
  });
}

const problems = [];
for (const file of cssFiles(ROOT)) {
  let enabled = true;
  readFileSync(file, "utf8")
    .split(/\r?\n/)
    .forEach((line, i) => {
      if (line.includes("token-check: off")) enabled = false;
      else if (line.includes("token-check: on")) enabled = true;
      else if (enabled && COLOR_LITERAL.test(line)) problems.push(`${file}:${i + 1}  ${line.trim()}`);
    });
}

if (problems.length) {
  console.error("Raw color literals found. Use tokens from app/globals.css instead:\n");
  console.error(problems.join("\n"));
  process.exit(1);
}
console.log(`check-tokens: ${ROOT} is clean`);

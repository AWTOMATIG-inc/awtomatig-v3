import { defineConfig, globalIgnores } from "eslint/config";
import nextVitals from "eslint-config-next/core-web-vitals";
import nextTs from "eslint-config-next/typescript";

const eslintConfig = defineConfig([
  ...nextVitals,
  ...nextTs,
  // Design system: colors come from tokens, never arbitrary values like bg-[#123456] (DESIGN.md §3.3)
  {
    files: ["app/**/*.{ts,tsx}"],
    rules: {
      "no-restricted-syntax": [
        "error",
        {
          selector: "JSXAttribute[name.name='className'] Literal[value=/\\[(#|rgba?\\(|hsla?\\()/]",
          message: "Use a color token (e.g. text-fg-inverse, bg-white/12) instead of an arbitrary color value.",
        },
        {
          selector: "JSXAttribute[name.name='className'] TemplateElement[value.raw=/\\[(#|rgba?\\(|hsla?\\()/]",
          message: "Use a color token (e.g. text-fg-inverse, bg-white/12) instead of an arbitrary color value.",
        },
      ],
    },
  },
  // Override default ignores of eslint-config-next.
  globalIgnores([
    // Default ignores of eslint-config-next:
    ".next/**",
    "out/**",
    "build/**",
    "next-env.d.ts",
  ]),
]);

export default eslintConfig;

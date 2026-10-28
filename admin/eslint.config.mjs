import { defineConfig, globalIgnores } from "eslint/config";
import nextVitals from "eslint-config-next/core-web-vitals";
import nextTs from "eslint-config-next/typescript";

const eslintConfig = defineConfig([
  ...nextVitals,
  ...nextTs,
  // Design system: colors come from tokens, never arbitrary values like bg-[#123456] (DESIGN.md section 3.2)
  {
    files: ["app/**/*.{ts,tsx}", "components/**/*.{ts,tsx}"],
    rules: {
      "no-restricted-syntax": [
        "error",
        {
          selector: "JSXAttribute[name.name='className'] Literal[value=/\\[(#|rgba?\\(|hsla?\\()/]",
          message: "Use a color token (e.g. text-fg-muted, bg-surface-subtle) instead of an arbitrary color value.",
        },
        {
          selector: "JSXAttribute[name.name='className'] TemplateElement[value.raw=/\\[(#|rgba?\\(|hsla?\\()/]",
          message: "Use a color token (e.g. text-fg-muted, bg-surface-subtle) instead of an arbitrary color value.",
        },
      ],
    },
  },
  globalIgnores([".next/**", "out/**", "build/**", "next-env.d.ts", "lib/api/schema.d.ts"]),
]);

export default eslintConfig;

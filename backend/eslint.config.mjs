import eslint from "@eslint/js";
import prettier from "eslint-config-prettier";
import globals from "globals";
import tseslint from "typescript-eslint";

export default tseslint.config(
  { ignores: ["dist", "coverage", "drizzle", "node_modules"] },
  eslint.configs.recommended,
  ...tseslint.configs.recommendedTypeChecked,
  prettier,
  {
    languageOptions: {
      globals: { ...globals.node, ...globals.jest },
      parserOptions: {
        projectService: { allowDefaultProject: ["*.config.ts", "test/*.ts"] },
        tsconfigRootDir: import.meta.dirname,
      },
    },
    rules: {
      "@typescript-eslint/no-explicit-any": "error",
      "@typescript-eslint/no-floating-promises": "error",
      "@typescript-eslint/no-unused-vars": ["error", { argsIgnorePattern: "^_", varsIgnorePattern: "^_" }],
    },
  },
  {
    // Named exports only (RULES.md). Config files and the Nest entry points are exempt by being outside src/.
    files: ["src/**/*.ts"],
    rules: {
      "no-restricted-exports": ["error", { restrictDefaultExports: { direct: true, named: true, defaultFrom: true } }],
    },
  },
  {
    files: ["**/*.mjs", "**/*.cjs", "*.config.ts"],
    ...tseslint.configs.disableTypeChecked,
  },
);

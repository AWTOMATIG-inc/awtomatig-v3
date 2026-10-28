/**
 * Module-boundary rules (backend/RULES.md section 2). `npm run check:boundaries` runs in `npm run lint` and in CI.
 * @type {import("dependency-cruiser").IConfiguration}
 */
module.exports = {
  forbidden: [
    {
      name: "no-circular",
      comment: "Circular imports hide coupling between modules.",
      severity: "error",
      from: {},
      to: { circular: true },
    },
    {
      name: "module-isolation",
      comment:
        "A module may use another module only through its service/ interface, events or Nest module. " +
        "Never its api/, domain/, repo/ or schema.",
      severity: "error",
      from: { path: "^src/modules/([^/]+)/" },
      to: { path: "^src/modules/[^/]+/(api|domain|repo|schema)", pathNot: "^src/modules/$1/" },
    },
    {
      name: "shared-has-no-business-logic",
      comment: "shared/ is infrastructure. It must never import from a module.",
      severity: "error",
      from: { path: "^src/shared/" },
      to: { path: "^src/modules/" },
    },
    {
      name: "domain-is-pure",
      comment: "domain/ imports no framework, no database code and none of its module's other layers.",
      severity: "error",
      from: { path: "^src/modules/[^/]+/domain/" },
      to: {
        path: [
          "^node_modules/(@nestjs|nestjs-|drizzle-orm|pg|fastify|@fastify)",
          "^src/modules/[^/]+/(api|service|repo|schema)",
          "^src/shared/(db|health|logging|openapi)",
        ],
      },
    },
    {
      name: "api-does-not-touch-data",
      comment: "api/ parses HTTP and calls a service. No repo, no schema.",
      severity: "error",
      from: { path: "^src/modules/[^/]+/api/" },
      to: { path: "^src/modules/[^/]+/(repo|schema)" },
    },
    {
      name: "only-repo-uses-drizzle",
      comment: "Query building belongs in repo/. api/, service/ and domain/ never import drizzle-orm or pg.",
      severity: "error",
      from: { path: "^src/modules/[^/]+/(api|service|domain)/" },
      to: { path: "^node_modules/(drizzle-orm|pg)/" },
    },
  ],
  options: {
    doNotFollow: { path: "node_modules" },
    exclude: { path: "\\.(spec|e2e-spec)\\.ts$" },
    tsConfig: { fileName: "tsconfig.json" },
    enhancedResolveOptions: { exportsFields: ["exports"], conditionNames: ["import", "require", "node", "default", "types"] },
  },
};

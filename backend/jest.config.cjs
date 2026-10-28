/** @type {import("jest").Config} */
module.exports = {
  rootDir: ".",
  roots: ["<rootDir>/src", "<rootDir>/test"],
  testRegex: ".*\\.(spec|e2e-spec)\\.ts$",
  moduleFileExtensions: ["js", "json", "ts"],
  transform: { "^.+\\.ts$": ["ts-jest", { tsconfig: "<rootDir>/tsconfig.test.json" }] },
  moduleNameMapper: { "^@shared/(.*)$": "<rootDir>/src/shared/$1" },
  setupFiles: ["<rootDir>/test/setup-env.ts"],
  testEnvironment: "node",
  clearMocks: true,
};

import { defineConfig, globalIgnores } from "eslint/config";
import nextVitals from "eslint-config-next/core-web-vitals";
import nextTs from "eslint-config-next/typescript";

const eslintConfig = defineConfig([
  ...nextVitals,
  ...nextTs,
  {
    rules: {
      // Rest-destructure-to-omit-a-key (`const { x, ...rest } = obj`) is a deliberate pattern
      // used throughout the room server to strip a field immutably; the unused `x` is intentional.
      // Leading-underscore args/vars are the standard "intentionally unused" convention (e.g. a
      // GameModule.autoMove implementation that doesn't need the playerId it's handed).
      "@typescript-eslint/no-unused-vars": [
        "warn",
        { ignoreRestSiblings: true, argsIgnorePattern: "^_", varsIgnorePattern: "^_" },
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
    // wrangler's local build cache (bundled Worker output from `wrangler dev`/`deploy`).
    ".wrangler/**",
  ]),
]);

export default eslintConfig;

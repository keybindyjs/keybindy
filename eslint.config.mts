import js from "@eslint/js";
import globals from "globals";
import tseslint from "typescript-eslint";
import { defineConfig } from "eslint/config";

export default defineConfig([
  {
    ignores: ["**/node_modules/*", "**/dist/*", "**/build/*"],
  },
  {
    files: ["**/*.{js,mjs,cjs,ts,jsx,tsx}"],
    plugins: { js },
    extends: ["js/recommended"],
    languageOptions: { globals: globals.browser },
  },
  // @ts-expect-error: This is a TypeScript-specific type error that occurs because we're using a JavaScript configuration pattern in a TypeScript file. The configuration works correctly at runtime, but TypeScript's type system can't fully understand the dynamic configuration merging.
  tseslint.configs.recommended,
  {
    rules: {
      "@typescript-eslint/no-explicit-any": "off",
    },
  },
]);

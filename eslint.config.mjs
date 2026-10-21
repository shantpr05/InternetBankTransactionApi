
import js from "@eslint/js";
import tseslint from "typescript-eslint";

export default tseslint.config(
  {
    ignores: ["node_modules/**", "dist/**", "coverage/**"],
  },
  {
    files: ["**/*.js", "**/*.mjs", "**/*.cjs"],
    ...js.configs.recommended,
  },
  {
    files: ["src/**/*.ts"],
    extends: [
      js.configs.recommended,
      ...tseslint.configs.recommended,
    ],
    rules: {
      "@typescript-eslint/no-unused-vars": [
        "error",
        {
         argsIgnorePattern: "^_",
         varsIgnorePattern: "^_",
         caughtErrorsIgnorePattern: "^_",
       },
    ],
   },
  },
);

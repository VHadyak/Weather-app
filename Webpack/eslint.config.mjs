import globals from "globals";
import js from "@eslint/js";
import prettierConfig from "eslint-config-prettier";

export default [
  {
    files: ["**/*.js"], // Apply to JavaScript files
    languageOptions: {
      globals: {
        ...globals.browser, // Include browser globals if needed
        ...globals.node, // Include Node.js globals
      },
      parserOptions: {
        ecmaVersion: "latest", // Use the latest ECMAScript standard
        sourceType: "module", // Support ES modules
      },
    },
    plugins: {
      js, // Register the @eslint/js plugin
    },
    rules: {
      ...js.configs.recommended.rules,
      ...prettierConfig.rules, // Disable ESLint rules that conflict with Prettier
      "no-unused-vars": "error",
      "no-undef": "warn",
      "prefer-arrow-callback": "warn", // Encourage arrow functions in callbacks
    },
  },
];

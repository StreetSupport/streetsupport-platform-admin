import { dirname } from "path";
import { fileURLToPath } from "url";
import { FlatCompat } from "@eslint/eslintrc";
import js from "@eslint/js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const compat = new FlatCompat({
  baseDirectory: __dirname,
  recommendedConfig: js.configs.recommended
});

const config = [
  js.configs.recommended,
  ...compat.extends(
    "next/core-web-vitals",
    "plugin:@typescript-eslint/recommended",
    "plugin:react/recommended",
    "plugin:react-hooks/recommended"
  ),
  {
    files: ["**/*.{js,jsx,ts,tsx}"],
    rules: {
      "react/react-in-jsx-scope": "off",
      "react/prop-types": "off",
      "@typescript-eslint/explicit-module-boundary-types": "off",
      "@typescript-eslint/no-unused-vars": ["warn", { "argsIgnorePattern": "^_" }],
      "no-console": ["warn", { "allow": ["warn", "error"] }],
      "@next/next/no-img-element": "off"
    },
    settings: {
      react: {
        version: "detect"
      }
    }
  },
  {
    files: ["**/*.test.{js,jsx,ts,tsx}", "**/*.spec.{js,jsx,ts,tsx}", "**/tests/**/*", "**/config/jest.setup.js", "**/config/jest.config.cjs"],
    rules: {
      "@typescript-eslint/no-require-imports": "off",
      "no-undef": "off",
      "@typescript-eslint/no-explicit-any": "off",
      "react/display-name": "off",
      "prefer-rest-params": "off",
      "@typescript-eslint/ban-ts-comment": "off"
    },
    languageOptions: {
      globals: {
        jest: "readonly",
        describe: "readonly",
        it: "readonly",
        expect: "readonly",
        beforeAll: "readonly",
        beforeEach: "readonly",
        afterAll: "readonly",
        afterEach: "readonly"
      }
    }
  },
  {
    files: ["scripts/**/*"],
    rules: {
      "no-console": "off"
    }
  },
  {
    ignores: ["**/node_modules/**", "**/.next/**", "**/out/**", "**/public/**", "**/coverage/**"]
  }
];

export default config;
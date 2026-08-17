import { defineConfig, globalIgnores } from "eslint/config";
import eslint from "@eslint/js";
import next from "@next/eslint-plugin-next";
import jsxA11y from "eslint-plugin-jsx-a11y";
import react from "eslint-plugin-react";
import reactHooks from "eslint-plugin-react-hooks";
import globals from "globals";
import tseslint from "typescript-eslint";

const eslintConfig = defineConfig([
  globalIgnores([
    ".next/**",
    "dist/**",
    "out/**",
    "build/**",
    "next-env.d.ts",
  ]),
  eslint.configs.recommended,
  ...tseslint.configs.recommended,
  react.configs.flat.recommended,
  react.configs.flat["jsx-runtime"],
  reactHooks.configs.flat["recommended-latest"],
  jsxA11y.flatConfigs.recommended,
  next.configs["core-web-vitals"],
  {
    rules: {
      // Authorized data loaders update state only after asynchronous I/O.
      "react-hooks/set-state-in-effect": "off",
      // vinext uses native anchors and does not expose Next's Link component.
      "@next/next/no-html-link-for-pages": "off",
      "@next/next/no-img-element": "off",
    },
    languageOptions: {
      globals: {
        ...globals.browser,
        ...globals.node,
        ...globals.serviceworker,
      },
    },
    settings: {
      react: {
        version: "detect",
      },
    },
  },
  {
    files: ["app/page.tsx"],
    rules: {
      // Dialogs have keyboard-accessible close buttons; backdrop clicks are optional.
      "jsx-a11y/no-noninteractive-element-interactions": "off",
    },
  },
  {
    files: ["app/control/page.tsx"],
    rules: {
      // Change signals are generated only inside submit/click handlers.
      "react-hooks/purity": "off",
      // Compact switches carry their accessible action text in the title attribute.
      "jsx-a11y/label-has-associated-control": ["error", { labelAttributes: ["title"], depth: 3 }],
    },
  },
]);

export default eslintConfig;

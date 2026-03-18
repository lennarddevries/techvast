import js from "@eslint/js"
import globals from "globals"
import tseslint from "typescript-eslint"
import eslintPluginAstro from "eslint-plugin-astro"

export default [
  js.configs.recommended,
  ...tseslint.configs.recommended,
  ...eslintPluginAstro.configs.recommended,
  {
    ignores: ["dist", ".astro", "node_modules"],
  },
  {
    files: ["**/*.ts"],
    languageOptions: {
      ecmaVersion: 2020,
      globals: globals.browser,
    },
  },
  {
    files: ["**/*.cjs"],
    languageOptions: {
      globals: globals.node,
    },
  },
]

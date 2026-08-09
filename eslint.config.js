// https://docs.expo.dev/guides/using-eslint/
const { defineConfig } = require('eslint/config');
const expoConfig = require("eslint-config-expo/flat");

module.exports = defineConfig([
  expoConfig,
  {
    ignores: ["dist/*"],
  },
  {
    files: ["**/*.test.ts", "**/*.test.tsx"],
    rules: {
      // jest.mock() must be written before the imports it mocks (Jest hoists it either way),
      // and mock factories commonly use require() to avoid referencing out-of-scope variables.
      "import/first": "off",
      "@typescript-eslint/no-require-imports": "off",
    },
  }
]);

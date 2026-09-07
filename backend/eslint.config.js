import js from "@eslint/js";
import globals from "globals";
import { defineConfig } from "eslint/config";

export default defineConfig([
  {
    files: ["**/*.js", "**/*.spec.js"],
    languageOptions: {
      sourceType: "module", // 👈 ده أهم جزء، بيخلّي ESLint يفهم require بدل import
      globals: {
        ...globals.node,
        ...globals.jest, // بيخلي process, __dirname, require... متعرفين تلقائيًا
      },
    },
    rules: {
      // ممكن تضيفي أو تغيري قواعد زي ما تحبي هنا
      "no-var": "off", // مثال: تسمحي باستخدام var
      "prefer-const": "error",
      // Express error middleware requires the 4-arg signature (err, req, res, next)
      "no-unused-vars": ["error", { "argsIgnorePattern": "^next$" }],
    },
    extends: [js.configs.recommended],
  },
]);

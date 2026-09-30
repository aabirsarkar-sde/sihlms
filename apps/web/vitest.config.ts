import { defineConfig } from "vitest/config";
import path from "node:path";

export default defineConfig({
  test: { include: ["src/**/*.test.ts"], exclude: ["src/**/*.int.test.ts", "node_modules/**"], environment: "node" },
  resolve: { alias: { "@": path.resolve(__dirname, "src") } },
});

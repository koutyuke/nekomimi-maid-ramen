import react from "@vitejs/plugin-react";
import svgr from "vite-plugin-svgr";
import { defineConfig } from "vitest/config";

export default defineConfig({
  plugins: [react(), svgr()],
  test: {
    environment: "happy-dom",
    setupFiles: ["./src/testing/setup.ts"],
  },
});

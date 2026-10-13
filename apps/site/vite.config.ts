import tailwindcss from "@tailwindcss/vite";
import { tanstackRouter } from "@tanstack/router-plugin/vite";
import react from "@vitejs/plugin-react";
import { fontSubsetter } from "rollup-plugin-font-subsetter";
import { defineConfig } from "vite";
import { imagetools } from "vite-imagetools";
import svgr from "vite-plugin-svgr";

export default defineConfig({
  plugins: [
    tanstackRouter({
      target: "react",
      autoCodeSplitting: true,
      routeFileIgnorePattern: "\\.(test|stories)\\.tsx?$",
    }),
    react(),
    tailwindcss(),
    imagetools(),
    svgr(),
    fontSubsetter(),
  ],
});

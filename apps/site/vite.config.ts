import tailwindcss from "@tailwindcss/vite";
import { tanstackRouter } from "@tanstack/router-plugin/vite";
import react from "@vitejs/plugin-react";
import { fontSubsetter } from "rollup-plugin-font-subsetter";
import { defineConfig } from "vite";
import { imagetools } from "vite-imagetools";

export default defineConfig({
  // 経路を走査して`routeTree.gen.ts`を書き出すため、Reactの変換より先に置く。
  plugins: [
    tanstackRouter({
      target: "react",
      autoCodeSplitting: true,
      routeFileIgnorePattern: "\\.(test|stories)\\.tsx?$",
    }),
    react(),
    tailwindcss(),
    imagetools(),
    fontSubsetter(),
  ],
});

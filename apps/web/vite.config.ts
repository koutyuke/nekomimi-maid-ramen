import { tanstackRouter } from "@tanstack/router-plugin/vite";
import react from "@vitejs/plugin-react";
import { defineConfig } from "vite";

export default defineConfig({
  // APIが手元で許可する送信元はこのポートに固定されている。空いていなければ別のポートへ
  // 移らず失敗させ、CORSで拒否される状態のまま起動しないようにする。
  server: {
    port: 5173,
    strictPort: true,
  },
  // 経路を走査して`routeTree.gen.ts`を書き出すため、Reactの変換より先に置く。
  plugins: [
    tanstackRouter({
      target: "react",
      autoCodeSplitting: true,
      routeFileIgnorePattern: "\\.(test|stories)\\.tsx?$",
    }),
    react(),
  ],
});

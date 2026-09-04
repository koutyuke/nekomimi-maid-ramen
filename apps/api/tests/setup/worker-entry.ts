// Elysiaの事前コンパイルはWorkerの起動時にしか行えず、本番の入口(`src/index.ts`)を
// テストランナー内で読み込むと拒否される。テストは経路を直接呼ぶため入口を使わない。
export default {
  fetch: () => new Response(null, { status: 501 }),
} satisfies ExportedHandler;

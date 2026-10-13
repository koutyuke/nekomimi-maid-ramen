import { createFileRoute } from "@tanstack/react-router";

import { TermsPage } from "../layers/pages/legal";
import { getSiteBaseURL } from "@nekomimi/core/http";

export const Route = createFileRoute("/terms")({
  head: () => ({
    meta: [
      { title: "利用規約 | 猫耳メイドラーメン" },
      { name: "description", content: "猫耳メイドラーメンの公開サイトとスタッフ機能の利用条件を定めた利用規約です。" },
    ],
    links: [{ rel: "canonical", href: new URL("/terms", getSiteBaseURL(true)).href }],
  }),
  component: TermsPage,
});

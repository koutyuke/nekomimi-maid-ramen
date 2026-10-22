import { createFileRoute } from "@tanstack/react-router";

import { KanaiPage } from "../../layers/pages/sponsor";
import { getSiteBaseURL } from "@nekomimi/core/http";

export const Route = createFileRoute("/sponsors/kanai")({
  head: () => ({
    meta: [
      { title: "イベントショップ カナイ | 猫耳メイドラーメン" },
      {
        name: "description",
        content: "猫耳メイドラーメンにご協賛いただいたイベントショップ カナイの紹介とアルバイト募集の案内です。",
      },
    ],
    links: [{ rel: "canonical", href: new URL("/sponsors/kanai", getSiteBaseURL(true)).href }],
  }),
  component: KanaiPage,
});

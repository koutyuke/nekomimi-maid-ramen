import { createFileRoute } from "@tanstack/react-router";

import { PrivacyPage } from "../layers/pages/legal";
import { getSiteBaseURL } from "@nekomimi/core/http";

export const Route = createFileRoute("/privacy")({
  head: () => ({
    meta: [
      { title: "プライバシーポリシー | 猫耳メイドラーメン" },
      {
        name: "description",
        content:
          "猫耳メイドラーメンの公開サイトとスタッフ機能で扱う情報と、その取り扱いを定めたプライバシーポリシーです。",
      },
    ],
    links: [{ rel: "canonical", href: new URL("/privacy", getSiteBaseURL(true)).href }],
  }),
  component: PrivacyPage,
});

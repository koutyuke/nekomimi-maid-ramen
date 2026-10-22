import { createFileRoute } from "@tanstack/react-router";

import { MarushouPage } from "../../layers/pages/sponsor";
import { getSiteBaseURL } from "@nekomimi/core/http";

export const Route = createFileRoute("/sponsors/marushou")({
  head: () => ({
    meta: [
      { title: "味噌乃マルショウ 那珂後台店 | 猫耳メイドラーメン" },
      { name: "description", content: "猫耳メイドラーメンにご協賛いただいた味噌乃マルショウ 那珂後台店の紹介です。" },
    ],
    links: [{ rel: "canonical", href: new URL("/sponsors/marushou", getSiteBaseURL(true)).href }],
  }),
  component: MarushouPage,
});

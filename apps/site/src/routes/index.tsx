import { createFileRoute } from "@tanstack/react-router";

import { HomePage } from "../layers/pages/home";
import { getSiteBaseURL } from "@nekomimi/core/http";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "猫耳メイドラーメン" },
      {
        name: "description",
        content: "茨城高専の文化祭に出店する猫耳メイドラーメンのメニュー、営業時間、出店場所をご案内します。",
      },
    ],
    links: [{ rel: "canonical", href: new URL("/", getSiteBaseURL(true)).href }],
  }),
  component: HomePage,
});

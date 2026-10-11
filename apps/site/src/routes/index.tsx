import { createFileRoute } from "@tanstack/react-router";

import { HomePage } from "../layers/pages/home";

export const Route = createFileRoute("/")({
  head: () => ({ meta: [{ title: "トップ | 猫耳メイドラーメン" }] }),
  component: HomePage,
});

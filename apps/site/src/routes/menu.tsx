import { createFileRoute } from "@tanstack/react-router";

import { MenuPage } from "../layers/pages/menu";

export const Route = createFileRoute("/menu")({
  head: () => ({ meta: [{ title: "メニュー | 猫耳メイドラーメン" }] }),
  component: MenuPage,
});

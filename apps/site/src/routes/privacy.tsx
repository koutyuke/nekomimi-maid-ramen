import { createFileRoute } from "@tanstack/react-router";

import { PrivacyPage } from "../layers/pages/legal";

export const Route = createFileRoute("/privacy")({
  head: () => ({ meta: [{ title: "プライバシーポリシー | 猫耳メイドラーメン" }] }),
  component: PrivacyPage,
});

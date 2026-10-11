import { createFileRoute } from "@tanstack/react-router";

import { TermsPage } from "../layers/pages/legal";

export const Route = createFileRoute("/terms")({
  head: () => ({ meta: [{ title: "利用規約 | 猫耳メイドラーメン" }] }),
  component: TermsPage,
});

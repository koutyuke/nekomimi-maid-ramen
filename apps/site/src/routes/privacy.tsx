import { createFileRoute } from "@tanstack/react-router";

import { pageHead } from "../layers/app/head";
import { PrivacyPage } from "../layers/pages/legal";

export const Route = createFileRoute("/privacy")({
  head: () => pageHead("/privacy"),
  component: PrivacyPage,
});

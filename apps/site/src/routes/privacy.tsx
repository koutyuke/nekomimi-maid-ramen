import { createFileRoute } from "@tanstack/react-router";

import { PrivacyPage } from "../layers/pages/legal";
import { pageHead } from "./-page-heads";

export const Route = createFileRoute("/privacy")({
  head: () => pageHead("/privacy"),
  component: PrivacyPage,
});

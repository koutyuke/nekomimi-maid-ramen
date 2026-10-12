import { createFileRoute } from "@tanstack/react-router";

import { TermsPage } from "../layers/pages/legal";
import { pageHead } from "./-page-heads";

export const Route = createFileRoute("/terms")({
  head: () => pageHead("/terms"),
  component: TermsPage,
});

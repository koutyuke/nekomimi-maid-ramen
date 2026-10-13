import { createFileRoute } from "@tanstack/react-router";

import { pageHead } from "../layers/app/head";
import { TermsPage } from "../layers/pages/legal";

export const Route = createFileRoute("/terms")({
  head: () => pageHead("/terms"),
  component: TermsPage,
});

import { createFileRoute } from "@tanstack/react-router";

import { HomePage } from "../layers/pages/home";
import { pageHead } from "./-page-heads";

export const Route = createFileRoute("/")({
  head: () => pageHead("/"),
  component: HomePage,
});

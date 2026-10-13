import { createFileRoute } from "@tanstack/react-router";

import { pageHead } from "../layers/app/head";
import { HomePage } from "../layers/pages/home";

export const Route = createFileRoute("/")({
  head: () => pageHead("/"),
  component: HomePage,
});

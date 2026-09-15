import { createFileRoute } from "@tanstack/react-router";

import { HomeAuthenticatedLayout } from "../layers/app/layout";
import { HomePage } from "../layers/pages/home";

const Page = () => (
  <HomeAuthenticatedLayout>
    <HomePage />
  </HomeAuthenticatedLayout>
);

export const Route = createFileRoute("/")({ component: Page });

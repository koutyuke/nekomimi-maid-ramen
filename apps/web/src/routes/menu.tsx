import { createFileRoute } from "@tanstack/react-router";

import { MenuPage } from "../layers/pages/menu";

export const Route = createFileRoute("/menu")({
  component: MenuPage,
});

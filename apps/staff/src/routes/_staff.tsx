import { createFileRoute } from "@tanstack/react-router";

import { StaffAuthenticatedLayout } from "../layers/app/layout";

export const Route = createFileRoute("/_staff")({
  component: StaffAuthenticatedLayout,
});

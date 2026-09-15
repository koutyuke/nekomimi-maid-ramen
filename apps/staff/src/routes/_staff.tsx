import { createFileRoute } from "@tanstack/react-router";

import { StaffPermissionLayout } from "../layers/app/layout";

export const Route = createFileRoute("/_staff")({
  component: StaffPermissionLayout,
});

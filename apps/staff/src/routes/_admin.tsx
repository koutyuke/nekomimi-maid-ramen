import { createFileRoute } from "@tanstack/react-router";

import { AdminPermissionLayout } from "../layers/app/layout";

export const Route = createFileRoute("/_admin")({ component: AdminPermissionLayout });

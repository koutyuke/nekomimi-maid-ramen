import { createFileRoute } from "@tanstack/react-router";

import { AdminAuthenticatedLayout } from "../layers/app/layout";

export const Route = createFileRoute("/_admin")({ component: AdminAuthenticatedLayout });

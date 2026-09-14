import { createFileRoute } from "@tanstack/react-router";

import { AuthenticatedLayout } from "../layers/app/layout";

export const Route = createFileRoute("/_authenticated")({ component: AuthenticatedLayout });

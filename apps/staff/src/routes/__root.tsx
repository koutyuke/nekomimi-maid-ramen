import { createRootRoute } from "@tanstack/react-router";

import { AuthenticatedLayout } from "../layers/app/layout";

export const Route = createRootRoute({ component: AuthenticatedLayout });

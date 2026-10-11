import { createRootRoute } from "@tanstack/react-router";

import { SiteLayout } from "../layers/app/layout";

export const Route = createRootRoute({ component: SiteLayout });

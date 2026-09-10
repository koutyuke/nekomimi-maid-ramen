import { createFileRoute } from "@tanstack/react-router";

import { AuthenticatedStaffLayout } from "../layers/pages/staff";

export const Route = createFileRoute("/_authenticated")({ component: AuthenticatedStaffLayout });

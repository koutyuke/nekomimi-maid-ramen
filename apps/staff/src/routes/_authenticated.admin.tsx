import { createFileRoute } from "@tanstack/react-router";

import { AdminPage } from "../layers/pages/admin";

export const Route = createFileRoute("/_authenticated/admin")({ component: AdminPage });

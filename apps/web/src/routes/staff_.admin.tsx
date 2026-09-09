import { createFileRoute } from "@tanstack/react-router";

import { AdminPage } from "../layers/pages/admin";

export const Route = createFileRoute("/staff_/admin")({ component: AdminPage });

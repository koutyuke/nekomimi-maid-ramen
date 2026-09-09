import { createFileRoute } from "@tanstack/react-router";

import { StaffPage } from "../layers/pages/staff";

export const Route = createFileRoute("/staff")({ component: StaffPage });

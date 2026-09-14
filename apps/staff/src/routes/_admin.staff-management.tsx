import { createFileRoute } from "@tanstack/react-router";

import { StaffManagementPage } from "../layers/pages/staff-management";

export const Route = createFileRoute("/_admin/staff-management")({ component: StaffManagementPage });

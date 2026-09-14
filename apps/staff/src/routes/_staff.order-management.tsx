import { createFileRoute } from "@tanstack/react-router";

import { OrderManagementPage } from "../layers/pages/order-management";

export const Route = createFileRoute("/_staff/order-management")({ component: OrderManagementPage });

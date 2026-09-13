import { createFileRoute } from "@tanstack/react-router";

import { OrderManagementPage } from "../layers/pages/order-management";

export const Route = createFileRoute("/_authenticated/order-management")({ component: OrderManagementPage });

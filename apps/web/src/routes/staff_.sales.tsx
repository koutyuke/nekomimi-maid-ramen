import { createFileRoute } from "@tanstack/react-router";

import { OrderEntryPage } from "../layers/pages/order-entry";

export const Route = createFileRoute("/staff_/sales")({ component: OrderEntryPage });

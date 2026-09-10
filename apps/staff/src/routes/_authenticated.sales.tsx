import { createFileRoute } from "@tanstack/react-router";

import { OrderEntryPage } from "../layers/pages/order-entry";

export const Route = createFileRoute("/_authenticated/sales")({ component: OrderEntryPage });

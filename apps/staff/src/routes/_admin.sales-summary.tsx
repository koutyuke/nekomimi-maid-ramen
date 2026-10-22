import { createFileRoute } from "@tanstack/react-router";

import { SalesSummaryPage } from "../layers/pages/sales-summary";

export const Route = createFileRoute("/_admin/sales-summary")({ component: SalesSummaryPage });

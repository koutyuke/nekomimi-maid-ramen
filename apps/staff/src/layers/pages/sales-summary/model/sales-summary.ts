import type { api } from "../../../shared/api";

type SalesSummaryResponse = NonNullable<Awaited<ReturnType<(typeof api.staff)["sales-summary"]["get"]>>["data"]>;
export type SalesSummary = Omit<SalesSummaryResponse, "revision">;

import type { api } from "../../../shared/api";

export type HandoffOrder = NonNullable<Awaited<ReturnType<typeof api.staff.orders.get>>["data"]>["orders"][number];
export type HandoffOrderLine = HandoffOrder["lines"][number];

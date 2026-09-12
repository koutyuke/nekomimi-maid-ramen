import type { api } from "../../../shared/api";

export type HandoffOrder = NonNullable<Awaited<ReturnType<typeof api.orders.get>>["data"]>["orders"][number];
export type HandoffOrderLine = HandoffOrder["lines"][number];

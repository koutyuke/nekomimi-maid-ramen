import type { api } from "../../../shared/api";

export type KitchenOrder = NonNullable<Awaited<ReturnType<typeof api.orders.get>>["data"]>["orders"][number];
export type CookingState = KitchenOrder["cookingState"];
export type KitchenOrderLine = KitchenOrder["lines"][number];
export const cookingStateLabels = { unstarted: "未調理", cooking: "調理中", completed: "完成" } as const;

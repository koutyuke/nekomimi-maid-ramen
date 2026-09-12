import { MenuItemId } from "../../../../core/domain/ids";
import { Stock, StockQuantity } from "../../domain/stock";

export const stockFixture = (menuItemId: string, quantity: number): Stock =>
  new Stock({
    menuItemId: MenuItemId.make(menuItemId),
    quantity: StockQuantity.make(quantity),
    updatedAt: new Date("2026-10-31T09:00:00.000Z"),
  });

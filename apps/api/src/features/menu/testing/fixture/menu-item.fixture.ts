import { MenuItemId } from "../../../../core/domain/ids";
import { Price } from "../../../../core/domain/money";
import { DisplayOrder, ItemName, MenuItem } from "../../domain/menu-item";
import type { MenuCategory } from "../../domain/menu-item";

export const menuItemFixture = (args: {
  id: string;
  name: string;
  price: number;
  displayOrder: number;
  category?: MenuCategory;
}): MenuItem =>
  new MenuItem({
    id: MenuItemId.make(args.id),
    name: ItemName.make(args.name),
    price: Price.make(args.price),
    category: args.category ?? "main",
    displayOrder: DisplayOrder.make(args.displayOrder),
  });

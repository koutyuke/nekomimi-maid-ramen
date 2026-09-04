import { Option } from "effect";

import { MenuItemId } from "../../../../core/domain/ids";
import { Price } from "../../../../core/domain/money";
import { Allergen, AllergenId, AllergenName } from "../../domain/allergen";
import {
  type AllergenCheckState,
  Description,
  DisplayOrder,
  ItemName,
  type MenuCategory,
  MenuItem,
} from "../../domain/menu-item";

export const allergenFixture = (id: string, name: string): Allergen =>
  new Allergen({ id: AllergenId.make(id), name: AllergenName.make(name) });

export const menuItemFixture = (args: {
  id: string;
  name: string;
  price: number;
  displayOrder: number;
  category?: MenuCategory;
  description?: string;
  allergenCheckState?: AllergenCheckState;
  containedAllergens?: ReadonlyArray<Allergen>;
}): MenuItem =>
  new MenuItem({
    id: MenuItemId.make(args.id),
    name: ItemName.make(args.name),
    description: args.description === undefined ? Option.none() : Option.some(Description.make(args.description)),
    price: Price.make(args.price),
    category: args.category ?? "main",
    displayOrder: DisplayOrder.make(args.displayOrder),
    allergenCheckState: args.allergenCheckState ?? "unchecked",
    containedAllergens: args.containedAllergens ?? [],
  });

import { Context } from "effect";
import type { Effect } from "effect";

import type { MenuItemId } from "../../../../../core/domain/ids";
import type { Price } from "../../../../../core/domain/money";
import type { PersistenceError } from "../../../../../core/domain/persistence-error";
import type { MenuItem } from "../../../domain/menu-item";

export type MenuItemPrice = {
  readonly menuItemId: MenuItemId;
  readonly price: Price;
};

/**
 * 商品情報を所有する領域が、外部へ提供する読み取りFacade。
 * 内部の`MenuItemRepository`や保存形式はこのFacadeに含めない。
 */
export class MenuItemCatalogFacade extends Context.Tag("MenuItemCatalogFacade")<
  MenuItemCatalogFacade,
  {
    readonly listInDisplayOrder: () => Effect.Effect<ReadonlyArray<MenuItem>, PersistenceError>;
    readonly findPrices: (
      menuItemIds: ReadonlyArray<MenuItemId>,
    ) => Effect.Effect<ReadonlyArray<MenuItemPrice>, PersistenceError>;
  }
>() {}

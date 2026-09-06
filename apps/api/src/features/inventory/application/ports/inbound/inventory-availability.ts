import { Context } from "effect";
import type { Effect } from "effect";

import type { MenuItemId } from "../../../../../core/domain/ids";
import type { PersistenceError } from "../../../../../core/domain/persistence-error";

export type InventoryDemand = {
  readonly menuItemId: MenuItemId;
  readonly quantity: number;
};

export type InventoryShortage = {
  readonly menuItemId: MenuItemId;
  readonly requested: number;
  readonly available: number;
};

/**
 * 在庫の現在値を、在庫を所有する領域の外へ持ち出さずに問い合わせる公開サービス。
 */
export class InventoryAvailability extends Context.Tag("InventoryAvailability")<
  InventoryAvailability,
  {
    readonly findShortages: (
      demands: ReadonlyArray<InventoryDemand>,
    ) => Effect.Effect<ReadonlyArray<InventoryShortage>, PersistenceError>;
  }
>() {}

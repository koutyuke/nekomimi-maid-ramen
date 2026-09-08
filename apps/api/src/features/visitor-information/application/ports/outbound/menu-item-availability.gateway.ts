import { Context } from "effect";
import type { Effect } from "effect";

import type { MenuItemId } from "../../../../../core/domain/ids";
import type { PersistenceError } from "../../../../../core/domain/persistence-error";

export type MenuItemSellability = {
  readonly menuItemId: MenuItemId;
  readonly sellable: boolean;
};

/**
 * メニュー表示が在庫領域へ販売可否を要求するGateway。
 * 実装は領域間接続側で在庫領域のFacadeへ変換する。
 */
export class MenuItemAvailabilityGateway extends Context.Tag("MenuItemAvailabilityGateway")<
  MenuItemAvailabilityGateway,
  {
    readonly listSellability: (
      menuItemIds: ReadonlyArray<MenuItemId>,
    ) => Effect.Effect<ReadonlyArray<MenuItemSellability>, PersistenceError>;
  }
>() {}

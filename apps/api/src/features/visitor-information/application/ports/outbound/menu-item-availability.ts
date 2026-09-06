import { Context } from "effect";
import type { Effect } from "effect";

import type { MenuItemId } from "../../../../../core/domain/ids";
import type { PersistenceError } from "../../../../../core/domain/persistence-error";

export type MenuItemSellability = {
  readonly menuItemId: MenuItemId;
  readonly sellable: boolean;
};

/**
 * メニュー表示が必要とする販売可否の問い合わせ契約。
 * 実装は領域間接続側で在庫サービスへ変換する。
 */
export class MenuItemAvailability extends Context.Tag("MenuItemAvailability")<
  MenuItemAvailability,
  {
    readonly listSellability: (
      menuItemIds: ReadonlyArray<MenuItemId>,
    ) => Effect.Effect<ReadonlyArray<MenuItemSellability>, PersistenceError>;
  }
>() {}

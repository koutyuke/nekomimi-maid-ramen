import { Data, Schema } from "effect";

import { MenuItemId } from "../../../core/domain/ids";

export const StockQuantity = Schema.Int.pipe(Schema.nonNegative(), Schema.brand("StockQuantity"));
export type StockQuantity = Schema.Schema.Type<typeof StockQuantity>;

/**
 * 商品ごとの在庫。
 *
 * @param menuItemId 商品ID
 * @param quantity 個数
 * @param updatedAt 更新日時
 */
export class Stock extends Schema.Class<Stock>("Stock")({
  menuItemId: MenuItemId,
  quantity: StockQuantity,
  updatedAt: Schema.DateFromSelf,
}) {}

export const isSellable = (stock: Stock): boolean => stock.quantity > 0;

/**
 * 在庫の判定にかける要求。
 *
 * @param menuItemId 商品ID
 * @param quantity 要求された個数
 */
export type StockDemand = {
  readonly menuItemId: MenuItemId;
  readonly quantity: number;
};

/**
 * 不足した商品ひとつ分の内訳。
 *
 * @param menuItemId 商品ID
 * @param requested 要求された個数
 * @param available 販売できる個数
 */
export type StockShortage = {
  readonly menuItemId: MenuItemId;
  readonly requested: number;
  readonly available: number;
};

/**
 * 在庫不足で注文を確定できないことを表す業務エラー。
 */
export class OutOfStock extends Data.TaggedError("OutOfStock")<{
  readonly shortages: ReadonlyArray<StockShortage>;
}> {}

/**
 * 在庫と要求を突き合わせ、不足した商品だけの内訳を返す関数。
 *
 * @param stocks 在庫
 * @param demands 要求
 * @returns 不足した商品の内訳。すべて足りていれば空を返す。
 */
export const shortagesFor = (
  stocks: ReadonlyArray<Stock>,
  demands: ReadonlyArray<StockDemand>,
): ReadonlyArray<StockShortage> => {
  const availableByMenuItemId = new Map(stocks.map((stock) => [stock.menuItemId, stock.quantity as number]));

  return demands.flatMap((demand) => {
    const available = availableByMenuItemId.get(demand.menuItemId) ?? 0;

    return available < demand.quantity
      ? [{ menuItemId: demand.menuItemId, requested: demand.quantity, available }]
      : [];
  });
};

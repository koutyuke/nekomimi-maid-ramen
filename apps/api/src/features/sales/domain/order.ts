import { Data, Schema } from "effect";

import { MenuItemId, OrderId } from "../../../core/domain/ids";
import { Amount, Price } from "../../../core/domain/money";

export const BusinessDate = Schema.String.pipe(Schema.pattern(/^\d{4}-\d{2}-\d{2}$/), Schema.brand("BusinessDate"));
export type BusinessDate = Schema.Schema.Type<typeof BusinessDate>;

export const OrderNumber = Schema.Int.pipe(Schema.positive(), Schema.brand("OrderNumber"));
export type OrderNumber = Schema.Schema.Type<typeof OrderNumber>;

export const ConfirmationRequestId = Schema.String.pipe(
  Schema.nonEmptyString(),
  Schema.maxLength(64),
  Schema.brand("ConfirmationRequestId"),
);
export type ConfirmationRequestId = Schema.Schema.Type<typeof ConfirmationRequestId>;

export const LineQuantity = Schema.Int.pipe(Schema.between(1, 10), Schema.brand("LineQuantity"));
export type LineQuantity = Schema.Schema.Type<typeof LineQuantity>;

export const CookingState = Schema.Literal("unstarted", "cooking", "completed");
export type CookingState = Schema.Schema.Type<typeof CookingState>;

/**
 * 注文明細の1行。OrderとMenuItemの関連を表す。
 *
 * @param menuItemId 商品ID
 * @param quantity 個数
 * @param unitPrice 確定時の単価
 */
export class OrderLine extends Schema.Class<OrderLine>("OrderLine")({
  menuItemId: MenuItemId,
  quantity: LineQuantity,
  unitPrice: Price,
}) {}

/**
 * 確定した注文。
 *
 * @param id 注文ID
 * @param businessDate 注文番号を数える営業日
 * @param orderNumber 営業日ごとに1から始まる注文番号
 * @param requestId 確定要求の識別子
 * @param lines 注文明細
 * @param totalAmount 確定時の合計金額
 * @param cookingState 調理状況
 * @param confirmedAt 確定日時
 */
export class Order extends Schema.Class<Order>("Order")({
  id: OrderId,
  businessDate: BusinessDate,
  orderNumber: OrderNumber,
  requestId: ConfirmationRequestId,
  lines: Schema.Array(OrderLine),
  totalAmount: Amount,
  cookingState: CookingState,
  confirmedAt: Schema.DateFromSelf,
}) {}

/**
 * 注文番号を発行する前の確定内容。
 *
 * @param id 注文ID
 * @param businessDate 注文番号を数える営業日
 * @param requestId 確定要求の識別子
 * @param lines 注文明細
 * @param totalAmount 確定時の合計金額
 * @param cookingState 調理状況
 * @param confirmedAt 確定日時
 */
export type OrderDraft = {
  readonly id: OrderId;
  readonly businessDate: BusinessDate;
  readonly requestId: ConfirmationRequestId;
  readonly lines: ReadonlyArray<OrderLine>;
  readonly totalAmount: Amount;
  readonly cookingState: CookingState;
  readonly confirmedAt: Date;
};

/**
 * 確定要求が入力として成立していないことを表す業務エラー。
 */
export class InvalidOrderInput extends Data.TaggedError("InvalidOrderInput")<{
  readonly reason: string;
}> {}

/**
 * 販売していない商品を含むことを表す業務エラー。
 */
export class UnknownMenuItem extends Data.TaggedError("UnknownMenuItem")<{
  readonly menuItemIds: ReadonlyArray<MenuItemId>;
}> {}

export type OrderStockShortage = {
  readonly menuItemId: MenuItemId;
  readonly requested: number;
  readonly available: number;
};

/**
 * 在庫不足のため注文を確定できないことを表す業務エラー。
 */
export class OutOfStock extends Data.TaggedError("OutOfStock")<{
  readonly shortages: ReadonlyArray<OrderStockShortage>;
}> {}

/**
 * 同じ要求識別子の注文がすでに確定していることを表すエラー。
 */
export class DuplicateConfirmation extends Data.TaggedError("DuplicateConfirmation")<{
  readonly requestId: ConfirmationRequestId;
}> {}

/**
 * 確定の直前に別の確定へ在庫を奪われたことを表すエラー。
 */
export class ConfirmationLostStockRace extends Data.TaggedError("ConfirmationLostStockRace")<{
  readonly requestId: ConfirmationRequestId;
}> {}

const JAPAN_STANDARD_TIME_OFFSET_MS = 9 * 60 * 60 * 1000;

/**
 * 時点が属する営業日を求める関数。
 *
 * @param instant 判定する時点
 * @returns 日本時間の暦日
 */
export const businessDateAt = (instant: Date): BusinessDate =>
  BusinessDate.make(new Date(instant.getTime() + JAPAN_STANDARD_TIME_OFFSET_MS).toISOString().slice(0, 10));

/**
 * 注文明細の小計を合計する関数。
 *
 * @param lines 注文明細
 * @returns 合計金額
 */
export const totalAmountOf = (lines: ReadonlyArray<OrderLine>): Amount =>
  Amount.make(lines.reduce((total, line) => total + line.unitPrice * line.quantity, 0));

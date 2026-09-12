import { MenuItemId, OrderId } from "../../../../core/domain/ids";
import { Amount, Price } from "../../../../core/domain/money";
import {
  BusinessDate,
  ConfirmationRequestId,
  LineQuantity,
  Order,
  OrderLine,
  OrderNumber,
  totalAmountOf,
} from "../../domain/order";
import type { CookingState } from "../../../../core/domain/cooking-state";

export const orderLineFixture = (
  menuItemId: string,
  quantity: number,
  unitPrice: number,
  cookingState: CookingState = "unstarted",
): OrderLine =>
  new OrderLine({
    menuItemId: MenuItemId.make(menuItemId),
    quantity: LineQuantity.make(quantity),
    unitPrice: Price.make(unitPrice),
    cookingState,
  });

export const orderFixture = (args: {
  id: string;
  orderNumber: number;
  requestId: string;
  lines: ReadonlyArray<OrderLine>;
  businessDate?: string;
  totalAmount?: number;
}): Order =>
  new Order({
    id: OrderId.make(args.id),
    businessDate: BusinessDate.make(args.businessDate ?? "2026-11-01"),
    orderNumber: OrderNumber.make(args.orderNumber),
    requestId: ConfirmationRequestId.make(args.requestId),
    lines: args.lines,
    totalAmount: args.totalAmount === undefined ? totalAmountOf(args.lines) : Amount.make(args.totalAmount),
    confirmedAt: new Date("2026-11-01T02:00:00.000Z"),
  });

import { Layer, ManagedRuntime } from "effect";
import { describe, expect, it } from "vitest";

import { realtimeMock } from "../../../../testing/realtime";
import { createApp } from "../../../bootstrap/create-app";
import { PersistenceError } from "../../../core/domain/persistence-error";
import {
  inventoryAvailabilityFacadeMock,
  menuItemFixture,
  menuItemRepositoryMock,
  stockFixture,
} from "../../../features/menu/testing";
import {
  failingOrderRepositoryMock,
  orderOperationsMock,
  orderPricingGatewayMock,
  orderRepositoryMock,
  orderStockAvailabilityGatewayMock,
} from "../../../features/orders/testing";
import { authenticationGatewayMock, staffFixture, staffRepositoryMock } from "../../../features/staff/testing";
import type { AppRequirements } from "../../../bootstrap/create-app";
import type { Stock } from "../../../features/menu/testing";
import type { StaffAccessRequirements } from "../../../plugins/staff-access";

const ramen = menuItemFixture({ id: "item-ramen", name: "ラーメン", price: 500, displayOrder: 1 });

const appWith = (
  layers: Layer.Layer<
    Exclude<
      AppRequirements,
      | Layer.Layer.Success<typeof realtimeMock>
      | StaffAccessRequirements
      | Layer.Layer.Success<ReturnType<typeof staffRepositoryMock>>
      | Layer.Layer.Success<ReturnType<typeof orderOperationsMock>>
    >
  >,
) =>
  createApp({
    origin: "https://staff.nekomimi-ramen.com",
    runtime: ManagedRuntime.make(
      Layer.mergeAll(
        realtimeMock,
        layers,
        orderOperationsMock(),
        authenticationGatewayMock(staffFixture),
        staffRepositoryMock(),
      ),
    ),
    aot: false,
  });

const sellingApp = (stocks: ReadonlyArray<Stock>) =>
  appWith(
    Layer.mergeAll(
      orderPricingGatewayMock([ramen]),
      orderStockAvailabilityGatewayMock(stocks),
      orderRepositoryMock(),
      inventoryAvailabilityFacadeMock([]),
      menuItemRepositoryMock([]),
    ),
  );

const confirm = (app: ReturnType<typeof appWith>, body: unknown) =>
  app.handle(
    new Request("https://api.nekomimi-ramen.com/staff/orders", {
      method: "POST",
      headers: { "content-type": "application/json", origin: "https://staff.nekomimi-ramen.com" },
      body: JSON.stringify(body),
    }),
  );

describe("SPEC-SAL-005 注文確定の応答", () => {
  it("確定した注文を201と注文番号で返す", async () => {
    const response = await confirm(sellingApp([stockFixture("item-ramen", 3)]), {
      requestId: "request-1",
      lines: [{ menuItemId: "item-ramen", quantity: 2 }],
    });

    expect(response.status).toBe(201);
    expect(await response.json()).toMatchObject({
      orderNumber: 1,
      totalAmount: 1000,
      cookingState: "unstarted",
      lines: [{ menuItemId: "item-ramen", quantity: 2, unitPrice: 500, subtotal: 1000 }],
    });
  });
});

describe("SPEC-INV-002 在庫不足の応答", () => {
  it("不足商品と理由を409で返す", async () => {
    const response = await confirm(sellingApp([stockFixture("item-ramen", 1)]), {
      requestId: "request-1",
      lines: [{ menuItemId: "item-ramen", quantity: 2 }],
    });

    expect(response.status).toBe(409);
    expect(await response.json()).toEqual({
      code: "out_of_stock",
      shortages: [{ menuItemId: "item-ramen", requested: 2, available: 1 }],
    });
  });

  it("販売していない商品を422で返す", async () => {
    const response = await confirm(sellingApp([stockFixture("item-ramen", 3)]), {
      requestId: "request-1",
      lines: [{ menuItemId: "item-unknown", quantity: 1 }],
    });

    expect(response.status).toBe(422);
    expect(await response.json()).toEqual({ code: "unknown_menu_item", menuItemIds: ["item-unknown"] });
  });
});

describe("SPEC-SAL-001 受け付けない注文内容", () => {
  it.each([
    ["個数が0", [{ menuItemId: "item-ramen", quantity: 0 }]],
    ["個数が11", [{ menuItemId: "item-ramen", quantity: 11 }]],
    ["個数が整数でない", [{ menuItemId: "item-ramen", quantity: 1.5 }]],
    ["明細が空", []],
  ])("%sの要求を成立させない", async (_name, lines) => {
    const response = await confirm(sellingApp([stockFixture("item-ramen", 3)]), { requestId: "request-1", lines });

    expect(response.status).toBeGreaterThanOrEqual(400);
    expect(response.status).toBeLessThan(500);
  });

  it("同じ商品を複数の明細へ分けた要求を成立させない", async () => {
    const response = await confirm(sellingApp([stockFixture("item-ramen", 5)]), {
      requestId: "request-1",
      lines: [
        { menuItemId: "item-ramen", quantity: 1 },
        { menuItemId: "item-ramen", quantity: 2 },
      ],
    });

    expect(response.status).toBe(422);
    expect(await response.json()).toMatchObject({ code: "invalid_order" });
  });
});

describe("SPEC-OPS-002 保存先が失敗したときの注文確定応答", () => {
  it("失敗を500として返し、内部の情報を応答へ出さない", async () => {
    const app = appWith(
      Layer.mergeAll(
        orderPricingGatewayMock([ramen]),
        orderStockAvailabilityGatewayMock([stockFixture("item-ramen", 3)]),
        failingOrderRepositoryMock(
          new PersistenceError({ operation: "注文の確定", cause: new Error("D1_CONNECTION_LOST") }),
        ),
        inventoryAvailabilityFacadeMock([]),
        menuItemRepositoryMock([]),
      ),
    );

    const response = await confirm(app, { requestId: "request-1", lines: [{ menuItemId: "item-ramen", quantity: 1 }] });
    const body = await response.text();

    expect(response.status).toBe(500);
    expect(body).not.toContain("注文の確定");
    expect(body).not.toContain("D1_CONNECTION_LOST");
  });
});

import { Layer, ManagedRuntime } from "effect";
import { describe, expect, it } from "vitest";

import { createApp } from "../../../app";
import { PersistenceError } from "../../../core/domain/persistence-error";
import { failingInventoryAvailabilityFacadeMock, menuItemRepositoryMock } from "../../../features/menu/testing";
import {
  orderOperationsMock,
  orderPricingGatewayMock,
  orderRepositoryMock,
  orderStockAvailabilityGatewayMock,
} from "../../../features/orders/testing";
import { authenticationGatewayMock, staffRepositoryMock } from "../../../features/staff/testing";

describe("SPEC-OPS-002 保存先が失敗したときのメニュー応答", () => {
  it("失敗を500として返し、内部の情報を応答へ出さない", async () => {
    const failingAvailability = failingInventoryAvailabilityFacadeMock(
      new PersistenceError({ operation: "在庫の一覧取得", cause: new Error("D1_CONNECTION_LOST") }),
    );
    const runtime = ManagedRuntime.make(
      Layer.mergeAll(
        orderOperationsMock(),
        authenticationGatewayMock(),
        staffRepositoryMock(),
        menuItemRepositoryMock([]),
        failingAvailability,
        orderPricingGatewayMock([]),
        orderStockAvailabilityGatewayMock([]),
        orderRepositoryMock(),
      ),
    );
    const app = createApp({ origin: "https://staff.nekomimi-ramen.com", runtime, aot: false });

    const response = await app.handle(
      new Request("https://api.nekomimi-ramen.com/menu", {
        headers: { origin: "https://nekomimi-ramen.com" },
      }),
    );
    expect(response.headers.get("access-control-allow-origin")).toBe("https://nekomimi-ramen.com");
    const body = await response.text();

    expect(response.status).toBe(500);
    expect(body).not.toContain("在庫の一覧取得");
    expect(body).not.toContain("D1_CONNECTION_LOST");
  });
});

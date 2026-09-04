import { Layer, ManagedRuntime } from "effect";
import { describe, expect, it } from "vitest";

import { createApp } from "../../../app";
import { PersistenceError } from "../../../core/domain/persistence-error";
import { failingStockRepositoryMock } from "../../../features/inventory/testing";
import { menuItemRepositoryMock } from "../../../features/visitor-information/testing";

describe("SPEC-OPS-002 保存先が失敗したときのメニュー応答", () => {
  it("失敗を500として返し、内部の情報を応答へ出さない", async () => {
    const runtime = ManagedRuntime.make(
      Layer.mergeAll(
        menuItemRepositoryMock([]),
        failingStockRepositoryMock(
          new PersistenceError({ operation: "在庫の一覧取得", cause: new Error("D1_CONNECTION_LOST") }),
        ),
      ),
    );
    const app = createApp({ origin: "https://nekomimi-ramen.com", runtime, aot: false });

    const response = await app.handle(new Request("https://api.nekomimi-ramen.com/menu"));
    const body = await response.text();

    expect(response.status).toBe(500);
    expect(body).not.toContain("在庫の一覧取得");
    expect(body).not.toContain("D1_CONNECTION_LOST");
  });
});

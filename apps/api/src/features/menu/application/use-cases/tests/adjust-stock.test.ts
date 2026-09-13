import { Effect, Layer } from "effect";
import { describe, expect, it, vi } from "vitest";

import { PersistenceError } from "../../../../../core/domain/persistence-error";
import { StockAdjustment, StockQuantity } from "../../../domain/stock";
import { menuItemFixture, menuItemRepositoryMock } from "../../../testing";
import { MenuUpdatesGateway } from "../../ports/outbound/menu-updates.gateway";
import { StockRepository } from "../../ports/outbound/stock.repository";
import { adjustStock } from "../adjust-stock";

const item = menuItemFixture({ id: "ramen", name: "ラーメン", price: 500, displayOrder: 1 });
const quantity = StockQuantity.make(8);
const adjustment = new StockAdjustment({
  id: "adjustment-1",
  menuItemId: item.id,
  previousQuantity: StockQuantity.make(3),
  quantity,
  adjustedBy: "admin",
  adjustedAt: new Date("2026-09-13T00:00:00Z"),
});

describe("SPEC-INV-004 在庫修正の成立条件と通知", () => {
  it.each(["Owner", "Admin"] as const)("%sは保存された実際の修正前数量を返し、保存後に通知する", async (role) => {
    let saved = false;
    const adjust = vi.fn(() =>
      Effect.sync(() => {
        saved = true;
        return adjustment;
      }),
    );
    const notify = vi.fn(() => Effect.sync(() => expect(saved).toBe(true)));
    const result = await Effect.runPromise(
      adjustStock({ id: "admin", role }, item.id, quantity).pipe(
        Effect.provide(
          Layer.mergeAll(
            menuItemRepositoryMock([item]),
            Layer.succeed(StockRepository, { findMany: () => Effect.succeed([]), adjust }),
            Layer.succeed(MenuUpdatesGateway, { notify }),
          ),
        ),
      ),
    );
    expect(result).toBe(adjustment);
    expect(adjust).toHaveBeenCalledExactlyOnceWith("admin", item.id, quantity);
    expect(notify).toHaveBeenCalledOnce();
  });

  it.each(["Staff", "None"] as const)("HTTPを通さない%sの呼び出しでも保存・通知を拒否する", async (role) => {
    const adjust = vi.fn(() => Effect.succeed(adjustment));
    const notify = vi.fn(() => Effect.void);
    const error = await Effect.runPromise(
      adjustStock({ id: "staff", role }, item.id, quantity).pipe(
        Effect.flip,
        Effect.provide(
          Layer.mergeAll(
            menuItemRepositoryMock([item]),
            Layer.succeed(StockRepository, { findMany: () => Effect.succeed([]), adjust }),
            Layer.succeed(MenuUpdatesGateway, { notify }),
          ),
        ),
      ),
    );
    expect(error._tag).toBe("StockAdjustmentForbidden");
    expect(adjust).not.toHaveBeenCalled();
    expect(notify).not.toHaveBeenCalled();
  });

  it.each(["商品不存在", "保存失敗"])("%sでは成功にせず通知しない", async (condition) => {
    const failure = new PersistenceError({ operation: "在庫の修正", cause: new Error("failure") });
    const adjust = vi.fn(() => Effect.fail(failure));
    const notify = vi.fn(() => Effect.void);
    const error = await Effect.runPromise(
      adjustStock({ id: "admin", role: "Admin" }, item.id, quantity).pipe(
        Effect.flip,
        Effect.provide(
          Layer.mergeAll(
            menuItemRepositoryMock(condition === "商品不存在" ? [] : [item]),
            Layer.succeed(StockRepository, { findMany: () => Effect.succeed([]), adjust }),
            Layer.succeed(MenuUpdatesGateway, { notify }),
          ),
        ),
      ),
    );
    expect(error).toBeInstanceOf(PersistenceError);
    expect(adjust).toHaveBeenCalledTimes(condition === "商品不存在" ? 0 : 1);
    expect(notify).not.toHaveBeenCalled();
  });
});

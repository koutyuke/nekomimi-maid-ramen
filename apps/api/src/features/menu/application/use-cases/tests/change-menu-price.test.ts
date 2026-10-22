import { Effect, Either, Layer } from "effect";
import { describe, expect, it, vi } from "vitest";

import { Price } from "../../../../../core/domain/money";
import { MenuPriceChange } from "../../../domain/menu-item";
import { menuItemFixture } from "../../../testing";
import { MenuItemRepository } from "../../ports/outbound/menu-item.repository";
import { MenuUpdatesGateway } from "../../ports/outbound/menu-updates.gateway";
import { changeMenuPrice } from "../change-menu-price";

const item = menuItemFixture({ id: "ramen", name: "ラーメン", price: 600, displayOrder: 1 });
const price = Price.make(650);
const priceChange = (changed: boolean) =>
  new MenuPriceChange({ menuItemId: item.id, price, updatedAt: new Date("2026-10-31T09:00:00Z"), changed });

const run = (
  role: "Owner" | "Admin" | "Staff" | "None",
  changePrice: (typeof MenuItemRepository.Service)["changePrice"],
  notify: () => Effect.Effect<void>,
) =>
  Effect.runPromise(
    changeMenuPrice({ id: "admin", role }, item.id, price).pipe(
      Effect.either,
      Effect.provide(
        Layer.mergeAll(
          Layer.succeed(MenuItemRepository, {
            findMany: () => Effect.die("Unexpected menu listing"),
            getRevision: () => Effect.die("Unexpected revision lookup"),
            changePrice,
          }),
          Layer.succeed(MenuUpdatesGateway, { notify }),
        ),
      ),
    ),
  );

describe("SPEC-SAL-007 価格変更の成立条件と通知", () => {
  it.each(["Owner", "Admin"] as const)("%sが価格を変えると、保存後に一度だけ通知する", async (role) => {
    let saved = false;
    const changePrice = vi.fn(() =>
      Effect.sync(() => {
        saved = true;
        return priceChange(true);
      }),
    );
    const notify = vi.fn(() => Effect.sync(() => expect(saved).toBe(true)));

    const result = await run(role, changePrice, notify);

    expect(result).toEqual(Either.right(priceChange(true)));
    expect(changePrice).toHaveBeenCalledExactlyOnceWith("admin", item.id, price);
    expect(notify).toHaveBeenCalledOnce();
  });

  it("現在と同じ価格への変更は成功として返し、通知しない", async () => {
    const notify = vi.fn(() => Effect.void);

    const result = await run("Admin", () => Effect.succeed(priceChange(false)), notify);

    expect(result).toEqual(Either.right(priceChange(false)));
    expect(notify).not.toHaveBeenCalled();
  });

  it.each(["Staff", "None"] as const)("HTTPを通さない%sの呼び出しでも保存・通知を拒否する", async (role) => {
    const changePrice = vi.fn(() => Effect.succeed(priceChange(true)));
    const notify = vi.fn(() => Effect.void);

    const result = await run(role, changePrice, notify);

    expect(result).toMatchObject({ _tag: "Left", left: { _tag: "MenuPriceChangeForbidden" } });
    expect(changePrice).not.toHaveBeenCalled();
    expect(notify).not.toHaveBeenCalled();
  });
});

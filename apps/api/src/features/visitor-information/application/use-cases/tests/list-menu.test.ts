import { Effect, Layer } from "effect";
import { describe, expect, it } from "vitest";

import { menuItemAvailabilityMock, menuItemCatalogMock, menuItemFixture } from "../../../testing";
import { listMenu } from "../list-menu";
import type { MenuItem } from "../../../domain/menu-item";
import type { MenuItemSellability } from "../../ports/outbound/menu-item-availability";

const ramen = menuItemFixture({ id: "item-ramen", name: "ラーメン", price: 500, displayOrder: 1 });
const gyoza = menuItemFixture({
  id: "item-gyoza",
  name: "餃子",
  price: 400,
  displayOrder: 2,
  category: "side",
});

const run = (menuItems: ReadonlyArray<MenuItem>, sellability: ReadonlyArray<MenuItemSellability>) =>
  Effect.runPromise(
    listMenu().pipe(
      Effect.provide(Layer.mergeAll(menuItemCatalogMock(menuItems), menuItemAvailabilityMock(sellability))),
    ),
  );

const sellableById = (entries: Awaited<ReturnType<typeof run>>) =>
  Object.fromEntries(entries.map((entry) => [entry.menuItem.id, entry.sellable]));

describe("SPEC-INV-001 在庫に基づく販売可否", () => {
  it("在庫が残っている商品を販売可能とする", async () => {
    const entries = await run([ramen], [{ menuItemId: ramen.id, sellable: true }]);

    expect(sellableById(entries)).toEqual({ "item-ramen": true });
  });

  it("在庫が0の商品を販売可能としない", async () => {
    const entries = await run([ramen], [{ menuItemId: ramen.id, sellable: false }]);

    expect(sellableById(entries)).toEqual({ "item-ramen": false });
  });

  it("在庫の記録がない商品を販売可能としない", async () => {
    const entries = await run([ramen, gyoza], [{ menuItemId: ramen.id, sellable: true }]);

    expect(sellableById(entries)).toEqual({ "item-ramen": true, "item-gyoza": false });
  });

  it("在庫のない商品もメニューから消さない", async () => {
    const entries = await run(
      [ramen, gyoza],
      [
        { menuItemId: ramen.id, sellable: false },
        { menuItemId: gyoza.id, sellable: false },
      ],
    );

    expect(entries.map((entry) => entry.menuItem.name)).toEqual(["ラーメン", "餃子"]);
  });
});

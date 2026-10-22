import { Effect } from "effect";
import { describe, expect, it } from "vitest";

import { menuItemFixture, menuItemRepositoryMock, stockFixture } from "../../../testing";
import { listStaffMenu } from "../list-staff-menu";
import type { MenuItem } from "../../../domain/menu-item";
import type { Stock } from "../../../domain/stock";

const ramen = menuItemFixture({ id: "item-ramen", name: "ラーメン", price: 500, displayOrder: 1 });
const gyoza = menuItemFixture({
  id: "item-gyoza",
  name: "餃子",
  price: 400,
  displayOrder: 2,
  category: "side",
});

const run = (menuItems: ReadonlyArray<MenuItem>, stocks: ReadonlyArray<Stock>) =>
  Effect.runPromise(listStaffMenu().pipe(Effect.provide(menuItemRepositoryMock(menuItems, stocks))));

const inventoryById = (menu: Awaited<ReturnType<typeof run>>) =>
  Object.fromEntries(menu.data.map((entry) => [entry.menuItem.id, [entry.quantity, entry.sellable]]));

describe("SPEC-INV-001 在庫に基づく販売可否", () => {
  it("在庫が残っている商品を、残数とともに販売可能とする", async () => {
    const menu = await run([ramen], [stockFixture(ramen.id, 1)]);

    expect(inventoryById(menu)).toEqual({ "item-ramen": [1, true] });
  });

  it("在庫が0の商品を販売可能としない", async () => {
    const menu = await run([ramen], [stockFixture(ramen.id, 0)]);

    expect(inventoryById(menu)).toEqual({ "item-ramen": [0, false] });
  });

  it("在庫の記録がない商品を販売可能としない", async () => {
    const menu = await run([ramen, gyoza], [stockFixture(ramen.id, 1)]);

    expect(inventoryById(menu)).toEqual({ "item-ramen": [1, true], "item-gyoza": [0, false] });
  });

  it("在庫のない商品もメニューから消さない", async () => {
    const menu = await run([ramen, gyoza], []);

    expect(menu.data.map((entry) => entry.menuItem.name)).toEqual(["ラーメン", "餃子"]);
  });
});

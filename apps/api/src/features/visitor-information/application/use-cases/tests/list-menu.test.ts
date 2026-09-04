import { Effect, Layer } from "effect";
import { describe, expect, it } from "vitest";

import { stockFixture, stockRepositoryMock } from "../../../../inventory/testing";
import { menuItemFixture, menuItemRepositoryMock } from "../../../testing";
import { listMenu } from "../list-menu";
import type { Stock } from "../../../../inventory";
import type { MenuItem } from "../../../domain/menu-item";

const ramen = menuItemFixture({ id: "item-ramen", name: "ラーメン", price: 500, displayOrder: 1 });
const gyoza = menuItemFixture({
  id: "item-gyoza",
  name: "餃子",
  price: 400,
  displayOrder: 2,
  category: "side",
});

const run = (menuItems: ReadonlyArray<MenuItem>, stocks: ReadonlyArray<Stock>) =>
  Effect.runPromise(
    listMenu().pipe(Effect.provide(Layer.mergeAll(menuItemRepositoryMock(menuItems), stockRepositoryMock(stocks)))),
  );

const sellableById = (entries: Awaited<ReturnType<typeof run>>) =>
  Object.fromEntries(entries.map((entry) => [entry.menuItem.id, entry.sellable]));

describe("SPEC-INV-001 在庫に基づく販売可否", () => {
  it("在庫が残っている商品を販売可能とする", async () => {
    const entries = await run([ramen], [stockFixture("item-ramen", 1)]);

    expect(sellableById(entries)).toEqual({ "item-ramen": true });
  });

  it("在庫が0の商品を販売可能としない", async () => {
    const entries = await run([ramen], [stockFixture("item-ramen", 0)]);

    expect(sellableById(entries)).toEqual({ "item-ramen": false });
  });

  it("在庫の記録がない商品を販売可能としない", async () => {
    const entries = await run([ramen, gyoza], [stockFixture("item-ramen", 3)]);

    expect(sellableById(entries)).toEqual({ "item-ramen": true, "item-gyoza": false });
  });

  it("在庫のない商品もメニューから消さない", async () => {
    const entries = await run([ramen, gyoza], [stockFixture("item-ramen", 0), stockFixture("item-gyoza", 0)]);

    expect(entries.map((entry) => entry.menuItem.name)).toEqual(["ラーメン", "餃子"]);
  });
});

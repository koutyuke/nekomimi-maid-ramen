import { env } from "cloudflare:test";
import { drizzle } from "drizzle-orm/d1";
import { Effect, Layer } from "effect";
import { beforeEach, describe, expect, it } from "vitest";

import { databaseLayer } from "../../../../../core/infra/drizzle/database";
import { allergens, menuItemAllergens, menuItems } from "../../../../../core/infra/drizzle/schema";
import { MenuItemRepository } from "../../../application/ports/menu-item.repository";
import { MenuItemRepositoryLive } from "../menu-item.repository.live";
import type { MenuCategory } from "../../../domain/menu-item";

const db = drizzle(env.DB);

const listInDisplayOrder = () =>
  Effect.runPromise(
    Effect.gen(function* () {
      const repository = yield* MenuItemRepository;
      return yield* repository.listInDisplayOrder();
    }).pipe(Effect.provide(MenuItemRepositoryLive.pipe(Layer.provide(databaseLayer(env.DB))))),
  );

const menuItemRow = (args: {
  id: string;
  name: string;
  price: number;
  displayOrder: number;
  category: MenuCategory;
}) => ({
  ...args,
  description: null,
  allergenCheckState: "unchecked" as const,
  updatedAt: new Date(),
});

beforeEach(async () => {
  await db.delete(menuItemAllergens);
  await db.delete(allergens);
  await db.delete(menuItems);
});

describe("SPEC-VIS-002 商品と特定原材料の読み出し", () => {
  it("複数の品目を持つ商品を1件にまとめる", async () => {
    await db
      .insert(menuItems)
      .values(menuItemRow({ id: "item-gyoza", name: "餃子", price: 400, displayOrder: 2, category: "side" }));
    await db.insert(allergens).values([
      { id: "allergen-wheat", name: "小麦" },
      { id: "allergen-egg", name: "卵" },
    ]);
    await db.insert(menuItemAllergens).values([
      { menuItemId: "item-gyoza", allergenId: "allergen-wheat" },
      { menuItemId: "item-gyoza", allergenId: "allergen-egg" },
    ]);

    const items = await listInDisplayOrder();

    expect(items).toHaveLength(1);
    expect(items[0]?.containedAllergens.map((allergen) => allergen.name).toSorted()).toEqual(["卵", "小麦"]);
  });

  it("品目を持たない商品を欠落させない", async () => {
    await db
      .insert(menuItems)
      .values([
        menuItemRow({ id: "item-ramen", name: "ラーメン", price: 500, displayOrder: 1, category: "main" }),
        menuItemRow({ id: "item-cola", name: "コーラ", price: 300, displayOrder: 3, category: "drink" }),
      ]);

    const items = await listInDisplayOrder();

    expect(items.map((item) => item.name)).toEqual(["ラーメン", "コーラ"]);
    expect(items.map((item) => item.containedAllergens.length)).toEqual([0, 0]);
  });

  it("表示順で並べて返す", async () => {
    await db
      .insert(menuItems)
      .values([
        menuItemRow({ id: "item-cola", name: "コーラ", price: 300, displayOrder: 3, category: "drink" }),
        menuItemRow({ id: "item-ramen", name: "ラーメン", price: 500, displayOrder: 1, category: "main" }),
      ]);

    const items = await listInDisplayOrder();

    expect(items.map((item) => item.name)).toEqual(["ラーメン", "コーラ"]);
  });
});

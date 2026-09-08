-- メニューの6商品、特定原材料の9品目、初期在庫を投入する。
-- 商品・分類・価格・表示順の正本は docs/product/menu.md である。
-- 何度実行しても行は重複せず、投入後に更新された説明文・原材料の確認状態・在庫数は上書きしない。
INSERT INTO allergens (id, name) VALUES
  ('allergen-shrimp', 'えび'),
  ('allergen-crab', 'かに'),
  ('allergen-cashew-nut', 'カシューナッツ'),
  ('allergen-walnut', 'くるみ'),
  ('allergen-wheat', '小麦'),
  ('allergen-buckwheat', 'そば'),
  ('allergen-egg', '卵'),
  ('allergen-milk', '乳'),
  ('allergen-peanut', '落花生')
ON CONFLICT (id) DO UPDATE SET name = excluded.name;

INSERT INTO menu_items (id, name, description, price, category, display_order, allergen_check_state, updated_at) VALUES
  ('item-ramen', 'ラーメン', NULL, 500, 'main', 1, 'unchecked', unixepoch() * 1000),
  ('item-gyoza', '餃子', NULL, 400, 'side', 2, 'unchecked', unixepoch() * 1000),
  ('item-cola', 'コーラ', NULL, 300, 'drink', 3, 'unchecked', unixepoch() * 1000),
  ('item-orange-juice', 'オレンジジュース', NULL, 300, 'drink', 4, 'unchecked', unixepoch() * 1000),
  ('item-ginger-ale', 'ジンジャーエール', NULL, 300, 'drink', 5, 'unchecked', unixepoch() * 1000),
  ('item-oolong-tea', '烏龍茶', NULL, 300, 'drink', 6, 'unchecked', unixepoch() * 1000)
ON CONFLICT (id) DO UPDATE SET
  name = excluded.name,
  price = excluded.price,
  category = excluded.category,
  display_order = excluded.display_order,
  updated_at = excluded.updated_at;

-- 販売開始時は全商品を販売可能にする。実際の用意数は開店前に数え直して上書きする。
INSERT INTO stocks (menu_item_id, quantity, updated_at) VALUES
  ('item-ramen', 100, unixepoch() * 1000),
  ('item-gyoza', 100, unixepoch() * 1000),
  ('item-cola', 100, unixepoch() * 1000),
  ('item-orange-juice', 100, unixepoch() * 1000),
  ('item-ginger-ale', 100, unixepoch() * 1000),
  ('item-oolong-tea', 100, unixepoch() * 1000)
ON CONFLICT (menu_item_id) DO NOTHING;

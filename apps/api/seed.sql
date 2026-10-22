-- メニューの7商品と初期在庫を投入する。
-- 商品・分類・価格・表示順の正本は docs/product/menu.md である。
-- 何度実行しても行は重複せず、投入後に更新された在庫数は上書きしない。
INSERT INTO menu_items (id, name, price, category, display_order, updated_at) VALUES
  ('item-ramen', 'ラーメン', 600, 'main', 1, unixepoch() * 1000),
  ('item-gyoza', '餃子', 300, 'side', 2, unixepoch() * 1000),
  ('item-soda', 'サイダー', 300, 'drink', 3, unixepoch() * 1000),
  ('item-cola', 'コーラ', 300, 'drink', 4, unixepoch() * 1000),
  ('item-orange-juice', 'オレンジジュース', 300, 'drink', 5, unixepoch() * 1000),
  ('item-ginger-ale', 'ジンジャーエール', 300, 'drink', 6, unixepoch() * 1000),
  ('item-oolong-tea', '烏龍茶', 300, 'drink', 7, unixepoch() * 1000)
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
  ('item-soda', 100, unixepoch() * 1000),
  ('item-cola', 100, unixepoch() * 1000),
  ('item-orange-juice', 100, unixepoch() * 1000),
  ('item-ginger-ale', 100, unixepoch() * 1000),
  ('item-oolong-tea', 100, unixepoch() * 1000)
ON CONFLICT (menu_item_id) DO NOTHING;

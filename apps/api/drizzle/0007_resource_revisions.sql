CREATE TABLE `resource_revisions` (
	`scope` text PRIMARY KEY NOT NULL,
	`revision` integer DEFAULT 0 NOT NULL,
	CONSTRAINT "resource_revisions_scope" CHECK("resource_revisions"."scope" in ('menu', 'orders')),
	CONSTRAINT "resource_revisions_non_negative" CHECK("resource_revisions"."revision" >= 0)
);
--> statement-breakpoint
-- 適用済みの更新番号を保ち、表示中の端末が古い番号へ戻らないようにする。
INSERT INTO resource_revisions (scope, revision)
SELECT 'menu', menu FROM sync_versions WHERE id = 1
UNION ALL SELECT 'orders', orders FROM sync_versions WHERE id = 1;
--> statement-breakpoint
DROP TRIGGER stocks_sync_insert;
--> statement-breakpoint
DROP TRIGGER stocks_sync_update;
--> statement-breakpoint
DROP TRIGGER stocks_sync_delete;
--> statement-breakpoint
DROP TRIGGER menu_items_sync_insert;
--> statement-breakpoint
DROP TRIGGER menu_items_sync_update;
--> statement-breakpoint
DROP TRIGGER menu_items_sync_delete;
--> statement-breakpoint
DROP TRIGGER allergens_sync_insert;
--> statement-breakpoint
DROP TRIGGER allergens_sync_update;
--> statement-breakpoint
DROP TRIGGER allergens_sync_delete;
--> statement-breakpoint
DROP TRIGGER menu_item_allergens_sync_insert;
--> statement-breakpoint
DROP TRIGGER menu_item_allergens_sync_update;
--> statement-breakpoint
DROP TRIGGER menu_item_allergens_sync_delete;
--> statement-breakpoint
DROP TRIGGER orders_sync_insert;
--> statement-breakpoint
DROP TRIGGER orders_sync_update;
--> statement-breakpoint
DROP TRIGGER orders_sync_delete;
--> statement-breakpoint
DROP TRIGGER order_lines_sync_insert;
--> statement-breakpoint
DROP TRIGGER order_lines_sync_update;
--> statement-breakpoint
DROP TRIGGER order_lines_sync_delete;
--> statement-breakpoint
DROP TABLE sync_versions;
--> statement-breakpoint
CREATE TRIGGER stocks_revision_insert
AFTER INSERT ON stocks
BEGIN
  UPDATE resource_revisions SET revision = revision + 1 WHERE scope = 'menu';
END;
--> statement-breakpoint
CREATE TRIGGER stocks_revision_update
AFTER UPDATE OF quantity ON stocks
WHEN OLD.quantity IS NOT NEW.quantity
BEGIN
  UPDATE resource_revisions SET revision = revision + 1 WHERE scope = 'menu';
END;
--> statement-breakpoint
CREATE TRIGGER stocks_revision_delete
AFTER DELETE ON stocks
BEGIN
  UPDATE resource_revisions SET revision = revision + 1 WHERE scope = 'menu';
END;
--> statement-breakpoint
CREATE TRIGGER menu_items_revision_insert
AFTER INSERT ON menu_items
BEGIN
  UPDATE resource_revisions SET revision = revision + 1 WHERE scope = 'menu';
END;
--> statement-breakpoint
CREATE TRIGGER menu_items_revision_update
AFTER UPDATE OF name, description, price, category, display_order, allergen_check_state ON menu_items
WHEN OLD.name IS NOT NEW.name OR OLD.description IS NOT NEW.description OR OLD.price IS NOT NEW.price OR OLD.category IS NOT NEW.category OR OLD.display_order IS NOT NEW.display_order OR OLD.allergen_check_state IS NOT NEW.allergen_check_state
BEGIN
  UPDATE resource_revisions SET revision = revision + 1 WHERE scope = 'menu';
  UPDATE resource_revisions SET revision = revision + 1 WHERE scope = 'orders'
    AND (OLD.name IS NOT NEW.name OR OLD.category IS NOT NEW.category OR OLD.display_order IS NOT NEW.display_order);
END;
--> statement-breakpoint
CREATE TRIGGER menu_items_revision_delete
AFTER DELETE ON menu_items
BEGIN
  UPDATE resource_revisions SET revision = revision + 1 WHERE scope = 'menu';
END;
--> statement-breakpoint
CREATE TRIGGER allergens_revision_insert
AFTER INSERT ON allergens
BEGIN
  UPDATE resource_revisions SET revision = revision + 1 WHERE scope = 'menu';
END;
--> statement-breakpoint
CREATE TRIGGER allergens_revision_update
AFTER UPDATE OF name ON allergens
WHEN OLD.name IS NOT NEW.name
BEGIN
  UPDATE resource_revisions SET revision = revision + 1 WHERE scope = 'menu';
END;
--> statement-breakpoint
CREATE TRIGGER allergens_revision_delete
AFTER DELETE ON allergens
BEGIN
  UPDATE resource_revisions SET revision = revision + 1 WHERE scope = 'menu';
END;
--> statement-breakpoint
CREATE TRIGGER menu_item_allergens_revision_insert
AFTER INSERT ON menu_item_allergens
BEGIN
  UPDATE resource_revisions SET revision = revision + 1 WHERE scope = 'menu';
END;
--> statement-breakpoint
CREATE TRIGGER menu_item_allergens_revision_update
AFTER UPDATE OF menu_item_id, allergen_id ON menu_item_allergens
WHEN OLD.menu_item_id IS NOT NEW.menu_item_id OR OLD.allergen_id IS NOT NEW.allergen_id
BEGIN
  UPDATE resource_revisions SET revision = revision + 1 WHERE scope = 'menu';
END;
--> statement-breakpoint
CREATE TRIGGER menu_item_allergens_revision_delete
AFTER DELETE ON menu_item_allergens
BEGIN
  UPDATE resource_revisions SET revision = revision + 1 WHERE scope = 'menu';
END;
--> statement-breakpoint
CREATE TRIGGER orders_revision_insert
AFTER INSERT ON orders
BEGIN
  UPDATE resource_revisions SET revision = revision + 1 WHERE scope = 'orders';
END;
--> statement-breakpoint
CREATE TRIGGER orders_revision_update
AFTER UPDATE OF business_date, order_number, cancelled_at, handed_off_at ON orders
WHEN OLD.business_date IS NOT NEW.business_date OR OLD.order_number IS NOT NEW.order_number OR OLD.cancelled_at IS NOT NEW.cancelled_at OR OLD.handed_off_at IS NOT NEW.handed_off_at
BEGIN
  UPDATE resource_revisions SET revision = revision + 1 WHERE scope = 'orders';
END;
--> statement-breakpoint
CREATE TRIGGER orders_revision_delete
AFTER DELETE ON orders
BEGIN
  UPDATE resource_revisions SET revision = revision + 1 WHERE scope = 'orders';
END;
--> statement-breakpoint
CREATE TRIGGER order_lines_revision_insert
AFTER INSERT ON order_lines
BEGIN
  UPDATE resource_revisions SET revision = revision + 1 WHERE scope = 'orders';
END;
--> statement-breakpoint
CREATE TRIGGER order_lines_revision_update
AFTER UPDATE OF quantity, cooking_state, menu_item_id ON order_lines
WHEN OLD.quantity IS NOT NEW.quantity OR OLD.cooking_state IS NOT NEW.cooking_state OR OLD.menu_item_id IS NOT NEW.menu_item_id
BEGIN
  UPDATE resource_revisions SET revision = revision + 1 WHERE scope = 'orders';
END;
--> statement-breakpoint
CREATE TRIGGER order_lines_revision_delete
AFTER DELETE ON order_lines
BEGIN
  UPDATE resource_revisions SET revision = revision + 1 WHERE scope = 'orders';
END;

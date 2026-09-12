CREATE TABLE `sync_versions` (
	`id` integer PRIMARY KEY NOT NULL,
	`menu` integer DEFAULT 0 NOT NULL,
	`orders` integer DEFAULT 0 NOT NULL,
	CONSTRAINT "sync_versions_singleton" CHECK("sync_versions"."id" = 1)
);

--> statement-breakpoint
INSERT INTO sync_versions (id, menu, orders) VALUES (1, 0, 0);
--> statement-breakpoint
CREATE TRIGGER stocks_sync_insert
AFTER INSERT ON stocks
BEGIN
  UPDATE sync_versions SET menu = menu + 1 WHERE id = 1;
END;
--> statement-breakpoint
CREATE TRIGGER stocks_sync_update
AFTER UPDATE OF quantity ON stocks
WHEN OLD.quantity IS NOT NEW.quantity
BEGIN
  UPDATE sync_versions SET menu = menu + 1 WHERE id = 1;
END;
--> statement-breakpoint
CREATE TRIGGER stocks_sync_delete
AFTER DELETE ON stocks
BEGIN
  UPDATE sync_versions SET menu = menu + 1 WHERE id = 1;
END;
--> statement-breakpoint
CREATE TRIGGER menu_items_sync_insert
AFTER INSERT ON menu_items
BEGIN
  UPDATE sync_versions SET menu = menu + 1 WHERE id = 1;
END;
--> statement-breakpoint
CREATE TRIGGER menu_items_sync_update
AFTER UPDATE OF name, description, price, category, display_order, allergen_check_state ON menu_items
WHEN OLD.name IS NOT NEW.name OR OLD.description IS NOT NEW.description OR OLD.price IS NOT NEW.price OR OLD.category IS NOT NEW.category OR OLD.display_order IS NOT NEW.display_order OR OLD.allergen_check_state IS NOT NEW.allergen_check_state
BEGIN
  UPDATE sync_versions SET menu = menu + 1 WHERE id = 1;
  UPDATE sync_versions SET orders = orders + 1 WHERE id = 1
    AND (OLD.name IS NOT NEW.name OR OLD.category IS NOT NEW.category OR OLD.display_order IS NOT NEW.display_order);
END;
--> statement-breakpoint
CREATE TRIGGER menu_items_sync_delete
AFTER DELETE ON menu_items
BEGIN
  UPDATE sync_versions SET menu = menu + 1 WHERE id = 1;
END;
--> statement-breakpoint
CREATE TRIGGER allergens_sync_insert
AFTER INSERT ON allergens
BEGIN
  UPDATE sync_versions SET menu = menu + 1 WHERE id = 1;
END;
--> statement-breakpoint
CREATE TRIGGER allergens_sync_update
AFTER UPDATE OF name ON allergens
WHEN OLD.name IS NOT NEW.name
BEGIN
  UPDATE sync_versions SET menu = menu + 1 WHERE id = 1;
END;
--> statement-breakpoint
CREATE TRIGGER allergens_sync_delete
AFTER DELETE ON allergens
BEGIN
  UPDATE sync_versions SET menu = menu + 1 WHERE id = 1;
END;
--> statement-breakpoint
CREATE TRIGGER menu_item_allergens_sync_insert
AFTER INSERT ON menu_item_allergens
BEGIN
  UPDATE sync_versions SET menu = menu + 1 WHERE id = 1;
END;
--> statement-breakpoint
CREATE TRIGGER menu_item_allergens_sync_update
AFTER UPDATE OF menu_item_id, allergen_id ON menu_item_allergens
WHEN OLD.menu_item_id IS NOT NEW.menu_item_id OR OLD.allergen_id IS NOT NEW.allergen_id
BEGIN
  UPDATE sync_versions SET menu = menu + 1 WHERE id = 1;
END;
--> statement-breakpoint
CREATE TRIGGER menu_item_allergens_sync_delete
AFTER DELETE ON menu_item_allergens
BEGIN
  UPDATE sync_versions SET menu = menu + 1 WHERE id = 1;
END;
--> statement-breakpoint
CREATE TRIGGER orders_sync_insert
AFTER INSERT ON orders
BEGIN
  UPDATE sync_versions SET orders = orders + 1 WHERE id = 1;
END;
--> statement-breakpoint
CREATE TRIGGER orders_sync_update
AFTER UPDATE OF business_date, order_number, cancelled_at, handed_off_at ON orders
WHEN OLD.business_date IS NOT NEW.business_date OR OLD.order_number IS NOT NEW.order_number OR OLD.cancelled_at IS NOT NEW.cancelled_at OR OLD.handed_off_at IS NOT NEW.handed_off_at
BEGIN
  UPDATE sync_versions SET orders = orders + 1 WHERE id = 1;
END;
--> statement-breakpoint
CREATE TRIGGER orders_sync_delete
AFTER DELETE ON orders
BEGIN
  UPDATE sync_versions SET orders = orders + 1 WHERE id = 1;
END;
--> statement-breakpoint
CREATE TRIGGER order_lines_sync_insert
AFTER INSERT ON order_lines
BEGIN
  UPDATE sync_versions SET orders = orders + 1 WHERE id = 1;
END;
--> statement-breakpoint
CREATE TRIGGER order_lines_sync_update
AFTER UPDATE OF quantity, cooking_state, menu_item_id ON order_lines
WHEN OLD.quantity IS NOT NEW.quantity OR OLD.cooking_state IS NOT NEW.cooking_state OR OLD.menu_item_id IS NOT NEW.menu_item_id
BEGIN
  UPDATE sync_versions SET orders = orders + 1 WHERE id = 1;
END;
--> statement-breakpoint
CREATE TRIGGER order_lines_sync_delete
AFTER DELETE ON order_lines
BEGIN
  UPDATE sync_versions SET orders = orders + 1 WHERE id = 1;
END;

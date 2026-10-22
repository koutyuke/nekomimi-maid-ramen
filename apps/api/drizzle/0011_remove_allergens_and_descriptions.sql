DROP TABLE `menu_item_allergens`;--> statement-breakpoint
DROP TABLE `allergens`;--> statement-breakpoint
-- D1では外部キーを無効にできないため、商品を再作成する前に参照元を退避する。
-- 退避した行の書き戻しでリビジョンが進まないよう、トリガーは書き戻した後に作り直す。
CREATE TABLE `__new_menu_items` (
	`id` text PRIMARY KEY NOT NULL,
	`name` text NOT NULL,
	`price` integer NOT NULL,
	`category` text NOT NULL,
	`display_order` integer NOT NULL,
	`updated_at` integer NOT NULL,
	CONSTRAINT "menu_items_category" CHECK("__new_menu_items"."category" in ('main', 'side', 'drink'))
);
--> statement-breakpoint
INSERT INTO `__new_menu_items`("id", "name", "price", "category", "display_order", "updated_at") SELECT "id", "name", "price", "category", "display_order", "updated_at" FROM `menu_items`;--> statement-breakpoint
CREATE TABLE `__old_stocks` AS SELECT * FROM `stocks`;--> statement-breakpoint
CREATE TABLE `__old_stock_adjustments` AS SELECT * FROM `stock_adjustments`;--> statement-breakpoint
CREATE TABLE `__old_order_lines` AS SELECT * FROM `order_lines`;--> statement-breakpoint
DROP TABLE `stocks`;--> statement-breakpoint
DROP TABLE `stock_adjustments`;--> statement-breakpoint
DROP TABLE `order_lines`;--> statement-breakpoint
DROP TABLE `menu_items`;--> statement-breakpoint
ALTER TABLE `__new_menu_items` RENAME TO `menu_items`;--> statement-breakpoint
CREATE TABLE `stocks` (
	`menu_item_id` text PRIMARY KEY NOT NULL,
	`quantity` integer NOT NULL,
	`updated_at` integer NOT NULL,
	FOREIGN KEY (`menu_item_id`) REFERENCES `menu_items`(`id`) ON UPDATE no action ON DELETE cascade,
	CONSTRAINT "stocks_quantity_non_negative" CHECK("stocks"."quantity" >= 0)
);--> statement-breakpoint
INSERT INTO `stocks` SELECT * FROM `__old_stocks`;--> statement-breakpoint
DROP TABLE `__old_stocks`;--> statement-breakpoint
CREATE TABLE `stock_adjustments` (
	`id` text PRIMARY KEY NOT NULL,
	`menu_item_id` text NOT NULL,
	`previous_quantity` integer NOT NULL,
	`quantity` integer NOT NULL,
	`adjusted_by` text NOT NULL,
	`adjusted_at` integer NOT NULL,
	FOREIGN KEY (`menu_item_id`) REFERENCES `menu_items`(`id`) ON UPDATE no action ON DELETE cascade,
	CONSTRAINT "stock_adjustments_previous_quantity_non_negative" CHECK("stock_adjustments"."previous_quantity" >= 0),
	CONSTRAINT "stock_adjustments_quantity_non_negative" CHECK("stock_adjustments"."quantity" >= 0)
);--> statement-breakpoint
CREATE INDEX `stock_adjustments_menu_item_adjusted_at` ON `stock_adjustments` (`menu_item_id`,`adjusted_at`);--> statement-breakpoint
INSERT INTO `stock_adjustments` SELECT * FROM `__old_stock_adjustments`;--> statement-breakpoint
DROP TABLE `__old_stock_adjustments`;--> statement-breakpoint
CREATE TABLE `order_lines` (
	`order_id` text NOT NULL,
	`menu_item_id` text NOT NULL,
	`quantity` integer NOT NULL,
	`unit_price` integer NOT NULL,
	`cooking_state` text DEFAULT 'unstarted' NOT NULL,
	PRIMARY KEY(`order_id`, `menu_item_id`),
	FOREIGN KEY (`order_id`) REFERENCES `orders`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`menu_item_id`) REFERENCES `menu_items`(`id`) ON UPDATE no action ON DELETE no action,
	CONSTRAINT "order_lines_quantity_range" CHECK("order_lines"."quantity" between 1 and 10),
	CONSTRAINT "order_lines_cooking_state" CHECK("order_lines"."cooking_state" in ('unstarted', 'cooking', 'completed'))
);--> statement-breakpoint
INSERT INTO `order_lines` SELECT * FROM `__old_order_lines`;--> statement-breakpoint
DROP TABLE `__old_order_lines`;--> statement-breakpoint
CREATE TRIGGER menu_items_revision_insert
AFTER INSERT ON menu_items
BEGIN
  UPDATE resource_revisions SET revision = revision + 1 WHERE scope = 'menu';
END;
--> statement-breakpoint
CREATE TRIGGER menu_items_revision_update
AFTER UPDATE OF name, price, category, display_order ON menu_items
WHEN OLD.name IS NOT NEW.name OR OLD.price IS NOT NEW.price OR OLD.category IS NOT NEW.category OR OLD.display_order IS NOT NEW.display_order
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

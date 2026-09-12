CREATE TABLE `__new_menu_items` (
	`id` text PRIMARY KEY NOT NULL,
	`name` text NOT NULL,
	`description` text,
	`price` integer NOT NULL,
	`category` text NOT NULL,
	`display_order` integer NOT NULL,
	`allergen_check_state` text NOT NULL,
	`updated_at` integer NOT NULL,
	CONSTRAINT "menu_items_category" CHECK("__new_menu_items"."category" in ('main', 'side', 'drink')),
	CONSTRAINT "menu_items_allergen_check_state" CHECK("__new_menu_items"."allergen_check_state" in ('unchecked', 'checked'))
);
--> statement-breakpoint
INSERT INTO `__new_menu_items`("id", "name", "description", "price", "category", "display_order", "allergen_check_state", "updated_at") SELECT "id", "name", "description", "price", "category", "display_order", "allergen_check_state", "updated_at" FROM `menu_items`;--> statement-breakpoint
CREATE TABLE `__old_menu_item_allergens` AS SELECT * FROM `menu_item_allergens`;--> statement-breakpoint
CREATE TABLE `__old_stocks` AS SELECT * FROM `stocks`;--> statement-breakpoint
CREATE TABLE `__old_order_lines` AS SELECT * FROM `order_lines`;--> statement-breakpoint
DROP TABLE `menu_item_allergens`;--> statement-breakpoint
DROP TABLE `stocks`;--> statement-breakpoint
DROP TABLE `order_lines`;--> statement-breakpoint
DROP TABLE `menu_items`;--> statement-breakpoint
ALTER TABLE `__new_menu_items` RENAME TO `menu_items`;--> statement-breakpoint
CREATE TABLE `menu_item_allergens` (
	`menu_item_id` text NOT NULL,
	`allergen_id` text NOT NULL,
	PRIMARY KEY(`menu_item_id`, `allergen_id`),
	FOREIGN KEY (`menu_item_id`) REFERENCES `menu_items`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`allergen_id`) REFERENCES `allergens`(`id`) ON UPDATE no action ON DELETE cascade
);--> statement-breakpoint
INSERT INTO `menu_item_allergens` SELECT * FROM `__old_menu_item_allergens`;--> statement-breakpoint
DROP TABLE `__old_menu_item_allergens`;--> statement-breakpoint
CREATE TABLE `stocks` (
	`menu_item_id` text PRIMARY KEY NOT NULL,
	`quantity` integer NOT NULL,
	`updated_at` integer NOT NULL,
	FOREIGN KEY (`menu_item_id`) REFERENCES `menu_items`(`id`) ON UPDATE no action ON DELETE cascade,
	CONSTRAINT "stocks_quantity_non_negative" CHECK("stocks"."quantity" >= 0)
);--> statement-breakpoint
INSERT INTO `stocks` SELECT * FROM `__old_stocks`;--> statement-breakpoint
DROP TABLE `__old_stocks`;--> statement-breakpoint
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
DROP TABLE `__old_order_lines`;

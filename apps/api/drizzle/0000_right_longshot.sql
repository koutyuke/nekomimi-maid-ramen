CREATE TABLE `allergens` (
	`id` text PRIMARY KEY NOT NULL,
	`name` text NOT NULL
);
--> statement-breakpoint
CREATE UNIQUE INDEX `allergens_name_unique` ON `allergens` (`name`);--> statement-breakpoint
CREATE TABLE `menu_item_allergens` (
	`menu_item_id` text NOT NULL,
	`allergen_id` text NOT NULL,
	PRIMARY KEY(`menu_item_id`, `allergen_id`),
	FOREIGN KEY (`menu_item_id`) REFERENCES `menu_items`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`allergen_id`) REFERENCES `allergens`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE TABLE `menu_items` (
	`id` text PRIMARY KEY NOT NULL,
	`name` text NOT NULL,
	`description` text,
	`price` integer NOT NULL,
	`category` text NOT NULL,
	`display_order` integer NOT NULL,
	`allergen_check_state` text NOT NULL,
	`updated_at` integer NOT NULL
);
--> statement-breakpoint
CREATE TABLE `stocks` (
	`menu_item_id` text PRIMARY KEY NOT NULL,
	`quantity` integer NOT NULL,
	`updated_at` integer NOT NULL,
	FOREIGN KEY (`menu_item_id`) REFERENCES `menu_items`(`id`) ON UPDATE no action ON DELETE cascade,
	CONSTRAINT "stocks_quantity_non_negative" CHECK("stocks"."quantity" >= 0)
);

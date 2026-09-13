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
);
--> statement-breakpoint
CREATE INDEX `stock_adjustments_menu_item_adjusted_at` ON `stock_adjustments` (`menu_item_id`,`adjusted_at`);
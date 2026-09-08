CREATE TABLE `order_lines` (
	`order_id` text NOT NULL,
	`menu_item_id` text NOT NULL,
	`quantity` integer NOT NULL,
	`unit_price` integer NOT NULL,
	PRIMARY KEY(`order_id`, `menu_item_id`),
	FOREIGN KEY (`order_id`) REFERENCES `orders`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`menu_item_id`) REFERENCES `menu_items`(`id`) ON UPDATE no action ON DELETE no action,
	CONSTRAINT "order_lines_quantity_range" CHECK("order_lines"."quantity" between 1 and 10)
);
--> statement-breakpoint
CREATE TABLE `orders` (
	`id` text PRIMARY KEY NOT NULL,
	`business_date` text NOT NULL,
	`order_number` integer NOT NULL,
	`request_id` text NOT NULL,
	`total_amount` integer NOT NULL,
	`cooking_state` text NOT NULL,
	`confirmed_at` integer NOT NULL,
	`updated_at` integer NOT NULL,
	CONSTRAINT "orders_order_number_positive" CHECK("orders"."order_number" > 0)
);
--> statement-breakpoint
CREATE UNIQUE INDEX `orders_business_date_order_number_unique` ON `orders` (`business_date`,`order_number`);--> statement-breakpoint
CREATE UNIQUE INDEX `orders_request_id_unique` ON `orders` (`request_id`);
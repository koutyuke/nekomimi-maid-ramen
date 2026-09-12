ALTER TABLE `orders` ADD `handed_off_at` integer;
--> statement-breakpoint
ALTER TABLE `order_lines` ADD `cooking_state` text DEFAULT 'unstarted' NOT NULL CONSTRAINT `order_lines_cooking_state` CHECK (`cooking_state` in ('unstarted', 'cooking', 'completed'));
--> statement-breakpoint
UPDATE `order_lines` SET `cooking_state` = (SELECT `orders`.`cooking_state` FROM `orders` WHERE `orders`.`id` = `order_lines`.`order_id`);
--> statement-breakpoint
ALTER TABLE `orders` DROP COLUMN `cooking_state`;

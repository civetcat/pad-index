CREATE TABLE `skill_effects` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`skill_id` integer NOT NULL,
	`effect_category` text NOT NULL,
	`effect_code` text,
	`value_json` text,
	`duration` integer,
	`target` text,
	`conditions_json` text,
	`raw_effect_text` text NOT NULL,
	`parser_version` text NOT NULL,
	`parse_status` text NOT NULL,
	FOREIGN KEY (`skill_id`) REFERENCES `skills`(`skill_id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE INDEX `skill_effects_skill_idx` ON `skill_effects` (`skill_id`);--> statement-breakpoint
CREATE INDEX `skill_effects_category_idx` ON `skill_effects` (`effect_category`);--> statement-breakpoint
CREATE TABLE `upstream_checks` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`source_id` integer NOT NULL,
	`checked_at` text NOT NULL,
	`status` text NOT NULL,
	`latest_revision` text,
	`imported_revision` text,
	`summary_json` text,
	`error_message` text,
	FOREIGN KEY (`source_id`) REFERENCES `data_sources`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE INDEX `upstream_checks_source_idx` ON `upstream_checks` (`source_id`);
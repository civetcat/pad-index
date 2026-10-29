CREATE TABLE `awakenings` (
	`awakening_code` integer PRIMARY KEY NOT NULL,
	`name` text,
	`description` text,
	`raw_data` text
);
--> statement-breakpoint
CREATE TABLE `data_sources` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`source_name` text NOT NULL,
	`repository_url` text NOT NULL,
	`branch` text NOT NULL,
	`data_path` text NOT NULL,
	`latest_checked_revision` text,
	`latest_imported_revision` text,
	`last_checked_at` text,
	`last_successful_import_at` text,
	`status` text DEFAULT 'not_imported' NOT NULL
);
--> statement-breakpoint
CREATE UNIQUE INDEX `data_sources_source_name_unique` ON `data_sources` (`source_name`);--> statement-breakpoint
CREATE TABLE `evolutions` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`from_monster_id` integer NOT NULL,
	`to_monster_id` integer NOT NULL,
	`evolution_type` text,
	`materials_json` text,
	`source_revision` text,
	FOREIGN KEY (`from_monster_id`) REFERENCES `monsters`(`monster_id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`to_monster_id`) REFERENCES `monsters`(`monster_id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE INDEX `evolutions_to_idx` ON `evolutions` (`to_monster_id`);--> statement-breakpoint
CREATE UNIQUE INDEX `evolutions_edge` ON `evolutions` (`from_monster_id`,`to_monster_id`);--> statement-breakpoint
CREATE TABLE `import_runs` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`source_id` integer NOT NULL,
	`source_revision` text NOT NULL,
	`started_at` text NOT NULL,
	`completed_at` text,
	`status` text NOT NULL,
	`added_count` integer,
	`updated_count` integer,
	`unchanged_count` integer,
	`error_count` integer,
	`summary_json` text,
	FOREIGN KEY (`source_id`) REFERENCES `data_sources`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE INDEX `import_runs_source_idx` ON `import_runs` (`source_id`);--> statement-breakpoint
CREATE TABLE `monster_awakenings` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`monster_id` integer NOT NULL,
	`awakening_code` integer NOT NULL,
	`awakening_type` text NOT NULL,
	`position` integer NOT NULL,
	FOREIGN KEY (`monster_id`) REFERENCES `monsters`(`monster_id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE INDEX `monster_awakenings_monster_idx` ON `monster_awakenings` (`monster_id`);--> statement-breakpoint
CREATE UNIQUE INDEX `monster_awakenings_position` ON `monster_awakenings` (`monster_id`,`awakening_type`,`position`);--> statement-breakpoint
CREATE TABLE `monster_skills` (
	`monster_id` integer NOT NULL,
	`skill_id` integer NOT NULL,
	`slot_type` text NOT NULL,
	`sort_order` integer DEFAULT 0 NOT NULL,
	PRIMARY KEY(`monster_id`, `skill_id`, `slot_type`),
	FOREIGN KEY (`monster_id`) REFERENCES `monsters`(`monster_id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`skill_id`) REFERENCES `skills`(`skill_id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE TABLE `monsters` (
	`monster_id` integer PRIMARY KEY NOT NULL,
	`name` text NOT NULL,
	`name_ja` text,
	`name_en` text,
	`name_ko` text,
	`name_cht` text,
	`name_chs` text,
	`attribute_primary` integer,
	`attribute_secondary` integer,
	`attribute_tertiary` integer,
	`types_json` text NOT NULL,
	`rarity` integer,
	`cost` integer,
	`max_level` integer,
	`feed_exp` integer,
	`sell_price` integer,
	`sell_mp` integer,
	`is_ult_evo` integer,
	`is_empty` integer,
	`enabled` integer,
	`can_assist` integer,
	`stackable` integer,
	`is_8_latent` integer,
	`skill_banner` integer,
	`hp_min` integer,
	`hp_max` integer,
	`hp_scale` real,
	`atk_min` integer,
	`atk_max` integer,
	`atk_scale` real,
	`rcv_min` integer,
	`rcv_max` integer,
	`rcv_scale` real,
	`exp_max` integer,
	`exp_scale` real,
	`active_skill_id` integer,
	`leader_skill_id` integer,
	`evo_base_id` integer,
	`evo_root_id` integer,
	`evo_materials_json` text NOT NULL,
	`unevo_materials_json` text NOT NULL,
	`awakenings_json` text NOT NULL,
	`super_awakenings_json` text NOT NULL,
	`series_id` integer,
	`collab_id` integer,
	`latent_awakening_id` integer,
	`limit_break_incr` integer,
	`voice_id` integer,
	`orb_skin_or_bgm_id` integer,
	`special_attribute` text,
	`search_flags_json` text,
	`gacha_groups_flag` integer,
	`badge_id` integer,
	`flags` integer,
	`alt_names_json` text,
	`tags_json` text,
	`raw_data` text NOT NULL,
	`source_revision` text,
	`created_at` text NOT NULL,
	`updated_at` text NOT NULL
);
--> statement-breakpoint
CREATE INDEX `monsters_name_idx` ON `monsters` (`name`);--> statement-breakpoint
CREATE INDEX `monsters_rarity_idx` ON `monsters` (`rarity`);--> statement-breakpoint
CREATE INDEX `monsters_attribute_primary_idx` ON `monsters` (`attribute_primary`);--> statement-breakpoint
CREATE TABLE `skills` (
	`skill_id` integer PRIMARY KEY NOT NULL,
	`name` text NOT NULL,
	`name_ja` text,
	`name_en` text,
	`name_ko` text,
	`description` text NOT NULL,
	`description_ja` text,
	`description_en` text,
	`description_ko` text,
	`skill_type` integer,
	`max_level` integer,
	`initial_cooldown` integer,
	`unknown_field` text,
	`params_json` text NOT NULL,
	`raw_data` text NOT NULL,
	`source_revision` text,
	`updated_at` text NOT NULL
);
--> statement-breakpoint
CREATE INDEX `skills_name_idx` ON `skills` (`name`);--> statement-breakpoint
CREATE INDEX `skills_type_idx` ON `skills` (`skill_type`);
ALTER TABLE "songs" DROP CONSTRAINT "songs_stage_id_stages_id_fk";
--> statement-breakpoint
ALTER TABLE "songs" DROP COLUMN "user";--> statement-breakpoint
ALTER TABLE "songs" DROP COLUMN "stage_id";
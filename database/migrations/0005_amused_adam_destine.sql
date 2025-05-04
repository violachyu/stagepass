ALTER TABLE "stages" DROP CONSTRAINT "stages_user_id_users_id_fk";
--> statement-breakpoint
ALTER TABLE "stages" DROP COLUMN "user_id";
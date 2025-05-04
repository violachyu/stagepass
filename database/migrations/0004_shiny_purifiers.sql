ALTER TABLE "songs" ADD COLUMN "stage_id" uuid NOT NULL;--> statement-breakpoint
ALTER TABLE "stages" ADD COLUMN "join_code" text NOT NULL;--> statement-breakpoint
ALTER TABLE "songs" ADD CONSTRAINT "songs_stage_id_stages_id_fk" FOREIGN KEY ("stage_id") REFERENCES "public"."stages"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "stages" ADD CONSTRAINT "stages_join_code_unique" UNIQUE("join_code");
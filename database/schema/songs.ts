import { pgTable, text, uuid, integer, timestamp } from "drizzle-orm/pg-core"
import { users } from "./auth"
import { stages } from "./stage"
import { relations } from "drizzle-orm"
import { createSelectSchema, createInsertSchema } from "drizzle-zod"
import { z } from "zod"
export const songs = pgTable("songs", {
  id: uuid("id").primaryKey().defaultRandom(),
  title: text("title").notNull(),
  artist: text("artist"),
  // user: text("user").notNull(),
  videoId: text("video_id"),
  // position: integer("position").notNull(),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  stageId: uuid("stage_id")
    .notNull()
    .references(() => stages.id, { onDelete: "cascade" })
})

export const songsRelations = relations(songs, ({ one }) => ({
  stage: one(stages, {
    fields: [songs.stageId],
    references: [stages.id],
  }),
}))

export const stagesRelations = relations(stages, ({ many }) => ({
  songs: many(songs),
}))

export const selectSongSchema = createSelectSchema(songs)
export type Song = z.infer<typeof selectSongSchema>

export const insertSongSchema = createInsertSchema(songs, {
  title: (schema: z.ZodString) => schema.nonempty("Title cannot be empty"),
  // user: (schema: z.ZodString) => schema.nonempty("User must be provided"),
})
export type NewSong = z.infer<typeof insertSongSchema>

export default {
  songs,
}

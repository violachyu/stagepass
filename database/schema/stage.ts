import { boolean, integer, pgTable, text, timestamp, uuid } from "drizzle-orm/pg-core"

import { createSelectSchema, createInsertSchema } from "drizzle-zod"
import { number, z } from "zod"


export const stages = pgTable("stages", {
    id: uuid("id").primaryKey().defaultRandom(),
    name: text("name").notNull(),
    joinCode: text("join_code").notNull().unique(), 
    maxCapacity: integer().default(10),
    is_private: boolean("is_private").notNull().default(false),
    is_terminated: boolean("is_terminated").notNull().default(false),
    createdAt: timestamp("created_at").notNull().defaultNow(),
    updatedAt: timestamp("updated_at").notNull().defaultNow(),
    //adminUserId: text("user_id")
    //    .notNull()
    //    .references(() => users.id, { onDelete: "cascade" })
})

export const selectStageSchema = createSelectSchema(stages);
export type Stage = z.infer<typeof selectStageSchema>;

export const insertStageSchema = createInsertSchema(stages, {
    name: (schema: z.ZodString) => schema.nonempty("Stage name cannot be empty"),
})


export type StageData = z.infer<typeof insertStageSchema>;

export default {
    stages
};
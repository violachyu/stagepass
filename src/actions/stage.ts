"use server";

import { db } from "../../database/db";
import { stages } from "../../database/schema/stage";
import { insertStageSchema } from "../../database/schema/stage";
import { eq, and } from "drizzle-orm";


export async function upsertStage(roomCode: string, adminUserId: string){
  // const session = await auth.api.getSession({ headers: await headers() })
  // if (!session) return { error: "Please log in." }

  try {

    const [existing] = await db
      .select({ id: stages.id })
      .from(stages)
      .where(eq(stages.joinCode, roomCode));

    if (existing) {
      return { success: true, id: existing.id };
    }

    const validated = insertStageSchema.parse({
      joinCode: roomCode,
      name: roomCode,
      //adminUserId,
    });

    const [created] = await db
      .insert(stages)
      .values(validated)
      .returning({ id: stages.id });

    return { success: true, id: created.id };
  } catch (err) {
    console.error("upsertStage error:", err);
    return { error: "Create or fetch stage failed." };
  }
}


export async function removeStageAction(stageId: string, adminUserId?: string){
  try {
    /*
    const session = await auth.api.getSession({
        headers: await headers()
    })

    if (session?.user?.role !== "admin") {
        throw new Error("Admin Only");
    }
    */
    const res = await db
      .delete(stages)
      .where(eq(stages.id, stageId));



    return { success: true };
  } catch (err) {
    console.error("removeStageAction error:", err);
    return { error: "Remove stage failed." };
  }
}

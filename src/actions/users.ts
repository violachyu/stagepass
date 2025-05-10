"use server"

import { db } from "../../database/db"
import { users } from "../../database/schema/index"
import { z } from 'zod'
import { eq, asc, and } from "drizzle-orm";

// if u wanna add isMuted and avatars image plz u should add it here
// and change code in ./live-room/page.tsx and users schema in ./database/schema/auth.ts
export async function fetchUsers(stageId: string) {
    return db
      .select({
        id: users.id,
        name: users.name
      })
      .from(users)
      .where(eq(users.stageId, stageId))
      .orderBy(asc(users.name));
}

export async function assignUserToStage(userId: string, stageId: string) {
    try {
      const [user] = await db
        .select()
        .from(users)
        .where(eq(users.id, userId))
        .limit(1);
  
      if (!user) {
        return { error: "User not found" };
      }
  
      await db
        .update(users)
        .set({
          stageId,
          updatedAt: new Date(),
        })
        .where(eq(users.id, userId));
  
      return { success: true };
    } catch (err) {
      console.error("assignUserToStage error:", err);
      return { error: "Failed to assign user to stage" };
    }
  }
  

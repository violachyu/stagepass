"use server";

import { db } from "../../database/db";
import { stages } from "../../database/schema/stage";
import { insertStageSchema } from "../../database/schema/stage";
import { eq, and } from "drizzle-orm";

import { revalidatePath } from "next/cache"
// import { auth } from "@/lib/auth"
import { headers } from "next/headers"
import { users } from "../../database/schema"
import { redirect } from "next/navigation"
import { PrivacySetting } from '@/app/create-stage/page'
import { StageData } from '../../database/schema/stage'


// export async function getStage(stageData: StageData)
export async function upsertStage(stageData: StageData){
  // const session = await auth.api.getSession({ headers: await headers() })
  // if (!session) return { error: "Please log in." }

  try {

    const [existing] = await db
      .select({ id: stages.id })
      .from(stages)
      .where(eq(stages.joinCode, stageData.joinCode));

    if (existing) {
      return { success: true, id: existing.id };
    }

    const validated = insertStageSchema.parse({
      joinCode: stageData.joinCode,
      name: stageData.name,
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
};

export async function createStage(stageData: StageData) {
    console.log("[Server]DEBUG: Creating stage...")

    if (!stageData.name) {
        return { error: "Stage name cannot be empty" };
    }

    try {
        const [result] = await db.insert(stages)
            .values(stageData)
            .returning({ stageId: stages.id });

        console.log("[Server]DEBUG: stage created successfully");
        return { success: { stageId: result.stageId } };

    } catch (error) {
        console.log(error);
        return { error: "Failed to create stage" };
    }
}

export async function getJoinCode(stageId?: string) {
    try {
        if (!stageId) {
            return { error: "stageId is required" };
        }

        const [result] = await db
            .select()
            .from(stages)
            .where(eq(stages.id, stageId))
            .limit(1);

        if (!result) {
            return { error: "Stage not found or unauthorized" };
        }
        
        return { success: { joinCode: result.joinCode} };

    } catch (error) {
        return { error: "Failed to find stage" };
    }
}

export async function getStageIdbyJoinCode(joinCode?: string){
    if (!joinCode) {
        return { error: "JoinCode is required" };
    }

    try {
        const [result] = await db
            .select()
            .from(stages)
            .where(eq(stages.joinCode, joinCode))
            .limit(1);

        if (!result) {
            return { error: "Stage not found or unauthorized" };
        }
        
        return { success: { stageId: result.id} };

    } catch (error) {
        return { error: "Failed to find stage" };
    }

}

export async function getStageNameById(stageId?: string) {
    try {
        if (!stageId) {
            return { error: "stageId is required" };
        }

        const [result] = await db
            .select()
            .from(stages)
            .where(eq(stages.id, stageId))
            .limit(1);

        if (!result) {
            return { error: "Stage not found or unauthorized" };
        }
        
        return { success: { stageName: result.name } };

    } catch (error) {
        return { error: "Failed to find stage" };
    }
}


/* Utils */
// export async function requireAuth() {
//     const session = await auth.api.getSession({
//         headers: await headers()
//     });

//     if (!session?.user) {
//         redirect('/auth/sign-in');
//     }

//     const userId = session?.user?.id || "ea8EcFpHfDslNKhOPTHzMThXQiW9fjhz"; //Dummy UserId
//     const userRole = session?.user?.role || "user";

//     console.log("GET USER SESSION: ", userId, userRole);

//     return { userId, userRole };
// }
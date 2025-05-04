"use server"

import { eq, and } from "drizzle-orm"
import { revalidatePath } from "next/cache"
import { db } from "../../database/db"
import { stages } from "../../database/schema/stage"
// import { auth } from "@/lib/auth"
import { headers } from "next/headers"
import { users } from "../../database/schema"
import { redirect } from "next/navigation"
import { PrivacySetting } from '@/app/create-stage/page'
import { StageData } from '../../database/schema/stage'

export async function createStage(stageData: StageData) {
    console.log("[Server]DEBUG: Creating stage...")

    if (!stageData.name) {
        return { error: "Stage name cannot be empty" };
    }

    try {
        await db.insert(stages).values(stageData);
        console.log("[Server]DEBUG: stage created successfully");
        return { success: true };

    } catch (error) {
        console.log(error);
        return { error: "Failed to create stage" };
    }
}

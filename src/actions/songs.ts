"use server"

import { db } from "../../database/db"
import { songs } from "../../database/schema/index"
import { insertSongSchema } from "../../database/schema/index"
import { z } from 'zod'
import { eq, asc, and } from "drizzle-orm";

const songSchema = z.object({
  title: z.string().nonempty(),
  artist: z.string().optional(),
  videoId: z.string().optional(),
  stageId: z.string().uuid(),
})

export async function fetchSongs(stageId: string) {
    return db
      .select({
        id: songs.id,
        title: songs.title,
        artist: songs.artist,
        videoId: songs.videoId,
      })
      .from(songs)
      .where(eq(songs.stageId, stageId))
      .orderBy(asc(songs.createdAt));
  }
  

export async function addSongAction(stageId: string, songData: { title: string; artist?: string; videoId?: string }) {
    // const session = await auth.api.getSession({ headers: await headers() })
    // if (!session) return { error: "Please log in." }
  
    try {
      console.log(stageId);
      console.log(songData);
      const validated = insertSongSchema.parse({
        title : songData.title,
        artist: songData.artist,
        videoId: songData.videoId,
        stageId: stageId
        // userId: session.user.id,
      })
  
      await db.insert(songs).values({...validated})
  
      // revalidatePath(`/live-room?joinCode=${stageId}`)
  
      return { success: true }
    } catch (err) {
        console.error("addSongAction error:", err);
        return { error: "Add song failed." }
    }
  }
  
  export async function removeSongAction(songId: string, stageId: string){
    try {  

        await db
        .delete(songs)
        .where(and(eq(songs.id, songId), eq(songs.stageId, stageId)));
  
  
      return { success: true };
    } catch (err) {
      console.error("removeSongAction error:", err);
      return { error: "Remove song failed." };
    }
  }

"use server";

import { z } from "zod";

const SearchParamsSchema = z.object({
  title: z.string().min(1),
  artist: z.string().optional(),
});

const YouTubeSearchResponseSchema = z.object({
  items: z.array(
    z.object({
      id: z.object({
        videoId: z.string(),
      }),
    })
  ).optional(),
  error: z.object({
    code: z.number(),
    message: z.string(),
  }).optional(),
});

/**
 * Searches YouTube for a karaoke video based on title and artist.
 * Appends "karaoke" to the search query.
 *
 * @param params Object containing song title and optional artist.
 * @returns The video ID of the first search result, or null if not found or an error occurs.
 */
export async function searchYoutubeKaraoke(params: { title: string; artist?: string }): Promise<string | null> {
  const validation = SearchParamsSchema.safeParse(params);
  if (!validation.success) {
    console.error("Invalid search parameters:", validation.error);
    return null;
  }

  const { title, artist } = validation.data;
  const apiKey = process.env.YOUTUBE_API_KEY;

  if (!apiKey) {
    console.error("YOUTUBE_API_KEY environment variable is not set.");
    // In a real app, you might want to throw an error or return a specific error code.
    return null;
  }

  const query = `${title} ${artist || ''} karaoke`.trim();
  const encodedQuery = encodeURIComponent(query);
  const url = `https://www.googleapis.com/youtube/v3/search?part=snippet&q=${encodedQuery}&maxResults=1&type=video&key=${apiKey}`;

  try {
    console.log(`Searching YouTube with query: "${query}"`);
    const response = await fetch(url, { cache: "force-cache" }); // Cache results

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({ message: "Unknown API error" }));
      console.error(`YouTube API Error (${response.status}):`, errorData.message || response.statusText);
      return null;
    }

    const data: unknown = await response.json();
    const parsedData = YouTubeSearchResponseSchema.safeParse(data);

    if (!parsedData.success) {
        console.error("Failed to parse YouTube API response:", parsedData.error);
        return null;
    }

    if (parsedData.data.error) {
        console.error(`YouTube API Error (${parsedData.data.error.code}):`, parsedData.data.error.message);
        return null;
    }


    if (parsedData.data.items && parsedData.data.items.length > 0) {
      const videoId = parsedData.data.items[0].id.videoId;
      console.log(`Found video ID: ${videoId}`);
      return videoId;
    } else {
      console.log(`No video found for query: "${query}"`);
      return null;
    }
  } catch (error) {
    console.error("Error fetching from YouTube API:", error);
    return null;
  }
}

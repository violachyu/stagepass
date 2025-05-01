
"use server";

import { z } from "zod";

const SearchParamsSchema = z.object({
  title: z.string().min(1),
  artist: z.string().optional(),
});

const GeneralSearchParamsSchema = z.object({
    query: z.string().min(1),
    maxResults: z.number().min(1).max(10).optional().default(5), // Default to 5, max 10
});

const YouTubeSearchResponseSchema = z.object({
  items: z.array(
    z.object({
      id: z.object({
        videoId: z.string(),
      }),
       snippet: z.object({ // Include snippet for title and thumbnails
        title: z.string(),
        thumbnails: z.object({
          default: z.object({ url: z.string().url() }).optional(),
          medium: z.object({ url: z.string().url() }).optional(),
          high: z.object({ url: z.string().url() }).optional(),
        }).optional(),
      }).optional(),
    })
  ).optional(),
  error: z.object({
    code: z.number(),
    message: z.string(),
  }).optional(),
});

type YouTubeSearchResultItem = z.infer<typeof YouTubeSearchResponseSchema>['items'] extends (infer U)[] ? U : never;


/**
 * Searches YouTube for a general query, typically for song suggestions.
 *
 * @param params Object containing the search query and optional max results.
 * @returns An array of search result items, or null if an error occurs.
 */
export async function searchYoutubeGeneral(params: { query: string; maxResults?: number }): Promise<YouTubeSearchResultItem[] | null> {
  const validation = GeneralSearchParamsSchema.safeParse(params);
  if (!validation.success) {
    console.error("Invalid general search parameters:", validation.error);
    return null;
  }

  const { query, maxResults } = validation.data;
  const apiKey = process.env.YOUTUBE_API_KEY;

  if (!apiKey) {
    console.error("YOUTUBE_API_KEY environment variable is not set.");
    return null;
  }

  const encodedQuery = encodeURIComponent(query);
  // Fetch snippet along with id
  const url = `https://www.googleapis.com/youtube/v3/search?part=snippet&q=${encodedQuery}&maxResults=${maxResults}&type=video&videoEmbeddable=true&key=${apiKey}`;

  try {
    console.log(`Searching YouTube (General) with query: "${query}", maxResults: ${maxResults}`);
    // Use no-store for suggestions as they should be fresh
    const response = await fetch(url, { cache: "no-store" });

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

    console.log(`Found ${parsedData.data.items?.length ?? 0} items.`);
    return parsedData.data.items ?? []; // Return empty array if no items

  } catch (error) {
    console.error("Error fetching from YouTube API:", error);
    return null;
  }
}


/**
 * Searches YouTube specifically for a karaoke video based on title and artist.
 * Appends "karaoke" to the search query. Fetches only the first result.
 *
 * @param params Object containing song title and optional artist.
 * @returns The video ID of the first search result, or null if not found or an error occurs.
 */
export async function searchYoutubeKaraoke(params: { title: string; artist?: string }): Promise<string | null> {
  const validation = SearchParamsSchema.safeParse(params);
  if (!validation.success) {
    console.error("Invalid karaoke search parameters:", validation.error);
    return null;
  }

  const { title, artist } = validation.data;
  const apiKey = process.env.YOUTUBE_API_KEY;

  if (!apiKey) {
    console.error("YOUTUBE_API_KEY environment variable is not set.");
    return null;
  }

  const query = `${title} ${artist || ""} karaoke`.trim();
  const encodedQuery = encodeURIComponent(query);
  // Only need id for this specific search
  const url = `https://www.googleapis.com/youtube/v3/search?part=id&q=${encodedQuery}&maxResults=1&type=video&videoEmbeddable=true&key=${apiKey}`;

  try {
    console.log(`Searching YouTube (Karaoke) with query: "${query}"`);
    // Cache karaoke results more aggressively
    const response = await fetch(url, { next: { revalidate: 3600 } }); // Revalidate every hour

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

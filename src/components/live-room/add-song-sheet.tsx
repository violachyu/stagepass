
"use client";

import React, { useState, useEffect, useCallback } from 'react';
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetFooter, SheetClose } from '@/components/ui/sheet';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Loader2, Music, Search, X } from 'lucide-react';
import { searchYoutubeGeneral } from '@/actions/youtube'; // Use a general search function
import { useToast } from '@/hooks/use-toast';
import { useDebounce } from '@/hooks/use-debounce'; // Assuming a debounce hook exists or will be created

// Define the structure of a search result item
interface SearchResult {
  videoId: string;
  title: string;
  thumbnailUrl: string; // Add thumbnail URL
}

interface AddSongSheetProps {
  isOpen: boolean;
  onOpenChange: (isOpen: boolean) => void;
  onSongAdded: (song: { title: string; artist?: string; videoId?: string }) => void; // Pass videoId if available
}

export function AddSongSheet({ isOpen, onOpenChange, onSongAdded }: AddSongSheetProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<SearchResult[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();
  const debouncedSearchQuery = useDebounce(searchQuery, 500); // Debounce input by 500ms

  const handleSearch = useCallback(async (query: string) => {
    if (!query || query.trim().length < 3) {
      setSearchResults([]);
      setIsLoading(false);
      return;
    }

    setIsLoading(true);
    console.log(`Searching YouTube for query: "${query} karaoke"`);
    try {
      // Limit results to 5
      const results = await searchYoutubeGeneral({ query: `${query} karaoke`, maxResults: 5 });
      if (results) {
        setSearchResults(results.map(item => ({
            videoId: item.id.videoId,
            title: item.snippet?.title || 'Untitled',
            thumbnailUrl: item.snippet?.thumbnails?.default?.url || '/placeholder-thumbnail.png' // Add thumbnail
        })));
        console.log(`Found ${results.length} results.`);
      } else {
        setSearchResults([]);
        console.log("No results found or error occurred during search.");
      }
    } catch (error) {
      console.error("Error searching YouTube:", error);
      toast({
        variant: "destructive",
        title: "Search Failed",
        description: "Could not fetch song suggestions. Please try again.",
      });
      setSearchResults([]);
    } finally {
      setIsLoading(false);
    }
  }, [toast]);

  // Trigger search when debounced query changes
  useEffect(() => {
    handleSearch(debouncedSearchQuery);
  }, [debouncedSearchQuery, handleSearch]);

  const handleSelectSong = (result: SearchResult) => {
    console.log("Selected song:", result.title, result.videoId);
    // Basic parsing attempt (can be improved)
    const parts = result.title.split(/[-–—|]/); // Split by hyphen-like characters or pipe
    let title = parts[0]?.trim();
    let artist = parts[1]?.split(/karaoke|cover|instrumental/i)[0]?.trim(); // Try to extract artist before keywords

    // Refine title if artist extraction was successful
    if (artist && title?.toLowerCase().includes(artist.toLowerCase())) {
        // Avoid redundancy if artist is already in title part
    } else if (!artist && parts.length === 1) {
        // If only one part, remove karaoke/cover etc. from title
        title = title?.replace(/karaoke|cover|instrumental|\(.*\)|\[.*\]/gi, '').trim();
    }


    if (!title) {
        title = "Unknown Title"; // Fallback
    }

    onSongAdded({ title, artist: artist || undefined, videoId: result.videoId }); // Pass videoId
    setSearchQuery(''); // Clear search
    setSearchResults([]); // Clear results
    onOpenChange(false); // Close the sheet
  };

  // Clear search when sheet closes
  useEffect(() => {
    if (!isOpen) {
      setSearchQuery('');
      setSearchResults([]);
      setIsLoading(false);
    }
  }, [isOpen]);

  return (
    <Sheet open={isOpen} onOpenChange={onOpenChange}>
      <SheetContent side="bottom" className="h-[60vh] flex flex-col p-0 border-t border-border bg-card">
        <SheetHeader className="p-4 border-b border-border flex flex-row items-center justify-between">
          <SheetTitle>Add a Song to the Queue</SheetTitle>
          <SheetClose asChild>
            <Button variant="ghost" size="icon">
              <X className="h-5 w-5" />
              <span className="sr-only">Close</span>
            </Button>
          </SheetClose>
        </SheetHeader>

        <div className="p-4 flex items-center space-x-2 border-b border-border">
          <Search className="h-5 w-5 text-muted-foreground" />
          <Input
            type="text"
            placeholder="Search for song title or artist..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="flex-1 bg-transparent border-0 focus-visible:ring-0 focus-visible:ring-offset-0 text-base"
            autoFocus
          />
          {isLoading && <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />}
        </div>

        <ScrollArea className="flex-1 px-4 py-2">
          {searchResults.length > 0 ? (
            <ul className="space-y-2">
              {searchResults.map((result) => (
                <li key={result.videoId}>
                  <Button
                    variant="ghost"
                    className="w-full h-auto justify-start text-left p-2 hover:bg-accent"
                    onClick={() => handleSelectSong(result)}
                  >
                    <img
                        src={result.thumbnailUrl}
                        alt="Thumbnail"
                        className="w-12 h-9 object-cover rounded-sm mr-3 flex-shrink-0 bg-muted"
                        data-ai-hint="video thumbnail youtube"
                        onError={(e) => (e.currentTarget.src = '/placeholder-thumbnail.png')} // Fallback image
                    />
                    <div className="overflow-hidden">
                        <p className="text-sm font-medium truncate text-foreground">{result.title}</p>
                        {/* <p className="text-xs text-muted-foreground truncate">Video ID: {result.videoId}</p> */}
                    </div>
                  </Button>
                </li>
              ))}
            </ul>
          ) : (
            !isLoading && searchQuery.trim().length >= 3 && (
              <p className="text-center text-muted-foreground py-6">No results found for "{searchQuery}".</p>
            )
          )}
           {!isLoading && searchQuery.trim().length < 3 && searchResults.length === 0 && (
              <p className="text-center text-muted-foreground py-6">Enter at least 3 characters to search.</p>
           )}
        </ScrollArea>

        {/* Optional Footer */}
        {/* <SheetFooter className="p-4 border-t border-border">
           <SheetClose asChild>
            <Button variant="outline">Cancel</Button>
           </SheetClose>
        </SheetFooter> */}
      </SheetContent>
    </Sheet>
  );
}

// Helper hook for debouncing (add to hooks folder if not present)
// Example: src/hooks/use-debounce.ts
/*
import { useState, useEffect } from 'react';

export function useDebounce<T>(value: T, delay: number): T {
  const [debouncedValue, setDebouncedValue] = useState<T>(value);

  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedValue(value);
    }, delay);

    return () => {
      clearTimeout(handler);
    };
  }, [value, delay]);

  return debouncedValue;
}
*/

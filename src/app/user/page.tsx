"use client";

import React, { useState, useEffect, startTransition, Suspense } from "react";
import { Menu, Search, Mic } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { AddSongSheet } from "@/components/live-room/add-song-sheet";

import { fetchSongs, addSongAction } from "@/actions/songs";
import { getStageNameById } from "@/actions/stage";
import { useToast } from "@/hooks/use-toast";
import { useSearchParams } from "next/navigation";

interface Song {
  id: string; // Keep internal ID for React keys
  title: string;
  artist?: string; // Make artist optional
  user: string;
  videoId?: string; // Optional: Store pre-fetched video ID
}

// Fix: useSearchParam() rendering issue
export default function LoadingPage() {
  return (
    <Suspense fallback={<p>Loading...</p>}>
      <UserPage />
    </Suspense>
  );
}

function UserPage() {
  const [songQueue, setSongQueue] = useState<Song[]>([]);
  const [listOpen, setListOpen] = useState(false);
  const [sheetOpen, setSheetOpen] = useState(false);
  const { toast } = useToast();
  const [stageName, setStageName] = useState<string | null>(null);
  const searchParams = useSearchParams();
  const joinCode = searchParams.get('joinCode');
  const stageId = searchParams.get('stageId');

  useEffect(() => {
    if (!joinCode || !stageId) {
      toast({ title: "Error", description: "No JoinCode or stageId!"});
    }
    
    startTransition(async () => {
      try {
        if (!stageId) return;
  
        const result = await getStageNameById(stageId);
        const stageName = result.success?.stageName;
        if (!stageName) return;
        setStageName(stageName);
        
      } catch (error) {
        console.error("Failed to get stage name:", error);
      }
    });
  }, []);

  const handleFetchList = async () => {
    try {
      if (!stageId) {
        console.error("Stage ID is missing");
        return;
      };
      const res = await fetchSongs(stageId);
      setSongQueue(
        res.map(s => ({
          id: s.id,
          title: s.title,
          artist: s.artist ?? undefined,
          user: "Unknown",
          videoId: s.videoId ?? undefined,
        }))
      );
      setListOpen(true);
    } catch (err) {
      toast({ title: "Error", description: "Fetch list failed", variant: "destructive" });
    }
  };

  const handleAddSong = async (song: { title: string; artist?: string; videoId?: string }) => {
    if (!stageId) {
      console.error("Stage ID is missing");
      return;
    };
    const res = await addSongAction(stageId, song);
    if (res.error) {
      toast({ title: "Error", description: res.error, variant: "destructive" });
    } else {
      toast({ title: "Added", description: `${song.title} added.` });
      const updated = await fetchSongs(stageId);
      setSongQueue(
        updated.map(s => ({
          id: s.id,
          title: s.title,
          artist: s.artist ?? undefined,
          user: "Unknown",
          videoId: s.videoId ?? undefined,
        }))
      );
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-background text-foreground px-4">
      <Dialog open={listOpen} onOpenChange={setListOpen}>
        <div className="bg-card p-6 rounded-xl shadow-lg w-full max-w-xs text-center space-y-6">
          <h1 className="text-xl font-bold">Welcome to Stage: {stageName}!</h1>
{/* 
          <Input
            placeholder="Join code (6 digits)"
            value={joinCode}
            maxLength={6}
            onChange={(e) => setJoinCode(e.target.value.replace(/\D/g, ""))}
            className="text-center tracking-widest"
          /> */}

          <div className="grid grid-cols-3 gap-4">
            <DialogTrigger asChild>
              <Button
                variant="ghost"
                size="icon"
                className="bg-muted/20 hover:bg-muted rounded-full p-3"
                onClick={handleFetchList}
              >
                <Menu className="h-6 w-6" />
              </Button>
            </DialogTrigger>

            <Button
              variant="ghost"
              size="icon"
              className="bg-muted/20 hover:bg-muted rounded-full p-3"
              onClick={() => setSheetOpen(true)}
            >
              <Search className="h-6 w-6" />
            </Button>

            <Button
              variant="ghost"
              size="icon"
              className="bg-muted/20 hover:bg-muted rounded-full p-3 text-destructive"
              disabled
            >
              <Mic className="h-6 w-6" />
            </Button>
          </div>
        </div>

        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Stage&nbsp;{joinCode} ‑ Song List</DialogTitle>
          </DialogHeader>
          <ScrollArea className="h-64 pr-4">
            {songQueue.length === 0 ? (
              <p className="text-sm text-muted-foreground mt-4 mb-2 text-center">
                No songs yet.
              </p>
            ) : (
              <ul className="space-y-2 mt-4">
                {songQueue.map((s) => (
                  <li key={s.id} className="text-sm">
                    {s.title} {s.artist && <span className="text-muted-foreground">– {s.artist}</span>}
                  </li>
                ))}
              </ul>
            )}
          </ScrollArea>
        </DialogContent>
      </Dialog>

      {/* Add‑Song Sheet */}
      <AddSongSheet
        isOpen={sheetOpen}
        onOpenChange={setSheetOpen}
        onSongAdded={handleAddSong}
      />
    </div>
  );
}

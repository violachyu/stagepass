
"use client";

import React, { useState, useEffect, useRef, useCallback } from 'react';
import YouTube, { YouTubePlayer, YouTubeProps } from 'react-youtube';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogClose } from '@/components/ui/dialog';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog"
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger, SheetFooter } from '@/components/ui/sheet';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Share2, Users, QrCode, Mic, MicOff, X, PanelRightOpen, PanelRightClose, Play, Pause, SkipForward, Loader2, Trash2, AlertTriangle, Music, ArrowUp, GripVertical } from 'lucide-react'; // Added Music, ArrowUp, GripVertical icons
import { Skeleton } from '@/components/ui/skeleton';
import { cn } from '@/lib/utils';
import { searchYoutubeKaraoke } from '@/actions/youtube';
import { useToast } from '@/hooks/use-toast';
import { useRouter } from 'next/navigation';
import { AddSongSheet } from '@/components/live-room/add-song-sheet'; // Import the new component

// --- Types ---
interface Song {
  id: number; // Keep internal ID for React keys
  title: string;
  artist?: string; // Make artist optional
  user: string;
  videoId?: string; // Optional: Store pre-fetched video ID
}

interface Participant {
  id: string;
  name: string;
  avatar: string;
  isMuted: boolean;
}

// --- Placeholder Data ---
const initialSongQueue: Song[] = [
  { id: Date.now() + 1, title: 'September', artist:'Earth, Wind & Fire', user: 'Piggy' },
  { id: Date.now() + 2, title: 'Stairway to Heaven', artist: 'Led Zeppelin', user: 'Eve' },
];

const initialParticipants: Participant[] = [
  { id: 'user1', name: 'Alice', avatar: '/avatars/alice.png', isMuted: false },
  { id: 'user2', name: 'Bob', avatar: '/avatars/bob.png', isMuted: false },
  { id: 'user3', name: 'Charlie', avatar: '/avatars/charlie.png', isMuted: true },
  { id: 'user4', name: 'David', avatar: '/avatars/david.png', isMuted: false },
  { id: 'user5', name: 'Eve', avatar: '/avatars/eve.png', isMuted: false },
];

// --- Component ---
export default function LiveRoomPage() {
  const [songQueue, setSongQueue] = useState<Song[]>(initialSongQueue);
  const [participants, setParticipants] = useState<Participant[]>(initialParticipants);
  const [isShareModalOpen, setIsShareModalOpen] = useState(false);
  const [isParticipantsSheetOpen, setIsParticipantsSheetOpen] = useState(false);
  const [isTerminateDialogOpen, setIsTerminateDialogOpen] = useState(false);
  const [isQueueOpen, setIsQueueOpen] = useState(true);
  const [isAddSongSheetOpen, setIsAddSongSheetOpen] = useState(false); // State for AddSongSheet
  const [roomCode, setRoomCode] = useState<string | null>(null);
  const asideRef = useRef<HTMLElement>(null);
  const { toast } = useToast();
  const router = useRouter();

  // YouTube Player State
  const [currentVideoId, setCurrentVideoId] = useState<string | null>(null);
  const [player, setPlayer] = useState<YouTubePlayer | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [isLoadingVideo, setIsLoadingVideo] = useState(false);
  const [currentSongIndex, setCurrentSongIndex] = useState<number>(-1); // Index in the *current* songQueue

  // --- Effects ---
  useEffect(() => {
    // Generate a 6-digit numeric code
    const generateRoomCode = () => Math.floor(100000 + Math.random() * 900000).toString();
    setRoomCode(generateRoomCode());
  }, []);

  useEffect(() => {
    if (songQueue.length > 0 && currentSongIndex === -1 && !currentVideoId) {
       console.log("Queue has songs, setting index to 0 to start");
       setCurrentSongIndex(0);
    } else if (songQueue.length === 0 && currentSongIndex !== -1) {
        console.log("Queue became empty, resetting index and video");
        setCurrentSongIndex(-1);
        setCurrentVideoId(null);
        setIsPlaying(false);
        setIsLoadingVideo(false); // Ensure loading stops
    } else if (songQueue.length > 0 && currentSongIndex >= songQueue.length) {
        // Index became invalid after queue modification (e.g., song removal), reset to start if needed
        // If the current song was removed, the useEffect watching songQueue might handle it.
        // If another song was removed causing the index shift, reset to 0.
        console.log("Current index out of bounds, resetting to 0 or letting queue change handle it.");
        // Reset to 0 only if the queue still has items. The other effect handles empty queue.
        if(songQueue.length > 0) {
          setCurrentSongIndex(0);
        }
    }
    // No change if currentSongIndex is valid and >= 0
  }, [songQueue, currentSongIndex, currentVideoId]);


  useEffect(() => {
    const loadVideo = async () => {
      if (currentSongIndex >= 0 && currentSongIndex < songQueue.length) {
        setIsLoadingVideo(true);
        const song = songQueue[currentSongIndex];
        console.log(`Attempting to load song at index ${currentSongIndex}: "${song.title}"`);

        let videoIdToLoad = song.videoId; // Use pre-fetched ID if available

        if (!videoIdToLoad) {
          console.log(`Searching YouTube for: "${song.title}" by ${song.artist || 'Unknown Artist'}`);
          try {
            videoIdToLoad = await searchYoutubeKaraoke({ title: song.title, artist: song.artist });
             // Update the song object in the queue with the fetched ID for caching
            if (videoIdToLoad) {
                setSongQueue(prevQueue => prevQueue.map((s, idx) =>
                    idx === currentSongIndex ? { ...s, videoId: videoIdToLoad } : s
                ));
            }
          } catch (error) {
             toast({
                variant: "destructive",
                title: "Search Error",
                description: `Error searching for "${song.title}". Skipping song.`,
            });
            console.error("Error during YouTube search:", error);
            // Skip the song if search fails by removing it
             handleRemoveSong(currentSongIndex); // Use the remove function
            setIsLoadingVideo(false);
            return; // Exit effect early
          }
        } else {
            console.log(`Using pre-fetched videoId: ${videoIdToLoad}`);
        }


        if (videoIdToLoad) {
            // Only update if the video ID is different from the current one
            // Or if it's the same ID but we are explicitly trying to load it (e.g., after skip/reorder)
            if (currentVideoId !== videoIdToLoad || !player) {
                 setCurrentVideoId(videoIdToLoad);
                 console.log(`Setting video ID: ${videoIdToLoad} for song "${song.title}"`);
            } else {
                 // If the ID is the same, and player exists, it might be paused or ended.
                 // Let state change handlers manage playback.
                 console.log(`Video ID ${videoIdToLoad} already loaded. Player state will manage playback.`);
                 // Ensure loading is false if we're not actually changing the video
                 setIsLoadingVideo(false);
            }
        } else {
            toast({
                variant: "destructive",
                title: "Video Not Found",
                description: `Could not find a karaoke video for "${song.title}". Skipping song.`,
            });
            console.log(`No video found for "${song.title}", skipping.`);
            // Skip this song by removing it
             handleRemoveSong(currentSongIndex); // Use the remove function
            setIsLoadingVideo(false); // Ensure loading stops
        }
      } else if (currentSongIndex === -1 && songQueue.length === 0) {
         // Queue is empty and index is reset, clear video
         if (currentVideoId) {
            console.log("Queue empty, clearing video ID.");
            setCurrentVideoId(null);
            setIsPlaying(false);
            setIsLoadingVideo(false);
         }
      }
    };

    loadVideo();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentSongIndex, songQueue]); // Rerun when index or the queue array *reference* changes


  // --- Callbacks ---
  const toggleMute = (participantId: string) => {
    setParticipants(prev =>
      prev.map(p =>
        p.id === participantId ? { ...p, isMuted: !p.isMuted } : p
      )
    );
  };

  const toggleQueue = () => {
    setIsQueueOpen(!isQueueOpen);
  };

  const handleTerminateRoom = () => {
    console.log("Terminating room...");
    setIsTerminateDialogOpen(false);
    toast({ title: "Room Terminated", description: "The live room has been closed." });
    router.push('/dashboard');
  };

  // Callback function for adding a song from the sheet
  const handleAddSong = (newSong: { title: string; artist?: string; videoId?: string }) => {
     const songToAdd: Song = {
      ...newSong,
      id: Date.now(), // Simple unique ID using timestamp
      user: 'You', // Placeholder, replace with actual user later
    };
    setSongQueue(prevQueue => [...prevQueue, songToAdd]);
    toast({
      title: "Song Added",
      description: `"${songToAdd.title}" has been added to the queue.`,
    });
    console.log("Added song:", songToAdd);
  };

   // Callback to handle clicking a song in the queue (Plays Immediately)
   const handlePlaySongNext = (clickedIndex: number) => {
      if (clickedIndex === currentSongIndex || isLoadingVideo) {
          console.log("Clicked current song or video is loading, doing nothing.");
          return; // Do nothing if clicking the current song or loading
      }
       if (clickedIndex <= 0 || clickedIndex >= songQueue.length) { // Check if valid index to move
           console.error("Invalid clicked index for Play Next:", clickedIndex);
           return;
       }

       console.log(`Clicked Play Next for song at index ${clickedIndex}. Moving to front.`);
       const songToPlay = songQueue[clickedIndex];
       // Filter out the song and insert it at the beginning
       const newQueue = [
           songToPlay,
           ...songQueue.filter((_, index) => index !== clickedIndex)
       ];

       setSongQueue(newQueue);
       setCurrentSongIndex(0); // Set index to 0 to play the moved song next

        // Stop current video immediately if one is playing
       if (player && (isPlaying || player.getPlayerState() === YouTube.PlayerState.PAUSED)) {
          player.stopVideo();
          setIsPlaying(false); // Update state manually
       }
       setCurrentVideoId(null); // Force re-evaluation in useEffect
       setIsLoadingVideo(true); // Indicate loading starts
       toast({
           title: "Playing Next!",
           description: `"${songToPlay.title}" is now playing.`,
       });
   };

    // Callback to handle moving a song to the second position (Play After Current)
    const handleMoveSongUp = (indexToMove: number) => {
        if (indexToMove <= 0 || indexToMove >= songQueue.length) { // Can't move up if already first or invalid
            console.error("Invalid index for Move Up:", indexToMove);
            return;
        }
        if (indexToMove === 1) { // Already second, nothing to do
            console.log("Song is already second in queue.");
            return;
        }

        console.log(`Moving song at index ${indexToMove} to the second position (index 1).`);

        setSongQueue(prevQueue => {
            const songToMove = prevQueue[indexToMove];
            // Remove the song from its original position
            const tempQueue = prevQueue.filter((_, index) => index !== indexToMove);
            // Insert the song at index 1 (second position)
            const newQueue = [
                ...tempQueue.slice(0, 1), // Keep the first song (index 0)
                songToMove,               // Insert the moved song at index 1
                ...tempQueue.slice(1)     // Add the rest of the songs after index 1
            ];

             // Adjust currentSongIndex if necessary
             // If the moved song was *before* the current song, the current song's index increases by 1.
             // If the moved song was *after* the current song, the current song's index is unaffected by the removal, but might be affected by the insertion.
             // This logic gets complex quickly. It might be simpler to just let the queue update
             // and rely on the `useEffect` that watches `songQueue` and `currentSongIndex` to handle consistency.
             // However, let's try a simple adjustment:
             if (indexToMove < currentSongIndex && currentSongIndex > 1) {
                 // The current song shifted one position later because a song before it was removed and inserted at [1].
                 // But wait, the insertion also matters.
                 // Let's rethink: Just update the queue. The effects should handle the rest.
                 console.log("Queue order changed, effects will handle playback index.");
             } else if (indexToMove > currentSongIndex && currentSongIndex >= 1) {
                  // Current song index is not directly affected by removal, but might be by insertion if current was > 1.
                   console.log("Queue order changed, effects will handle playback index.");
             }
             // If currentSongIndex is 0, it's unaffected.

            toast({
                title: "Moved Up",
                description: `"${songToMove.title}" will play after the current song.`,
            });
            return newQueue;
        });
        // Do NOT manually change currentSongIndex here. Let useEffect handle it based on queue change.
    };


    // Callback to handle removing a song from the queue
    const handleRemoveSong = (indexToRemove: number) => {
        if (indexToRemove < 0 || indexToRemove >= songQueue.length) {
            console.error("Invalid index for Remove Song:", indexToRemove);
            return;
        }

        console.log(`Removing song at index ${indexToRemove}.`);
        const songToRemove = songQueue[indexToRemove];

        setSongQueue(prevQueue => {
            const newQueue = prevQueue.filter((_, index) => index !== indexToRemove);

            // --- Adjust currentSongIndex if the removed song affects it ---
            if (indexToRemove === currentSongIndex) {
                // If the currently playing song is removed:
                console.log("Removed the currently playing song.");
                if (player) {
                    player.stopVideo(); // Stop playback
                }
                setIsPlaying(false);
                setIsLoadingVideo(false);
                setCurrentVideoId(null); // Clear video ID

                // If the queue is now empty, index will be set to -1 by the other useEffect.
                // If not empty, the song at the *next* logical index (which is now indexToRemove) should play.
                // However, the `useEffect` watching `songQueue` change should handle this automatically
                // because the song at `currentSongIndex` will be different or gone.
                // So, we might not need to explicitly set `currentSongIndex` here. Let the effect run.
                 console.log("Letting queue change effect handle the next song.");

            } else if (indexToRemove < currentSongIndex) {
                 // If a song *before* the current song is removed, the current song's index decreases by 1.
                 console.log("Removed song before current, adjusting index.");
                 // Decrement currentSongIndex directly in the state setter's scope
                 // We need to update the index *based on the newQueue's perspective*
                 // This is tricky within the setter. Let's try setting it *after* the queue update.
                 // We'll handle this adjustment *outside* the setSongQueue call for clarity.
            }
             // If a song *after* the current song is removed, the current index remains the same.

            toast({
                title: "Song Removed",
                description: `"${songToRemove.title}" has been removed from the queue.`,
            });

            return newQueue; // Return the updated queue
        });

        // Adjust currentSongIndex *after* the state update has been queued,
        // but before the next render cycle completes if possible.
        // This relies on the state update batching or sequential execution.
        if (indexToRemove < currentSongIndex) {
             setCurrentSongIndex(prevIndex => Math.max(0, prevIndex - 1));
        }
         // If indexToRemove === currentSongIndex, the other effect handles setting index based on new queue state.
         // If indexToRemove > currentSongIndex, index doesn't change relative to the start.

    };


  // --- YouTube Player Event Handlers ---
  const onPlayerReady: YouTubeProps['onReady'] = (event) => {
    console.log("Player ready");
    setPlayer(event.target);
    // Autoplay should handle playing when videoId changes and playerVars.autoplay=1
    // If we just loaded because of a queue click, ensure it plays
     if (currentVideoId && !isPlaying && isLoadingVideo) {
        console.log("Player ready, attempting to play video due to recent load.");
        event.target.playVideo();
    }
  };

  const onPlayerStateChange: YouTubeProps['onStateChange'] = (event) => {
    const state = event.data;
    console.log("Player state changed:", state, `(Current Index: ${currentSongIndex}, Queue Length: ${songQueue.length})`);
    if (state === YouTube.PlayerState.ENDED) {
      console.log(`Video ended for song at index ${currentSongIndex}. Removing from queue.`);
      setIsPlaying(false);
      setIsLoadingVideo(false); // Ensure loading is off

      // Use the handleRemoveSong function to manage state consistently
      handleRemoveSong(currentSongIndex);

    } else if (state === YouTube.PlayerState.PLAYING) {
        console.log("Player state: PLAYING");
        setIsPlaying(true);
        setIsLoadingVideo(false);
    } else if (state === YouTube.PlayerState.PAUSED) {
        console.log("Player state: PAUSED");
        setIsPlaying(false);
        setIsLoadingVideo(false); // Ensure loading is off if paused during initial load
    } else if (state === YouTube.PlayerState.BUFFERING) {
        console.log("Player state: BUFFERING");
        setIsLoadingVideo(true);
    } else if (state === YouTube.PlayerState.CUED) {
       console.log("Player state: CUED");
       setIsLoadingVideo(true); // Assume loading until PLAYING starts
        // If autoplay is 1, it should start. If not, maybe force play?
        // Only force play if we intended it to start (e.g., after load/skip/reorder)
       if (player && !isPlaying && (isLoadingVideo || currentSongIndex === 0)) { // Heuristic: play if loading or it's the first item
          console.log("Video cued, attempting play...");
          player.playVideo();
       }
    } else if (state === YouTube.PlayerState.UNSTARTED) {
        console.log("Player state: UNSTARTED");
        setIsLoadingVideo(true); // Loading until cued/playing
    }
  };

  const onPlayerError: YouTubeProps['onError'] = (event) => {
    console.error(`YouTube Player Error (Code ${event.data}) for song at index ${currentSongIndex}`);
    const currentSongTitle = songQueue[currentSongIndex]?.title || "the current song";
    toast({
        variant: "destructive",
        title: `Playback Error (Code ${event.data})`,
        description: `Error playing "${currentSongTitle}". Skipping song.`,
    });
     setIsPlaying(false);
     setIsLoadingVideo(false);
     // Remove the problematic song and let useEffect handle the next one
     handleRemoveSong(currentSongIndex); // Use the remove function
 };


  const opts: YouTubeProps['opts'] = {
    // height: '100%', // Let aspect ratio control height
    // width: '100%',
    playerVars: {
      autoplay: 1,
      controls: 1,
      modestbranding: 1,
      rel: 0,
      fs: 1, // Allow fullscreen
    },
  };

  // --- Control Handlers ---
  const handlePlayPause = () => {
    if (!player) return;
    const currentState = player.getPlayerState();
    if (currentState === YouTube.PlayerState.PLAYING) {
        player.pauseVideo();
        console.log("User paused video");
        setIsPlaying(false); // Manually set state as event might lag
    } else {
        // If video exists (even if paused, ended, cued), play it
        if (currentVideoId && currentState !== YouTube.PlayerState.PLAYING) {
             player.playVideo();
             console.log("User played video");
             setIsPlaying(true); // Manually set state
        } else if (songQueue.length > 0 && currentSongIndex === -1) {
             // Start queue from beginning if nothing loaded yet
             console.log("User started queue from beginning");
             setCurrentSongIndex(0); // Trigger useEffect
        }
    }
  };

 const handleSkip = () => {
    if (isLoadingVideo || currentSongIndex < 0 || currentSongIndex >= songQueue.length) return;

    console.log(`User skipped song at index ${currentSongIndex}`);
     // Use the handleRemoveSong function to manage state consistently
     handleRemoveSong(currentSongIndex);
 };

  const getCurrentSong = (): Song | null => {
      // Check index validity against the *current* queue length
      if (currentSongIndex >= 0 && currentSongIndex < songQueue.length) {
          return songQueue[currentSongIndex];
      }
      return null;
  }
  const currentSong = getCurrentSong();


  // --- JSX ---
  return (
    <div className="flex h-screen bg-background text-foreground overflow-hidden">
      {/* Main Content Area */}
      <main className="flex-1 flex flex-col p-4 md:p-6 overflow-hidden"> {/* Ensure main area can handle overflow if needed */}
        <header className="flex justify-between items-center mb-4 flex-shrink-0">
           <div className="flex-1 min-w-0 mr-4">
              {currentSong && !isLoadingVideo ? (
                <>
                    <h1 className="text-lg md:text-xl font-bold text-primary truncate" title={currentSong.title}>
                        Now Playing: {currentSong.title}
                    </h1>
                    <p className="text-sm text-muted-foreground truncate">
                        {currentSong.artist || 'Unknown Artist'} (Added by {currentSong.user})
                    </p>
                </>
              ) : isLoadingVideo ? (
                 <h1 className="text-lg md:text-xl font-bold text-muted-foreground flex items-center">
                    <Loader2 className="h-5 w-5 mr-2 animate-spin" /> Loading next song...
                 </h1>
              ) : (
                 <h1 className="text-lg md:text-xl font-bold text-muted-foreground">
                    {songQueue.length > 0 ? "Queue finished" : "StagePass Live"}
                 </h1>
              )}
          </div>
          <div className="flex items-center space-x-1 md:space-x-2 flex-shrink-0">

             {/* Share Button */}
             <Dialog open={isShareModalOpen} onOpenChange={setIsShareModalOpen}>
               <DialogTrigger asChild>
                <Button variant="ghost" size="icon" aria-label="Share Room">
                  <Share2 className="h-5 w-5" />
                </Button>
              </DialogTrigger>
              <DialogContent className="sm:max-w-md bg-card border-border">
                <DialogHeader className="flex flex-row justify-between items-center">
                  <DialogTitle>Share this Room</DialogTitle>
                   <DialogClose asChild>
                     <Button variant="ghost" size="icon">
                       <X className="h-4 w-4" />
                     </Button>
                   </DialogClose>
                </DialogHeader>
                <div className="flex flex-col md:flex-row items-center justify-around gap-4 p-4">
                  <div className="flex flex-col items-center space-y-2">
                    <span className="text-sm text-muted-foreground">Join Code</span>
                    {roomCode ? (
                      <p className="text-3xl font-bold tracking-widest bg-muted px-4 py-2 rounded">{roomCode}</p>
                    ) : (
                       <Skeleton className="h-10 w-32" />
                    )}
                  </div>
                  <div className="flex flex-col items-center space-y-2">
                     <span className="text-sm text-muted-foreground">Scan QR Code</span>
                     <div className="p-2 border rounded-md bg-white" data-ai-hint="qrcode example placeholder">
                       {/* Placeholder QR Code SVG */}
                       <svg width="96" height="96" viewBox="0 0 33 33" fill="none" xmlns="http://www.w3.org/2000/svg">
                        <path fillRule="evenodd" clipRule="evenodd" d="M18 0H0V18H18V0ZM14 4H4V14H14V4Z" fill="black"/>
                        <path fillRule="evenodd" clipRule="evenodd" d="M8 6H6V8H8V6Z" fill="black"/>
                        <path fillRule="evenodd" clipRule="evenodd" d="M10 10H12V12H10V10Z" fill="black"/>
                        <path fillRule="evenodd" clipRule="evenodd" d="M0 32H18V26H16V28H14V30H12V28H10V26H8V24H6V26H4V28H2V22H0V32Z" fill="black"/>
                        <path fillRule="evenodd" clipRule="evenodd" d="M32 0H22V2H24V4H26V6H28V8H26V10H24V12H22V14H24V16H26V18H28V16H30V14H32V12H30V10H28V12H26V10H28V8H30V6H32V0Z" fill="black"/>
                        <path fillRule="evenodd" clipRule="evenodd" d="M22 32H32V22H30V24H28V26H30V28H28V30H26V28H24V26H22V32Z" fill="black"/>
                        <path fillRule="evenodd" clipRule="evenodd" d="M10 18H12V20H10V18Z" fill="black"/>
                        <path fillRule="evenodd" clipRule="evenodd" d="M14 18H16V20H14V18Z" fill="black"/>
                        <path fillRule="evenodd" clipRule="evenodd" d="M18 10H20V12H18V10Z" fill="black"/>
                        <path fillRule="evenodd" clipRule="evenodd" d="M18 14H20V16H18V14Z" fill="black"/>
                        <path fillRule="evenodd" clipRule="evenodd" d="M22 18H24V20H22V18Z" fill="black"/>
                        <path fillRule="evenodd" clipRule="evenodd" d="M26 18H28V20H26V18Z" fill="black"/>
                        <path fillRule="evenodd" clipRule="evenodd" d="M30 18H32V20H30V18Z" fill="black"/>
                        <path fillRule="evenodd" clipRule="evenodd" d="M18 22H20V24H18V22Z" fill="black"/>
                        <path fillRule="evenodd" clipRule="evenodd" d="M22 26H24V28H22V26Z" fill="black"/>
                        <path fillRule="evenodd" clipRule="evenodd" d="M20 30H22V32H20V30Z" fill="black"/>
                        </svg>
                     </div>
                  </div>
                </div>
                 <p className="text-xs text-center text-muted-foreground p-2">Invite others to join using the code or QR!</p>
              </DialogContent>
            </Dialog>

            {/* Participants Button */}
            <Sheet open={isParticipantsSheetOpen} onOpenChange={setIsParticipantsSheetOpen}>
               <SheetTrigger asChild>
                <Button variant="ghost" size="icon" aria-label={`View Participants (${participants.length})`}>
                  <Users className="h-5 w-5" />
                  <span className="ml-1 text-xs font-semibold">{participants.length}</span>
                </Button>
              </SheetTrigger>
              <SheetContent className="w-full sm:w-[400px] bg-card border-l border-border flex flex-col">
                <SheetHeader>
                  <SheetTitle>Participants ({participants.length})</SheetTitle>
                </SheetHeader>
                <ScrollArea className="flex-1 pr-4">
                  <ul className="space-y-3 py-4">
                    {participants.map(p => (
                      <li key={p.id} className="flex items-center justify-between p-2 rounded hover:bg-accent">
                        <div className="flex items-center space-x-3">
                          <Avatar className="h-8 w-8">
                            <AvatarImage src={`https://picsum.photos/seed/${p.id}/32/32`} alt={p.name} data-ai-hint="person face random"/>
                            <AvatarFallback>{p.name.charAt(0)}</AvatarFallback>
                          </Avatar>
                          <span className="text-sm font-medium">{p.name}</span>
                        </div>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => toggleMute(p.id)}
                          aria-label={p.isMuted ? `Unmute ${p.name}` : `Mute ${p.name}`}
                          className={cn(
                            'hover:bg-accent/50',
                            p.isMuted ? 'text-destructive hover:text-destructive/80' : 'text-muted-foreground hover:text-foreground'
                          )}
                        >
                          {p.isMuted ? <MicOff className="h-4 w-4" /> : <Mic className="h-4 w-4" />}
                        </Button>
                      </li>
                    ))}
                  </ul>
                </ScrollArea>
                 <SheetFooter className="mt-auto p-4 border-t border-border">
                    {/* Footer content if needed */}
                 </SheetFooter>
              </SheetContent>
            </Sheet>

             {/* Terminate Room Button (Moved Next to Participants) */}
             <AlertDialog open={isTerminateDialogOpen} onOpenChange={setIsTerminateDialogOpen}>
                <AlertDialogTrigger asChild>
                    <Button variant="ghost" size="icon" className="text-destructive hover:text-destructive/80 hover:bg-destructive/10" aria-label="Terminate Room">
                    <X className="h-5 w-5" /> {/* Changed to X icon */}
                    </Button>
                </AlertDialogTrigger>
                <AlertDialogContent>
                    <AlertDialogHeader>
                    <AlertDialogTitle className="flex items-center">
                        <AlertTriangle className="h-5 w-5 mr-2 text-destructive" />
                        Terminate Room?
                    </AlertDialogTitle>
                    <AlertDialogDescription>
                        Are you sure you want to permanently terminate this live room? This action cannot be undone and will remove all participants.
                    </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                    <AlertDialogCancel>Cancel</AlertDialogCancel>
                    <AlertDialogAction onClick={handleTerminateRoom} className="bg-destructive hover:bg-destructive/90 text-destructive-foreground">
                        Terminate
                    </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>

            {/* Toggle Queue Button */}
            <Button variant="ghost" size="icon" onClick={toggleQueue} aria-label={isQueueOpen ? "Hide Queue" : "Show Queue"}>
              {isQueueOpen ? <PanelRightClose className="h-5 w-5" /> : <PanelRightOpen className="h-5 w-5" />}
            </Button>
          </div>
        </header>

        {/* Video Player Area - Using aspect-video to maintain ratio */}
        <div className="flex-1 bg-black rounded-lg overflow-hidden shadow-inner relative w-full max-w-full mx-auto aspect-video flex items-center justify-center">
           {/* Loading Indicator */}
           {isLoadingVideo && (
             <div className="absolute inset-0 flex items-center justify-center bg-black/60 z-10">
                <Loader2 className="h-12 w-12 text-primary animate-spin" />
             </div>
           )}

           {/* YouTube Component */}
           {currentVideoId ? (
            <YouTube
                key={currentVideoId} // Force re-render on ID change
                videoId={currentVideoId}
                opts={opts}
                onReady={onPlayerReady}
                onStateChange={onPlayerStateChange}
                onError={onPlayerError}
                className="absolute top-0 left-0 w-full h-full" // Fill container
                iframeClassName="absolute top-0 left-0 w-full h-full border-0"
             />
           ) : (
             // Placeholder when no video is loaded/playing and not loading
             !isLoadingVideo && (
                <div className="text-center text-muted-foreground p-8">
                    <Music className="h-12 w-12 mx-auto mb-4 text-muted-foreground/50" />
                    <p className="text-lg mb-2">{songQueue.length > 0 ? "Queue finished!" : "The stage is quiet..."}</p>
                    <p className="text-sm">Add some songs to get the party started!</p>
                    <Button onClick={() => setIsAddSongSheetOpen(true)} className="mt-4">Add Song</Button>
                </div>
             )
           )}
        </div>

         {/* Playback Controls */}
         <div className="flex justify-center items-center space-x-4 mt-4 flex-shrink-0">
             <Button
                variant="ghost"
                size="icon"
                onClick={handlePlayPause}
                disabled={isLoadingVideo || (!currentVideoId && songQueue.length === 0)}
                aria-label={isPlaying ? "Pause" : "Play"}
                className="w-12 h-12 rounded-full"
            >
                {isPlaying ? <Pause className="h-6 w-6" /> : <Play className="h-6 w-6" />}
            </Button>
             <Button
                variant="ghost"
                size="icon"
                onClick={handleSkip}
                disabled={isLoadingVideo || !currentVideoId || currentSongIndex < 0 || currentSongIndex >= songQueue.length } // Also disable if index is out of bounds
                aria-label="Skip Next"
                 className="w-12 h-12 rounded-full"
            >
                <SkipForward className="h-6 w-6" />
            </Button>
         </div>
      </main>

      {/* Right Sidebar (Song Queue) */}
      <aside
        ref={asideRef}
        className={cn(
          "border-l border-border flex flex-col h-full transition-all duration-300 ease-in-out bg-card", // Added bg-card
          isQueueOpen ? "w-64 md:w-80 opacity-100" : "w-0 opacity-0 pointer-events-none -mr-1"
        )}
        aria-hidden={!isQueueOpen}
      >
        <div className={cn("flex flex-col flex-1 overflow-hidden", isQueueOpen ? "opacity-100" : "opacity-0")}>
            <CardHeader className="border-b border-border flex flex-row justify-between items-center p-4 flex-shrink-0">
              <CardTitle className="text-lg">Song Queue ({songQueue.length})</CardTitle>
            </CardHeader>
            <CardContent className="p-0 flex-1 overflow-hidden"> {/* Allow CardContent to overflow */}
              <ScrollArea className="h-full"> {/* ScrollArea takes full height of parent */}
                {songQueue.length === 0 ? (
                    <p className="text-sm text-muted-foreground text-center p-6">The queue is empty. Add a song!</p>
                ) : (
                    <ul className="p-2 space-y-1"> {/* Reduced space between items slightly */}
                    {songQueue.map((song, index) => (
                        <li
                            key={song.id}
                            className={cn(
                                "flex items-center p-2 rounded-md bg-card border border-transparent shadow-sm transition-colors duration-150 group relative", // Added group and relative positioning
                                index === currentSongIndex && "ring-1 ring-primary bg-primary/10 border-primary/30", // Adjusted highlight
                                "hover:bg-accent group-hover:text-accent-foreground" // Apply hover styles to the li
                            )}
                             title={index > currentSongIndex ? `Play "${song.title}" next` : `${song.title} - ${song.artist || 'Unknown'} (Added by ${song.user})`}
                            // onClick={index > currentSongIndex ? () => handlePlaySongNext(index) : undefined} // Play immediately on click
                        >
                            {/* Drag Handle (Optional Visual Cue) */}
                            {/* <GripVertical className="h-4 w-4 mr-2 text-muted-foreground/50 cursor-grab flex-shrink-0 group-hover:text-accent-foreground" /> */}

                            {/* Index Number or Play Icon */}
                             <span className={cn(
                                "text-base font-semibold mr-3 text-muted-foreground w-6 text-center flex-shrink-0", // Adjusted size and width
                                index === currentSongIndex && "text-primary font-bold",
                                "group-hover:text-foreground" // Change number color on hover
                             )}>
                               {index === currentSongIndex ? <Play className="h-5 w-5 inline-block text-primary animate-pulse" /> : `${index + 1}`}
                            </span>

                            {/* Song Info */}
                            <div
                                className="flex-1 overflow-hidden cursor-pointer"
                                onClick={index > currentSongIndex ? () => handlePlaySongNext(index) : undefined} // Play immediately on click if upcoming
                                >
                                <p className={cn(
                                    "text-sm font-medium truncate text-foreground",
                                    "group-hover:font-bold group-hover:text-black dark:group-hover:text-white" // Bold black on hover
                                    )}>
                                    {song.title}
                                </p>
                                <p className={cn("text-xs truncate text-muted-foreground group-hover:text-foreground")}>{song.artist || "Unknown Artist"}</p>
                                <p className={cn("text-xs truncate text-muted-foreground/80 group-hover:text-foreground/90")}>Added by {song.user}</p>
                            </div>

                             {/* Action Buttons Container */}
                            <div className="ml-2 flex items-center space-x-0 opacity-0 group-hover:opacity-100 transition-opacity absolute right-1 top-1/2 transform -translate-y-1/2 bg-accent p-1 rounded-md">
                                {/* Move Up Button (only show if not first or second) */}
                                {index > 1 && (
                                    <Button
                                        variant="ghost"
                                        size="icon"
                                        className="h-6 w-6 text-foreground hover:bg-primary/20 hover:text-primary"
                                        onClick={(e) => { e.stopPropagation(); handleMoveSongUp(index); }}
                                        title="Move Up (Play After Current)"
                                    >
                                        <ArrowUp className="h-4 w-4" />
                                    </Button>
                                )}
                                {/* Remove Button */}
                                <Button
                                    variant="ghost"
                                    size="icon"
                                    className="h-6 w-6 text-destructive/80 hover:bg-destructive/20 hover:text-destructive"
                                    onClick={(e) => { e.stopPropagation(); handleRemoveSong(index); }}
                                    title="Remove Song"
                                >
                                    <Trash2 className="h-4 w-4" />
                                </Button>
                            </div>
                        </li>
                    ))}
                    </ul>
                )}
              </ScrollArea>
            </CardContent>
            <div className="p-4 border-t border-border mt-auto flex-shrink-0">
                <Button className="w-full" onClick={() => setIsAddSongSheetOpen(true)}>
                   <Music className="mr-2 h-4 w-4" /> Add Song
                </Button>
            </div>
        </div>
      </aside>

       {/* Add Song Sheet */}
      <AddSongSheet
        isOpen={isAddSongSheetOpen}
        onOpenChange={setIsAddSongSheetOpen}
        onSongAdded={handleAddSong}
      />
    </div>
  );
}



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
import { Share2, Users, QrCode, Mic, MicOff, X, PanelRightOpen, PanelRightClose, Play, Pause, SkipForward, Loader2, Trash2, AlertTriangle, Music } from 'lucide-react'; // Added Music icon
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
    setRoomCode(Math.random().toString(36).substring(2, 8).toUpperCase());
  }, []);

  useEffect(() => {
    if (songQueue.length > 0 && currentSongIndex === -1 && !currentVideoId) {
       console.log("Queue has songs, starting index at 0");
       setCurrentSongIndex(0);
    } else if (songQueue.length === 0 && currentSongIndex !== -1) {
        console.log("Queue became empty, resetting index and video");
        setCurrentSongIndex(-1);
        setCurrentVideoId(null);
        setIsPlaying(false);
        setIsLoadingVideo(false); // Ensure loading stops
    }
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
          } catch (error) {
             toast({
                variant: "destructive",
                title: "Search Error",
                description: `Error searching for "${song.title}". Skipping song.`,
            });
            console.error("Error during YouTube search:", error);
            // Skip the song if search fails
            setSongQueue(prevQueue => prevQueue.filter((_, index) => index !== currentSongIndex));
            setIsLoadingVideo(false);
            return; // Exit effect early
          }
        } else {
            console.log(`Using pre-fetched videoId: ${videoIdToLoad}`);
        }


        if (videoIdToLoad) {
            // Only update if the video ID is different from the current one
            if (currentVideoId !== videoIdToLoad) {
                 setCurrentVideoId(videoIdToLoad);
                 console.log(`Setting video ID: ${videoIdToLoad} for song "${song.title}"`);
            } else {
                 // If the ID is the same, maybe it was paused and needs resuming?
                 // Or maybe the component re-rendered unnecessarily.
                 // For now, just ensure loading is false if the ID is already set.
                 setIsLoadingVideo(false);
                 // If player exists and isn't playing, maybe play it?
                 // if(player && player.getPlayerState() !== YouTube.PlayerState.PLAYING) {
                 //    player.playVideo();
                 // }
            }
        } else {
            toast({
                variant: "destructive",
                title: "Video Not Found",
                description: `Could not find a karaoke video for "${song.title}". Skipping song.`,
            });
            console.log(`No video found for "${song.title}", skipping.`);
            // Skip this song
            setSongQueue(prevQueue => prevQueue.filter((_, index) => index !== currentSongIndex));
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
       // No explicit finally block needed here as setIsLoading(false) is handled in success/error paths or state change handlers
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

  // --- YouTube Player Event Handlers ---
  const onPlayerReady: YouTubeProps['onReady'] = (event) => {
    console.log("Player ready");
    setPlayer(event.target);
    // Autoplay should handle playing when videoId changes and playerVars.autoplay=1
  };

  const onPlayerStateChange: YouTubeProps['onStateChange'] = (event) => {
    const state = event.data;
    console.log("Player state changed:", state, `(Current Index: ${currentSongIndex}, Queue Length: ${songQueue.length})`);
    if (state === YouTube.PlayerState.ENDED) {
      console.log(`Video ended for song at index ${currentSongIndex}. Removing from queue.`);
      setIsPlaying(false);
      setIsLoadingVideo(false); // Ensure loading is off
      setSongQueue(prevQueue => {
          const songToRemove = prevQueue[currentSongIndex];
          if (songToRemove) {
            console.log(`Removing ended song: "${songToRemove.title}"`);
          }
          const newQueue = prevQueue.filter((_, index) => index !== currentSongIndex);
          console.log(`New queue length after removal: ${newQueue.length}`);
          // The useEffect hook watching `songQueue` and `currentSongIndex` will handle loading
          // the *next* song, because the removal shifts the next song to the current index.
          return newQueue;
      });
      // We don't change currentSongIndex here. The queue shift handles it.

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
       // Player should auto-play if opts.playerVars.autoplay is 1
       // event.target.playVideo(); // Avoid manually calling play here if autoplay is set
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
     setSongQueue(prevQueue => prevQueue.filter((_, index) => index !== currentSongIndex));
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
    if (player) {
        player.stopVideo(); // Stop immediately
    }
    setIsPlaying(false);
    setIsLoadingVideo(false); // Ensure loading is off

     // Remove the current song, useEffect will handle the next load
     setSongQueue(prevQueue => {
        const songToSkip = prevQueue[currentSongIndex];
        if (songToSkip) {
            console.log(`Skipping song: "${songToSkip.title}"`);
        }
        return prevQueue.filter((_, index) => index !== currentSongIndex);
    });
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
             {/* Terminate Room Button */}
             <AlertDialog open={isTerminateDialogOpen} onOpenChange={setIsTerminateDialogOpen}>
                <AlertDialogTrigger asChild>
                    <Button variant="ghost" size="icon" className="text-destructive hover:text-destructive/80 hover:bg-destructive/10" aria-label="Terminate Room">
                    <Trash2 className="h-5 w-5" />
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
                    <ul className="p-2 space-y-2">
                    {songQueue.map((song, index) => (
                        <li
                            key={song.id}
                            className={cn(
                                "flex items-center p-3 rounded-md bg-card border border-transparent shadow-sm transition-colors duration-150",
                                index === currentSongIndex && "ring-2 ring-primary bg-primary/10 border-primary/30", // Highlight current song
                                index > currentSongIndex && "hover:bg-accent/80" // Hover effect only for upcoming
                            )}
                            title={`${song.title} - ${song.artist || 'Unknown'} (Added by ${song.user})`}
                        >
                        {/* Use Play icon for current, number for upcoming */}
                        <span className={cn(
                            "text-lg font-semibold mr-3 text-muted-foreground w-8 text-center flex-shrink-0",
                             index === currentSongIndex && "text-primary font-bold"
                            )}>
                            {index === currentSongIndex ? <Play className="h-5 w-5 inline-block text-primary animate-pulse" /> : `#${index + 1}`}
                        </span>
                        <div className="flex-1 overflow-hidden">
                            <p className={cn("text-sm font-medium truncate", index === currentSongIndex && "font-bold")}>{song.title}</p>
                            <p className="text-xs text-muted-foreground truncate">{song.artist || "Unknown Artist"}</p>
                            <p className="text-xs text-muted-foreground/80 truncate">Added by {song.user}</p>
                        </div>
                        {/* Optional Remove Button (consider permissions) */}
                        {/* <Button variant="ghost" size="icon" className="ml-2 h-6 w-6 text-muted-foreground hover:text-destructive"> <X className="h-4 w-4" /> </Button> */}
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

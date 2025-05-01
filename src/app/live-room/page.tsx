
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
import { Share2, Users, QrCode, Mic, MicOff, X, PanelRightOpen, PanelRightClose, Play, Pause, SkipForward, Loader2, Trash2, AlertTriangle } from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';
import { cn } from '@/lib/utils';
import { searchYoutubeKaraoke } from '@/actions/youtube'; // Import the server action
import { useToast } from '@/hooks/use-toast';
import { useRouter } from 'next/navigation'; // Import useRouter

// --- Types ---
interface Song {
  id: number;
  title: string;
  artist: string;
  user: string;
}

interface Participant {
  id: string;
  name: string;
  avatar: string;
  isMuted: boolean;
}

// --- Placeholder Data ---
const initialSongQueue: Song[] = [
  { id: 1, title: 'September', artist:'Earth, Wind & Fire', user: 'Piggy' }, // Added artist for better search
  // { id: 2, title: 'Hotel California', artist: 'Eagles', user: 'Bob' },
  // { id: 3, title: 'Like a Rolling Stone', artist: 'Bob Dylan', user: 'Charlie' },
  // { id: 4, title: 'Billie Jean', artist: 'Michael Jackson', user: 'David' },
  { id: 5, title: 'Stairway to Heaven', artist: 'Led Zeppelin', user: 'Eve' },
  // Add more for testing scroll
  // { id: 6, title: 'Sweet Child o\' Mine', artist: 'Guns N\' Roses', user: 'Frank' },
  // { id: 7, title: 'Imagine', artist: 'John Lennon', user: 'Grace' },
  // { id: 8, title: 'Smells Like Teen Spirit', artist: 'Nirvana', user: 'Heidi' },
  // { id: 9, title: 'Another Brick in the Wall', artist: 'Pink Floyd', user: 'Ivy' },
  // { id: 10, title: 'Wonderwall', artist: 'Oasis', user: 'Judy' },
  // { id: 11, title: 'Hey Jude', artist: 'The Beatles', user: 'Kyle' },
  // { id: 12, title: 'Purple Haze', artist: 'Jimi Hendrix', user: 'Liam' },
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
  const [isTerminateDialogOpen, setIsTerminateDialogOpen] = useState(false); // State for terminate dialog
  const [isQueueOpen, setIsQueueOpen] = useState(true);
  const [roomCode, setRoomCode] = useState<string | null>(null);
  const asideRef = useRef<HTMLElement>(null);
  const { toast } = useToast();
  const router = useRouter(); // Initialize router

  // YouTube Player State
  const [currentVideoId, setCurrentVideoId] = useState<string | null>(null);
  const [player, setPlayer] = useState<YouTubePlayer | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [isLoadingVideo, setIsLoadingVideo] = useState(false);
  const [currentSongIndex, setCurrentSongIndex] = useState<number>(-1); // Index in the *current* songQueue

  // --- Effects ---
  useEffect(() => {
    // Generate room code only on the client-side after mount
    setRoomCode(Math.random().toString(36).substring(2, 8).toUpperCase());
  }, []);

  // Effect to load the first video when the component mounts or queue changes and no song is selected
  useEffect(() => {
    if (songQueue.length > 0 && currentSongIndex === -1) {
       console.log("Queue has songs, starting index at 0");
       setCurrentSongIndex(0);
    } else if (songQueue.length === 0) {
        // If queue becomes empty (e.g., last song removed), reset index
        console.log("Queue is empty, resetting index and video");
        setCurrentSongIndex(-1);
        setCurrentVideoId(null);
        setIsPlaying(false);
    }
  }, [songQueue, currentSongIndex]);


  // Effect to load video when currentSongIndex or songQueue changes
  useEffect(() => {
    const loadVideo = async () => {
      // Check if index is valid for the current queue
      if (currentSongIndex >= 0 && currentSongIndex < songQueue.length) {
        setIsLoadingVideo(true);
        const song = songQueue[currentSongIndex];
        console.log(`Searching YouTube for: "${song.title}" by ${song.artist || 'Unknown Artist'}`);
        try {
            const videoId = await searchYoutubeKaraoke({ title: song.title, artist: song.artist });
            if (videoId) {
                setCurrentVideoId(videoId);
                console.log(`Setting video ID: ${videoId} for song "${song.title}" at index ${currentSongIndex}`);
                // isPlaying state will be updated by onPlayerStateChange when video starts
            } else {
                toast({
                    variant: "destructive",
                    title: "Video Not Found",
                    description: `Could not find a karaoke video for "${song.title}". Skipping song.`,
                });
                console.log(`No video found for "${song.title}", skipping.`);
                // Skip this song: Remove it and keep the index the same (effectively moving to the next song)
                // This triggers this effect again due to queue change
                setSongQueue(prevQueue => prevQueue.filter((_, index) => index !== currentSongIndex));
                // No need to change currentSongIndex here, the filter shifts the next song to this index
            }
        } catch (error) {
             toast({
                variant: "destructive",
                title: "Search Error",
                description: `Error searching for "${song.title}". Skipping song.`,
            });
            console.error("Error during YouTube search:", error);
            setSongQueue(prevQueue => prevQueue.filter((_, index) => index !== currentSongIndex));
        } finally {
             setIsLoadingVideo(false);
        }

      } else if (songQueue.length > 0 && currentSongIndex >= songQueue.length) {
        // Index is past the end of the queue
        console.log("Reached end of queue (index >= length).");
        setCurrentVideoId(null);
        setIsPlaying(false);
        // Don't reset index here, keep it past the end to signify completion
        toast({ title: "Queue Finished", description: "No more songs in the queue." });
      } else if (songQueue.length === 0) {
        // Queue is empty
        console.log("Queue is empty. No video to load.");
        setCurrentVideoId(null);
        setIsPlaying(false);
        setCurrentSongIndex(-1); // Reset index when queue is truly empty
      }
    };

    loadVideo();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentSongIndex, songQueue]); // Dependency array: Re-run when index or queue reference changes


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
    // TODO: Add actual room termination logic (API call, etc.)

    // Close the dialog
    setIsTerminateDialogOpen(false);

    // Show confirmation toast
    toast({
        title: "Room Terminated",
        description: "The live room has been closed.",
    });

    // Redirect to dashboard
    router.push('/dashboard');
  };

  const playNextSong = useCallback(() => {
    console.log("Attempting to play next song...");
    // Remove the *current* song (which just finished or was skipped)
    setSongQueue(prevQueue => {
        const newQueue = prevQueue.filter((_, index) => index !== currentSongIndex);
        console.log(`Removed song at index ${currentSongIndex}. New queue length: ${newQueue.length}`);
        // The useEffect hook watching `songQueue` and `currentSongIndex` will handle loading the video
        // at the *new* `currentSongIndex` (which remains the same number, but points to the next song
        // in the filtered list).
        return newQueue;
    });
    // We don't increment currentSongIndex here. The removal shifts the queue.
 }, [currentSongIndex]);


  // --- YouTube Player Event Handlers ---
  const onPlayerReady: YouTubeProps['onReady'] = (event) => {
    console.log("Player ready");
    setPlayer(event.target);
    // Autoplay is handled by opts.playerVars.autoplay and changing videoId
  };

  const onPlayerStateChange: YouTubeProps['onStateChange'] = (event) => {
    const state = event.data;
     console.log("Player state changed:", state, `(Current Index: ${currentSongIndex}, Queue Length: ${songQueue.length})`);
    // State constants: -1 (unstarted), 0 (ended), 1 (playing), 2 (paused), 3 (buffering), 5 (video cued)
    if (state === YouTube.PlayerState.ENDED) {
      console.log(`Video ended for song at index ${currentSongIndex}. Removing from queue.`);
      setIsPlaying(false);
      // Remove the current song from the queue.
      // The useEffect hook will then load the song at the *same index* (if one exists)
      setSongQueue(prevQueue => {
          const songToRemove = prevQueue[currentSongIndex];
          if (songToRemove) {
            console.log(`Removing ended song: "${songToRemove.title}"`);
          }
          // Filter out the song at the current index
          return prevQueue.filter((_, index) => index !== currentSongIndex);
      });
      // NOTE: We DON'T change currentSongIndex here. The removal shifts the next song
      // into the currentSongIndex position, triggering the useEffect to load it.

    } else if (state === YouTube.PlayerState.PLAYING) {
        console.log("Player state: PLAYING");
        setIsPlaying(true);
        setIsLoadingVideo(false); // Ensure loading is off when playing starts
    } else if (state === YouTube.PlayerState.PAUSED) {
        console.log("Player state: PAUSED");
        setIsPlaying(false);
    } else if (state === YouTube.PlayerState.BUFFERING) {
        console.log("Player state: BUFFERING");
        setIsLoadingVideo(true); // Show loader during buffering
    } else if (state === YouTube.PlayerState.CUED) {
       console.log("Player state: CUED");
       // Video is ready, playerVars.autoplay should handle playing it
       // We might briefly set loading to true until PLAYING state is hit.
       setIsLoadingVideo(true);
    } else if (state === YouTube.PlayerState.UNSTARTED) {
        console.log("Player state: UNSTARTED");
        // Often happens briefly when a new video loads
        setIsLoadingVideo(true);
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
     // Remove the problematic song from the queue
     setSongQueue(prevQueue => prevQueue.filter((_, index) => index !== currentSongIndex));
     // Effect will handle loading next song
 };


  const opts: YouTubeProps['opts'] = {
    height: '100%', // Fill container
    width: '100%', // Fill container
    playerVars: {
      // https://developers.google.com/youtube/player_parameters
      autoplay: 1, // Autoplay when loaded (controlled by currentVideoId change)
      controls: 1, // Show default YouTube controls
      modestbranding: 1, // Reduce YouTube logo
      rel: 0, // Don't show related videos at the end
      fs: 0, // Disable fullscreen button (optional)
    },
  };

  // --- Control Handlers ---
  const handlePlayPause = () => {
    if (!player) return;
    if (isPlaying) {
        player.pauseVideo();
        console.log("User paused video");
    } else {
        // If there's a video loaded (or cued), play it
        if (currentVideoId && player.getPlayerState() !== YouTube.PlayerState.PLAYING) {
             player.playVideo();
             console.log("User played video");
        } else if (songQueue.length > 0 && currentSongIndex === -1) {
             // If paused at the very beginning before any song played, start the first song
             console.log("User started queue from beginning");
             setCurrentSongIndex(0); // This will trigger the useEffect to load the video
        }
    }
    // Actual state change (isPlaying) is handled by onPlayerStateChange
  };

 const handleSkip = () => {
    if (isLoadingVideo || currentSongIndex < 0) return; // Don't skip if loading or nothing is playing/cued

    console.log(`User skipped song at index ${currentSongIndex}`);
    if (player) {
        // Stop current video immediately to prevent sound overlap
        player.stopVideo();
    }
    setIsPlaying(false); // Ensure state reflects stopping
    setIsLoadingVideo(false); // Ensure loading is off

     // Remove the *current* song from the queue
     setSongQueue(prevQueue => {
        const songToSkip = prevQueue[currentSongIndex];
        if (songToSkip) {
            console.log(`Skipping song: "${songToSkip.title}"`);
        }
        return prevQueue.filter((_, index) => index !== currentSongIndex);
    });
    // Effect will handle loading the next song at the same index
 };

  // Function to get the currently playing song details
  const getCurrentSong = (): Song | null => {
      if (currentSongIndex >= 0 && currentSongIndex < songQueue.length) {
          return songQueue[currentSongIndex];
      }
      return null;
  }
  const currentSong = getCurrentSong();


  // --- JSX ---
  return (
    <div className="flex h-screen bg-background text-foreground overflow-hidden">
      {/* Main Content Area (Video) */}
      <main className="flex-1 flex flex-col p-4 md:p-6 transition-all duration-300 ease-in-out">
        <header className="flex justify-between items-center mb-4">
          {/* Current Song Display */}
          <div className="flex-1 min-w-0 mr-4">
              {currentSong && !isLoadingVideo ? (
                <>
                    <h1 className="text-lg md:text-xl font-bold text-primary truncate" title={currentSong.title}>
                        Now Playing: {currentSong.title}
                    </h1>
                    <p className="text-sm text-muted-foreground truncate">
                        {currentSong.artist} (Added by {currentSong.user})
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
                     {/* Placeholder for QR Code */}
                     <div className="p-2 border rounded-md bg-white" data-ai-hint="qrcode example placeholder">
                        {/* Replace with actual QR code component or image */}
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
                            {/* Using picsum for placeholder images */}
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
                   {/* Optional: Add an "Invite More" button or similar */}
                 </SheetFooter>
              </SheetContent>
            </Sheet>

            {/* Toggle Queue Button */}
            <Button variant="ghost" size="icon" onClick={toggleQueue} aria-label={isQueueOpen ? "Hide Queue" : "Show Queue"}>
              {isQueueOpen ? <PanelRightClose className="h-5 w-5" /> : <PanelRightOpen className="h-5 w-5" />}
            </Button>
          </div>
        </header>

        {/* Video Player Area */}
        <div className="flex-1 bg-black rounded-lg flex items-center justify-center overflow-hidden shadow-inner relative aspect-video max-h-[calc(100vh-150px)]">
          {(isLoadingVideo || (currentVideoId && !isPlaying && player?.getPlayerState() !== YouTube.PlayerState.PAUSED && player?.getPlayerState() !== YouTube.PlayerState.ENDED)) && ( // Show loader if explicitly loading OR if video exists but isn't playing/paused/ended yet
             <div className="absolute inset-0 flex items-center justify-center bg-black/50 z-10">
                <Loader2 className="h-12 w-12 text-primary animate-spin" />
             </div>
          )}
          {currentVideoId ? (
           <YouTube
              key={currentVideoId} // Force re-render when videoId changes
              videoId={currentVideoId}
              opts={opts}
              onReady={onPlayerReady}
              onStateChange={onPlayerStateChange}
              onError={onPlayerError}
              className="absolute top-0 left-0 w-full h-full" // Ensure YouTube fills the container
              iframeClassName="absolute top-0 left-0 w-full h-full border-0" // Added border-0
            />
          ) : (
             !isLoadingVideo && (
                <div className="text-center text-muted-foreground p-8">
                    <p className="text-lg mb-2">{songQueue.length > 0 ? "Queue finished!" : "The stage is quiet..."}</p>
                    <p className="text-sm">Add some songs to get the party started!</p>
                    {/* TODO: Maybe add a button here to trigger the "Add Song" functionality */}
                </div>
             )
          )}
        </div>

         {/* Playback Controls */}
         <div className="flex justify-center items-center space-x-4 mt-4">
             <Button
                variant="ghost"
                size="icon"
                onClick={handlePlayPause}
                disabled={isLoadingVideo || (!currentVideoId && songQueue.length === 0)} // Disable if loading or no video & empty queue
                aria-label={isPlaying ? "Pause" : "Play"}
                className="w-12 h-12 rounded-full"
            >
                {isPlaying ? <Pause className="h-6 w-6" /> : <Play className="h-6 w-6" />}
            </Button>
             <Button
                variant="ghost"
                size="icon"
                onClick={handleSkip}
                disabled={isLoadingVideo || !currentVideoId || currentSongIndex < 0} // Disable if loading, no video loaded, or index is invalid
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
          "border-l border-border flex flex-col h-full transition-all duration-300 ease-in-out",
          isQueueOpen ? "w-64 md:w-80 opacity-100" : "w-0 opacity-0 pointer-events-none -mr-1"
        )}
        aria-hidden={!isQueueOpen}
      >
        <div className={cn("flex flex-col flex-1 overflow-hidden", isQueueOpen ? "opacity-100" : "opacity-0")}>
          <Card className="flex flex-col flex-1 border-0 rounded-none shadow-none bg-card">
            <CardHeader className="border-b border-border flex flex-row justify-between items-center p-4">
              <CardTitle className="text-lg">Song Queue ({songQueue.length})</CardTitle>
            </CardHeader>
            <CardContent className="p-0 flex-1">
              <ScrollArea className="h-full">
                {songQueue.length === 0 && (
                    <p className="text-sm text-muted-foreground text-center p-6">The queue is empty. Add a song!</p>
                )}
                <ul className="p-2 space-y-2">
                  {songQueue.map((song, index) => (
                    <li
                        key={song.id} // Use song ID for stable key
                        className={cn(
                            "flex items-center p-3 rounded-md bg-card border border-border shadow-sm hover:bg-accent/80 transition-colors duration-150",
                            index === 0 && "ring-2 ring-primary bg-primary/10" // Highlight *next up* song (always index 0 after removal)
                        )}
                         title={`${song.title} - ${song.artist} (Added by ${song.user})`}
                    >
                      <span className={cn(
                          "text-lg font-semibold mr-3 text-muted-foreground w-8 text-center flex-shrink-0",
                          index === 0 && "text-primary font-bold" // Style the number/icon of the next song
                          )}>
                        {index === 0 ? <Play className="h-5 w-5 inline-block" /> : `#${index + 1}`}
                      </span>
                      <div className="flex-1 overflow-hidden">
                        <p className={cn("text-sm font-medium truncate", index === 0 && "font-bold")}>{song.title}</p>
                        <p className="text-xs text-muted-foreground truncate">{song.artist || "Unknown Artist"}</p>
                        <p className="text-xs text-muted-foreground/80 truncate">Added by {song.user}</p>
                      </div>
                      {/* Optional: Add a remove button here */}
                      {/* <Button variant="ghost" size="icon" className="ml-2 h-6 w-6 text-muted-foreground hover:text-destructive" onClick={() => handleRemoveSong(song.id)}> <X className="h-4 w-4" /> </Button> */}
                    </li>
                  ))}

                </ul>
              </ScrollArea>
            </CardContent>
            <div className="p-4 border-t border-border mt-auto">
                <Button className="w-full">Add Song</Button> {/* TODO: Implement Add Song */}
            </div>
          </Card>
        </div>
      </aside>
    </div>
  );
}

    
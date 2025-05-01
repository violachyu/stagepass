
"use client";

import React, { useState, useEffect, useRef, useCallback } from 'react';
import YouTube, { YouTubePlayer, YouTubeProps } from 'react-youtube';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogClose } from '@/components/ui/dialog';
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger, SheetFooter } from '@/components/ui/sheet';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Share2, Users, QrCode, Mic, MicOff, X, PanelRightOpen, PanelRightClose, Play, Pause, SkipForward, Loader2 } from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';
import { cn } from '@/lib/utils';
import { searchYoutubeKaraoke } from '@/actions/youtube'; // Import the server action
import { useToast } from '@/hooks/use-toast';

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
  { id: 1, title: 'Bohemian Rhapsody', artist: 'Queen', user: 'Alice' },
  { id: 2, title: 'Hotel California', artist: 'Eagles', user: 'Bob' },
  { id: 3, title: 'Like a Rolling Stone', artist: 'Bob Dylan', user: 'Charlie' },
  { id: 4, title: 'Billie Jean', artist: 'Michael Jackson', user: 'David' },
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
  const [isQueueOpen, setIsQueueOpen] = useState(true);
  const [roomCode, setRoomCode] = useState<string | null>(null);
  const asideRef = useRef<HTMLElement>(null);
  const { toast } = useToast();

  // YouTube Player State
  const [currentVideoId, setCurrentVideoId] = useState<string | null>(null);
  const [player, setPlayer] = useState<YouTubePlayer | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [isLoadingVideo, setIsLoadingVideo] = useState(false);
  const [currentSongIndex, setCurrentSongIndex] = useState<number>(-1);

  // --- Effects ---
  useEffect(() => {
    setRoomCode(Math.random().toString().slice(2, 8)); // Generate code on client
  }, []);

  // Effect to load the first video when the component mounts or queue changes
  useEffect(() => {
    if (songQueue.length > 0 && currentSongIndex === -1) {
       setCurrentSongIndex(0);
    }
  }, [songQueue, currentSongIndex]);


  // Effect to load video when currentSongIndex changes
  useEffect(() => {
    const loadVideo = async () => {
      if (currentSongIndex >= 0 && currentSongIndex < songQueue.length) {
        setIsLoadingVideo(true);
        const song = songQueue[currentSongIndex];
        console.log(`Searching for: ${song.title} by ${song.artist}`);
        const videoId = await searchYoutubeKaraoke({ title: song.title, artist: song.artist });
        setIsLoadingVideo(false);

        if (videoId) {
          setCurrentVideoId(videoId);
          console.log(`Setting video ID: ${videoId}`);
        } else {
          toast({
            variant: "destructive",
            title: "Video Not Found",
            description: `Could not find a karaoke video for "${song.title}". Skipping to next song.`,
          });
          console.log(`No video found for ${song.title}, skipping.`);
          playNextSong(); // Automatically skip if not found
        }
      } else {
        // No more songs or invalid index
        setCurrentVideoId(null);
        setCurrentSongIndex(-1); // Reset index if queue ends
        setIsPlaying(false);
        console.log("Queue finished or index invalid.");
      }
    };

    loadVideo();
  }, [currentSongIndex, songQueue, toast]); // Re-run when index or queue changes


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

  const playNextSong = useCallback(() => {
    console.log("Playing next song...");
    if (currentSongIndex < songQueue.length - 1) {
        setCurrentSongIndex(prevIndex => prevIndex + 1);
    } else {
        // End of queue
        setCurrentVideoId(null);
        setCurrentSongIndex(-1); // Reset index
        setIsPlaying(false);
        toast({ title: "Queue Finished", description: "No more songs in the queue." });
        console.log("Reached end of queue.");
    }
 }, [currentSongIndex, songQueue.length, toast]);


  // --- YouTube Player Event Handlers ---
  const onPlayerReady: YouTubeProps['onReady'] = (event) => {
    console.log("Player ready");
    setPlayer(event.target);
    // Don't auto-play here, wait for state change
  };

  const onPlayerStateChange: YouTubeProps['onStateChange'] = (event) => {
    const state = event.data;
     console.log("Player state changed:", state);
    // State constants: -1 (unstarted), 0 (ended), 1 (playing), 2 (paused), 3 (buffering), 5 (video cued)
    if (state === YouTube.PlayerState.ENDED) {
      console.log("Video ended, playing next.");
      setIsPlaying(false);
      playNextSong();
    } else if (state === YouTube.PlayerState.PLAYING) {
        setIsPlaying(true);
    } else if (state === YouTube.PlayerState.PAUSED) {
        setIsPlaying(false);
    } else if (state === YouTube.PlayerState.CUED) {
       // Video is ready, play if we intend to
       if (isPlaying && player) {
           player.playVideo();
       }
    }
  };

 const onPlayerError: YouTubeProps['onError'] = (event) => {
    console.error("YouTube Player Error:", event.data);
    toast({
        variant: "destructive",
        title: "Playback Error",
        description: "An error occurred with the video playback. Skipping to the next song.",
    });
    playNextSong(); // Skip on error
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
    },
  };

  // --- Control Handlers ---
  const handlePlayPause = () => {
    if (!player) return;
    if (isPlaying) {
        player.pauseVideo();
    } else {
        if (currentVideoId) { // Only play if there's a video loaded
             player.playVideo();
        } else if (songQueue.length > 0 && currentSongIndex === -1) {
             // If paused at the beginning, start the first song
             setCurrentSongIndex(0);
        }
    }
    // State will update via onPlayerStateChange
  };

 const handleSkip = () => {
    if (player) {
        // Stop current video immediately before loading next
        player.stopVideo();
    }
    setIsPlaying(false); // Ensure state is reset before next load
    playNextSong();
 };


  // --- JSX ---
  return (
    <div className="flex h-screen bg-background text-foreground overflow-hidden">
      {/* Main Content Area (Video) */}
      <main className="flex-1 flex flex-col p-4 md:p-6 transition-all duration-300 ease-in-out">
        <header className="flex justify-between items-center mb-4">
          <h1 className="text-xl md:text-2xl font-bold text-primary">StagePass Live</h1>
          <div className="flex items-center space-x-2">
            {/* Share Button */}
            <Dialog open={isShareModalOpen} onOpenChange={setIsShareModalOpen}>
              {/* ... (Dialog content remains the same) ... */}
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
                     <div className="p-2 border rounded-md bg-white" data-ai-hint="qrcode">
                       <QrCode className="h-24 w-24 text-black" />
                     </div>
                  </div>
                </div>
              </DialogContent>
            </Dialog>

            {/* Participants Button */}
            <Sheet open={isParticipantsSheetOpen} onOpenChange={setIsParticipantsSheetOpen}>
              {/* ... (Sheet content remains the same) ... */}
               <SheetTrigger asChild>
                <Button variant="ghost" size="icon" aria-label="View Participants">
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
                            <AvatarImage src={p.avatar} alt={p.name} data-ai-hint="person face"/>
                            <AvatarFallback>{p.name.charAt(0)}</AvatarFallback>
                          </Avatar>
                          <span className="text-sm font-medium">{p.name}</span>
                        </div>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => toggleMute(p.id)}
                          aria-label={p.isMuted ? 'Unmute' : 'Mute'}
                          className={p.isMuted ? 'text-destructive hover:text-destructive/80' : 'text-muted-foreground hover:text-foreground'}
                        >
                          {p.isMuted ? <MicOff className="h-4 w-4" /> : <Mic className="h-4 w-4" />}
                        </Button>
                      </li>
                    ))}
                  </ul>
                </ScrollArea>
                 <SheetFooter className="mt-auto p-4 border-t border-border">
                   {/* Optional Footer Content */}
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
        <div className="flex-1 bg-black rounded-lg flex items-center justify-center overflow-hidden shadow-inner relative">
          {isLoadingVideo && (
             <div className="absolute inset-0 flex items-center justify-center bg-black/50 z-10">
                <Loader2 className="h-12 w-12 text-primary animate-spin" />
             </div>
          )}
          {currentVideoId ? (
            <YouTube
              videoId={currentVideoId}
              opts={opts}
              onReady={onPlayerReady}
              onStateChange={onPlayerStateChange}
              onError={onPlayerError}
              className="absolute top-0 left-0 w-full h-full" // Ensure YouTube fills the container
              iframeClassName="absolute top-0 left-0 w-full h-full"
            />
          ) : (
            !isLoadingVideo && <p className="text-muted-foreground">No video playing. Add songs to the queue!</p>
          )}
        </div>

         {/* Playback Controls */}
         <div className="flex justify-center items-center space-x-4 mt-4">
             <Button
                variant="ghost"
                size="icon"
                onClick={handlePlayPause}
                disabled={isLoadingVideo || (!currentVideoId && songQueue.length === 0)} // Disable if loading or no video/queue
                aria-label={isPlaying ? "Pause" : "Play"}
            >
                {isPlaying ? <Pause className="h-6 w-6" /> : <Play className="h-6 w-6" />}
            </Button>
             <Button
                variant="ghost"
                size="icon"
                onClick={handleSkip}
                disabled={isLoadingVideo || currentSongIndex >= songQueue.length - 1} // Disable if loading or at last song
                aria-label="Skip Next"
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
          <Card className="flex flex-col flex-1 border-0 rounded-none shadow-none">
            <CardHeader className="border-b border-border flex flex-row justify-between items-center">
              <CardTitle className="text-lg">Song Queue</CardTitle>
            </CardHeader>
            <CardContent className="p-0 flex-1">
              <ScrollArea className="h-full">
                <ul className="p-4 space-y-3">
                  {songQueue.map((song, index) => (
                    <li
                        key={song.id}
                        className={cn(
                            "flex items-center p-3 rounded-md bg-card border border-border shadow-sm hover:bg-accent transition-colors",
                            index === currentSongIndex && "ring-2 ring-primary bg-primary/10" // Highlight current song
                        )}
                    >
                      <span className={cn("text-lg font-semibold mr-3 text-muted-foreground", index === currentSongIndex && "text-primary")}>
                        {index === currentSongIndex ? <Play className="h-5 w-5 inline-block mr-1" /> : `#${index + 1}`}
                      </span>
                      <div className="flex-1 overflow-hidden">
                        <p className={cn("text-sm font-medium truncate", index === currentSongIndex && "font-bold")}>{song.title}</p>
                        <p className="text-xs text-muted-foreground truncate">{song.artist} (Added by {song.user})</p>
                      </div>
                    </li>
                  ))}
                  {songQueue.length === 0 && (
                    <p className="text-sm text-muted-foreground text-center py-4">The queue is empty. Add a song!</p>
                  )}
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

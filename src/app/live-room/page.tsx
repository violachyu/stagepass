
"use client";

import React, { useState, useEffect, useRef } from 'react';
import Image from 'next/image';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogClose } from '@/components/ui/dialog';
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger, SheetFooter } from '@/components/ui/sheet';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Share2, Users, QrCode, Mic, MicOff, X, PanelRightOpen, PanelRightClose } from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';
import { cn } from '@/lib/utils'; // Import cn for conditional classes

// Placeholder data
const initialSongQueue = [
  { id: 1, title: 'Bohemian Rhapsody', artist: 'Queen', user: 'Alice' },
  { id: 2, title: 'Hotel California', artist: 'Eagles', user: 'Bob' },
  { id: 3, title: 'Like a Rolling Stone', artist: 'Bob Dylan', user: 'Charlie' },
  { id: 4, title: 'Billie Jean', artist: 'Michael Jackson', user: 'David' },
  { id: 5, title: 'Stairway to Heaven', artist: 'Led Zeppelin', user: 'Eve' },
  { id: 6, title: 'Sweet Child o\' Mine', artist: 'Guns N\' Roses', user: 'Frank' },
  { id: 7, title: 'Imagine', artist: 'John Lennon', user: 'Grace' },
  { id: 8, title: 'Smells Like Teen Spirit', artist: 'Nirvana', user: 'Heidi' },
];

const initialParticipants = [
  { id: 'user1', name: 'Alice', avatar: '/avatars/alice.png', isMuted: false },
  { id: 'user2', name: 'Bob', avatar: '/avatars/bob.png', isMuted: false },
  { id: 'user3', name: 'Charlie', avatar: '/avatars/charlie.png', isMuted: true },
  { id: 'user4', name: 'David', avatar: '/avatars/david.png', isMuted: false },
  { id: 'user5', name: 'Eve', avatar: '/avatars/eve.png', isMuted: false },
];

export default function LiveRoomPage() {
  const [songQueue, setSongQueue] = useState(initialSongQueue);
  const [participants, setParticipants] = useState(initialParticipants);
  const [isShareModalOpen, setIsShareModalOpen] = useState(false);
  const [isParticipantsSheetOpen, setIsParticipantsSheetOpen] = useState(false);
  const [isQueueOpen, setIsQueueOpen] = useState(true); // State for song queue visibility
  const [roomCode, setRoomCode] = useState<string | null>(null);
  const asideRef = useRef<HTMLElement>(null); // Ref for aside width transition

  useEffect(() => {
    // Generate 6-digit code only on the client side
    setRoomCode(Math.random().toString().slice(2, 8));
  }, []);

  useEffect(() => {
    // Force reflow for transition on mount/state change if needed, though Tailwind handles this well
    if (asideRef.current) {
      // You might not need this, Tailwind's transition classes usually work automatically
      void asideRef.current.offsetWidth;
    }
  }, [isQueueOpen]);


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

  return (
    <div className="flex h-screen bg-background text-foreground overflow-hidden">
      {/* Main Content Area (Video) */}
      <main className="flex-1 flex flex-col p-4 md:p-6 transition-all duration-300 ease-in-out">
        <header className="flex justify-between items-center mb-4">
          <h1 className="text-xl md:text-2xl font-bold text-primary">StagePass Live</h1>
          <div className="flex items-center space-x-2">
            {/* Share Button & Modal */}
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
                    {/* Placeholder QR Code */}
                     <div className="p-2 border rounded-md bg-white" data-ai-hint="qrcode">
                       {/* In a real app, replace with actual QR code component/image */}
                       <QrCode className="h-24 w-24 text-black" />
                     </div>
                  </div>
                </div>
              </DialogContent>
            </Dialog>

            {/* Participants Button & Sheet */}
            <Sheet open={isParticipantsSheetOpen} onOpenChange={setIsParticipantsSheetOpen}>
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

        {/* Video Player Placeholder */}
        <div className="flex-1 bg-muted rounded-lg flex items-center justify-center overflow-hidden shadow-inner">
          {/* Replace with actual video player component */}
          <Image
            src="https://picsum.photos/1280/720"
            alt="Music Video Placeholder"
            width={1280}
            height={720}
            className="w-full h-full object-cover"
            data-ai-hint="music video concert stage"
            priority // Load the main content image faster
          />
        </div>
      </main>

      {/* Right Sidebar (Song Queue) */}
      <aside
        ref={asideRef}
        className={cn(
          "border-l border-border flex flex-col h-full transition-all duration-300 ease-in-out",
          isQueueOpen ? "w-64 md:w-80 opacity-100" : "w-0 opacity-0 pointer-events-none -mr-1" // -mr-1 helps hide border smoothly
        )}
        aria-hidden={!isQueueOpen} // Accessibility
      >
        {/* Wrap content in another div to prevent content visibility during collapse */}
        <div className={cn("flex flex-col flex-1 overflow-hidden", isQueueOpen ? "opacity-100" : "opacity-0")}>
          <Card className="flex flex-col flex-1 border-0 rounded-none shadow-none">
            <CardHeader className="border-b border-border flex flex-row justify-between items-center">
              <CardTitle className="text-lg">Song Queue</CardTitle>
               {/* Optionally keep the close button inside the panel as well */}
               {/*
               <Button variant="ghost" size="icon" onClick={toggleQueue} className="md:hidden">
                 <X className="h-4 w-4" />
               </Button>
               */}
            </CardHeader>
            <CardContent className="p-0 flex-1">
              <ScrollArea className="h-full">
                <ul className="p-4 space-y-3">
                  {songQueue.map((song, index) => (
                    <li key={song.id} className="flex items-center p-3 rounded-md bg-card border border-border shadow-sm hover:bg-accent transition-colors">
                      <span className="text-lg font-semibold mr-3 text-muted-foreground">#{index + 1}</span>
                      <div className="flex-1 overflow-hidden">
                        <p className="text-sm font-medium truncate">{song.title}</p>
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
                <Button className="w-full">Add Song</Button> {/* TODO: Implement Add Song functionality */}
            </div>
          </Card>
        </div>
      </aside>
    </div>
  );
}

    
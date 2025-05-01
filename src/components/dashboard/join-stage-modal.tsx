
"use client";

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
  DialogClose
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from '@/hooks/use-toast';
import { LogIn, X } from 'lucide-react';

interface JoinStageModalProps {
  isOpen: boolean;
  onOpenChange: (isOpen: boolean) => void;
}

const JoinStageModal: React.FC<JoinStageModalProps> = ({ isOpen, onOpenChange }) => {
  const router = useRouter();
  const { toast } = useToast();
  const [preferredName, setPreferredName] = useState('');
  const [joinCode, setJoinCode] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!preferredName.trim() || !joinCode.trim()) {
      toast({
        variant: "destructive",
        title: "Missing Information",
        description: "Please enter both your preferred name and the join code.",
      });
      return;
    }

    // Basic validation for 6-digit numeric code
    if (!/^\d{6}$/.test(joinCode.trim())) {
       toast({
        variant: "destructive",
        title: "Invalid Code Format",
        description: "The join code must be a 6-digit number.",
      });
      return;
    }


    setIsSubmitting(true);
    console.log("Attempting to join stage:", { preferredName, joinCode });

    // TODO: Implement actual validation logic for the join code (e.g., check if the room exists)
    // Simulate API call/validation
    await new Promise(resolve => setTimeout(resolve, 1000));

    // Assuming validation is successful for now
    toast({
      title: "Joining Stage...",
      description: `Welcome, ${preferredName}! Joining room ${joinCode}.`,
    });

    // Close modal and navigate
    onOpenChange(false);
    // Redirect to the live room, passing the code. The live room page would then handle fetching room data based on the code.
    router.push(`/live-room?joinCode=${joinCode.trim()}`); // Pass code as query param

    // Reset form state if needed (modal might unmount anyway)
    setPreferredName('');
    setJoinCode('');
    setIsSubmitting(false);

    // --- Handle potential errors ---
    // Example:
    // try {
    //   const roomExists = await checkRoomExists(joinCode.trim()); // Fictional function
    //   if (roomExists) {
    //      // Proceed with joining... toast, navigate
    //   } else {
    //     throw new Error("Room not found or code is invalid.");
    //   }
    // } catch (error: any) {
    //    toast({
    //     variant: "destructive",
    //     title: "Failed to Join",
    //     description: error.message || "Could not join the stage. Please check the code and try again.",
    //   });
    //    setIsSubmitting(false);
    // }
  };

  // Clear form when modal is closed
  React.useEffect(() => {
    if (!isOpen) {
      setPreferredName('');
      setJoinCode('');
      setIsSubmitting(false);
    }
  }, [isOpen]);

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[425px] bg-card text-card-foreground rounded-lg shadow-lg border-border">
        <DialogHeader className="flex flex-row justify-between items-center mb-4">
          <DialogTitle className="text-xl font-semibold flex items-center">
            <LogIn className="mr-2 h-5 w-5" /> Join a Live Stage
          </DialogTitle>
          <DialogClose asChild>
            <Button variant="ghost" size="icon">
              <X className="h-4 w-4" />
              <span className="sr-only">Close</span>
            </Button>
          </DialogClose>
        </DialogHeader>
        <DialogDescription className="text-muted-foreground mb-6 text-center sm:text-left">
          Enter your name and the 6-digit code to join the karaoke room.
        </DialogDescription>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="preferred-name">Preferred Name</Label>
            <Input
              id="preferred-name"
              type="text"
              placeholder="Your Name"
              value={preferredName}
              onChange={(e) => setPreferredName(e.target.value)}
              required
              className="bg-input text-foreground placeholder:text-muted-foreground"
              disabled={isSubmitting}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="join-code">Join Code (6 Digits)</Label>
            <Input
              id="join-code"
              type="text" // Use text to allow leading zeros if needed, validation handles format
              placeholder="123456"
              value={joinCode}
              onChange={(e) => setJoinCode(e.target.value)}
              required
              maxLength={6} // Limit input length
              pattern="\d{6}" // HTML5 pattern validation (optional, JS validation is primary)
              title="Enter the 6-digit join code"
              className="bg-input text-foreground placeholder:text-muted-foreground"
              disabled={isSubmitting}
            />
          </div>
          <DialogFooter className="mt-6">
            <Button
             type="submit"
             className="w-full sm:w-auto bg-primary text-primary-foreground hover:bg-primary/90"
             disabled={isSubmitting || !preferredName.trim() || !joinCode.trim() || !/^\d{6}$/.test(joinCode.trim())}
            >
              {isSubmitting ? 'Joining...' : 'Join Stage'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default JoinStageModal;

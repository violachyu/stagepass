"use client";

import React from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
  DialogClose
} from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { Chrome } from 'lucide-react'; // Using Chrome as a stand-in for Google icon


interface AuthModalProps {
  isOpen: boolean;
  onOpenChange: (isOpen: boolean) => void;
}

const AuthModal: React.FC<AuthModalProps> = ({ isOpen, onOpenChange }) => {

  const handleGoogleSignIn = () => {
    // TODO: Implement Google Sign-In logic using Firebase Auth or similar
    console.log("Attempting Google Sign-In...");
    // Example: signInWithPopup(auth, googleProvider);
    onOpenChange(false); // Close modal after attempt (adjust as needed)
  };

  const handleEmailPasswordSignIn = (event: React.FormEvent) => {
    event.preventDefault();
    // TODO: Implement Email/Password Sign-In logic
    console.log("Attempting Email/Password Sign-In...");
    onOpenChange(false); // Close modal after attempt
  };

    const handleEmailPasswordSignUp = (event: React.FormEvent) => {
    event.preventDefault();
    // TODO: Implement Email/Password Sign-Up logic
    console.log("Attempting Email/Password Sign-Up...");
    onOpenChange(false); // Close modal after attempt
  };


  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[425px] bg-card text-card-foreground rounded-lg shadow-lg border-border">
        <Tabs defaultValue="signin" className="w-full">
          <DialogHeader className="mb-4">
             <TabsList className="grid w-full grid-cols-2">
                <TabsTrigger value="signin">Sign In</TabsTrigger>
                <TabsTrigger value="signup">Sign Up</TabsTrigger>
            </TabsList>
          </DialogHeader>

          {/* Sign In Tab */}
          <TabsContent value="signin">
            <DialogTitle className="text-center text-xl font-semibold mb-2">Welcome Back!</DialogTitle>
            <DialogDescription className="text-center text-muted-foreground mb-6">
              Sign in to access your stage.
            </DialogDescription>
            <form onSubmit={handleEmailPasswordSignIn} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="signin-email">Email</Label>
                <Input id="signin-email" type="email" placeholder="you@example.com" required className="bg-input text-foreground placeholder:text-muted-foreground" />
              </div>
              <div className="space-y-2">
                <Label htmlFor="signin-password">Password</Label>
                <Input id="signin-password" type="password" required className="bg-input text-foreground"/>
              </div>
              <Button type="submit" className="w-full bg-primary text-primary-foreground hover:bg-primary/90">Sign In</Button>
            </form>
            <Separator className="my-6" />
            <Button variant="outline" className="w-full border-border hover:bg-accent hover:text-accent-foreground" onClick={handleGoogleSignIn}>
              <Chrome className="mr-2 h-4 w-4" /> Sign in with Google
            </Button>
          </TabsContent>

          {/* Sign Up Tab */}
          <TabsContent value="signup">
             <DialogTitle className="text-center text-xl font-semibold mb-2">Create Account</DialogTitle>
            <DialogDescription className="text-center text-muted-foreground mb-6">
              Join StagePass today!
            </DialogDescription>
             <form onSubmit={handleEmailPasswordSignUp} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="signup-email">Email</Label>
                <Input id="signup-email" type="email" placeholder="you@example.com" required className="bg-input text-foreground placeholder:text-muted-foreground"/>
              </div>
              <div className="space-y-2">
                <Label htmlFor="signup-password">Password</Label>
                <Input id="signup-password" type="password" required className="bg-input text-foreground"/>
              </div>
               <div className="space-y-2">
                <Label htmlFor="signup-confirm-password">Confirm Password</Label>
                <Input id="signup-confirm-password" type="password" required className="bg-input text-foreground"/>
              </div>
              <Button type="submit" className="w-full bg-primary text-primary-foreground hover:bg-primary/90">Sign Up</Button>
            </form>
             <Separator className="my-6" />
            <Button variant="outline" className="w-full border-border hover:bg-accent hover:text-accent-foreground" onClick={handleGoogleSignIn}>
              <Chrome className="mr-2 h-4 w-4" /> Sign up with Google
            </Button>
          </TabsContent>

        </Tabs>
         {/* Removed redundant footer and close button - using DialogClose within content */}
      </DialogContent>
    </Dialog>
  );
};

export default AuthModal;

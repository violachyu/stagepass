
"use client";

import React from 'react';
import { useRouter } from 'next/navigation'; // Import useRouter
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
import { useToast } from '@/hooks/use-toast'; // Import useToast


interface AuthModalProps {
  isOpen: boolean;
  onOpenChange: (isOpen: boolean) => void;
}

const AuthModal: React.FC<AuthModalProps> = ({ isOpen, onOpenChange }) => {
  const router = useRouter(); // Initialize router
  const { toast } = useToast(); // Initialize toast

  const handleSuccessfulAuth = () => {
    toast({
      title: "Success!",
      description: "You have been logged in.",
    });
    onOpenChange(false); // Close modal
    router.push('/dashboard'); // Redirect to dashboard
  }

  const handleFailedAuth = (error: any) => {
     toast({
      variant: "destructive",
      title: "Authentication Failed",
      description: error.message || "An error occurred. Please try again.",
    });
    console.error("Authentication error:", error);
  }


  const handleGoogleSignIn = async () => {
    console.log("Attempting Google Sign-In...");
    // TODO: Implement actual Firebase Google Sign-In logic
    // Example:
    // try {
    //   await signInWithPopup(auth, googleProvider);
    //   handleSuccessfulAuth();
    // } catch (error) {
    //   handleFailedAuth(error);
    // }
    // For now, simulate success:
    setTimeout(() => handleSuccessfulAuth(), 500);
  };

  const handleEmailPasswordSignIn = async (event: React.FormEvent) => {
    event.preventDefault();
    console.log("Attempting Email/Password Sign-In...");
     // TODO: Implement actual Firebase Email/Password Sign-In logic
    // Example:
    // const email = (event.target as HTMLFormElement)['signin-email'].value;
    // const password = (event.target as HTMLFormElement)['signin-password'].value;
    // try {
    //   await signInWithEmailAndPassword(auth, email, password);
    //   handleSuccessfulAuth();
    // } catch (error) {
    //    handleFailedAuth(error);
    // }
     // For now, simulate success:
    setTimeout(() => handleSuccessfulAuth(), 500);
  };

    const handleEmailPasswordSignUp = async (event: React.FormEvent) => {
    event.preventDefault();
    console.log("Attempting Email/Password Sign-Up...");
    // TODO: Implement actual Firebase Email/Password Sign-Up logic
    // Example:
    // const email = (event.target as HTMLFormElement)['signup-email'].value;
    // const password = (event.target as HTMLFormElement)['signup-password'].value;
    // const confirmPassword = (event.target as HTMLFormElement)['signup-confirm-password'].value;
    // if (password !== confirmPassword) {
    //   handleFailedAuth({ message: "Passwords do not match." });
    //   return;
    // }
    // try {
    //   await createUserWithEmailAndPassword(auth, email, password);
    //   handleSuccessfulAuth();
    // } catch (error) {
    //    handleFailedAuth(error);
    // }
    // For now, simulate success:
    setTimeout(() => handleSuccessfulAuth(), 500);
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

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
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { Chrome } from 'lucide-react'; // Using Chrome as a stand-in for Google icon
import { useToast } from '@/hooks/use-toast';
import { authClient } from '@/lib/auth-client'; // Import Better Auth client

interface AuthModalProps {
  isOpen: boolean;
  onOpenChange: (isOpen: boolean) => void;
}

const AuthModal: React.FC<AuthModalProps> = ({ isOpen, onOpenChange }) => {
  const router = useRouter();
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(false);

  const handleSuccessfulAuth = () => {
    onOpenChange(false);
    window.location.href = '/dashboard';
  }

  const handleFailedAuth = (error: any) => {
    toast({
      variant: "destructive",
      title: "Authentication Failed",
      description: error.message || "An error occurred. Please try again.",
    });
  }

  const handleGoogleSignIn = async () => {
    try {
      setIsLoading(true);
      await authClient.signIn.social({ 
        provider: "google",
        callbackURL: "/dashboard",
        newUserCallbackURL: "/dashboard"
      });
    } catch (error) {
      handleFailedAuth(error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleEmailPasswordSignIn = async (event: React.FormEvent) => {
    event.preventDefault();
    
    try {
      setIsLoading(true);
      const formData = new FormData(event.target as HTMLFormElement);
      const email = formData.get('signin-email') as string;
      const password = formData.get('signin-password') as string;
      
      // Use Better Auth's email/password sign-in with proper error handling
      const { data, error } = await authClient.signIn.email({
        email,
        password
      });
      
      // Check if there was an error during sign-in
      if (error) {
        handleFailedAuth(error);
        return;
      }
      
      // Only proceed if authentication was successful
      if (data) {
        handleSuccessfulAuth();
      } else {
        // Handle case where neither error nor data was returned
        handleFailedAuth({ message: "Authentication failed. Please try again." });
      }
    } catch (error) {
      handleFailedAuth(error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleEmailPasswordSignUp = async (event: React.FormEvent) => {
    event.preventDefault();
    
    try {
      setIsLoading(true);
      const formData = new FormData(event.target as HTMLFormElement);
      const email = formData.get('signup-email') as string;
      const password = formData.get('signup-password') as string;
      const confirmPassword = formData.get('signup-confirm-password') as string;
      
      if (password !== confirmPassword) {
        handleFailedAuth({ message: "Passwords do not match." });
        setIsLoading(false);
        return;
      }
      
      // Use Better Auth's email/password sign-up with proper error handling
      const { data, error } = await authClient.signUp.email({
        email,
        password,
        name: email.split('@')[0] // Use part of email as name
      });
      
      // Check if there was an error during sign-up
      if (error) {
        handleFailedAuth(error);
        return;
      }
      
      // Only proceed if registration was successful
      if (data) {
        handleSuccessfulAuth();
      } else {
        // Handle case where neither error nor data was returned
        handleFailedAuth({ message: "Registration failed. Please try again." });
      }
    } catch (error) {
      handleFailedAuth(error);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={isLoading ? undefined : onOpenChange}>
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
                <Input id="signin-email" name="signin-email" type="email" placeholder="you@example.com" required className="bg-input text-foreground placeholder:text-muted-foreground" />
              </div>
              <div className="space-y-2">
                <Label htmlFor="signin-password">Password</Label>
                <Input id="signin-password" name="signin-password" type="password" required className="bg-input text-foreground"/>
              </div>
              <Button type="submit" className="w-full bg-primary text-primary-foreground hover:bg-primary/90" disabled={isLoading}>
                {isLoading ? "Signing in..." : "Sign In"}
              </Button>
            </form>
            <Separator className="my-6" />
            <Button 
              variant="outline" 
              className="w-full border-border hover:bg-accent hover:text-accent-foreground" 
              onClick={handleGoogleSignIn}
              disabled={isLoading}
            >
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
                <Input id="signup-email" name="signup-email" type="email" placeholder="you@example.com" required className="bg-input text-foreground placeholder:text-muted-foreground"/>
              </div>
              <div className="space-y-2">
                <Label htmlFor="signup-password">Password</Label>
                <Input id="signup-password" name="signup-password" type="password" required className="bg-input text-foreground"/>
              </div>
               <div className="space-y-2">
                <Label htmlFor="signup-confirm-password">Confirm Password</Label>
                <Input id="signup-confirm-password" name="signup-confirm-password" type="password" required className="bg-input text-foreground"/>
              </div>
              <Button type="submit" className="w-full bg-primary text-primary-foreground hover:bg-primary/90" disabled={isLoading}>
                {isLoading ? "Signing up..." : "Sign Up"}
              </Button>
            </form>
             <Separator className="my-6" />
            <Button 
              variant="outline" 
              className="w-full border-border hover:bg-accent hover:text-accent-foreground" 
              onClick={handleGoogleSignIn}
              disabled={isLoading}
            >
              <Chrome className="mr-2 h-4 w-4" /> Sign up with Google
            </Button>
          </TabsContent>
        </Tabs>
      </DialogContent>
    </Dialog>
  );
};

export default AuthModal;


"use client";

import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Button } from '@/components/ui/button';
import { Settings, Users, Lock, Globe } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useToast } from '@/hooks/use-toast';

type PrivacySetting = "public" | "private";

export default function CreateStagePage() {
  const router = useRouter();
  const { toast } = useToast();
  const [maxCapacity, setMaxCapacity] = useState<number | ''>('');
  const [privacy, setPrivacy] = useState<PrivacySetting>("public");

  const handleCapacityChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const value = event.target.value;
    // Allow empty string or positive integers
    if (value === '' || /^[1-9]\d*$/.test(value)) {
      setMaxCapacity(value === '' ? '' : parseInt(value, 10));
    }
  };

  const handlePrivacyChange = (value: string) => {
    setPrivacy(value as PrivacySetting);
  };

  const handleCreateStage = () => {
    if (maxCapacity === '' || maxCapacity <= 0) {
      toast({
        variant: "destructive",
        title: "Invalid Capacity",
        description: "Please enter a valid maximum capacity greater than 0.",
      });
      return;
    }

    // TODO: Implement actual stage creation logic (e.g., API call, state update)
    console.log("Creating stage with settings:", { maxCapacity, privacy });
    toast({
      title: "Stage Created",
      description: `Your ${privacy} stage with capacity ${maxCapacity} is ready.`,
    });

    // Example: Navigate to the newly created stage/live room
    // Replace '/live-room/new-stage-id' with the actual route
    // router.push('/live-room/new-stage-id');

     // For now, just navigate back to dashboard after simulated creation
    setTimeout(() => router.push('/dashboard'), 1000);
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-background p-4">
      <Card className="w-full max-w-lg shadow-xl">
        <CardHeader>
          <CardTitle className="flex items-center text-2xl font-bold">
            <Settings className="mr-2 h-6 w-6" /> Create Your Stage
          </CardTitle>
          <CardDescription>Configure the settings for your new live room.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-6 p-6">
          <div className="space-y-2">
            <Label htmlFor="max-capacity" className="flex items-center text-base">
              <Users className="mr-2 h-5 w-5 text-muted-foreground" /> Maximum Capacity
            </Label>
            <Input
              id="max-capacity"
              type="number"
              placeholder="Enter maximum number of users"
              value={maxCapacity}
              onChange={handleCapacityChange}
              min="1"
              className="bg-input text-foreground placeholder:text-muted-foreground"
            />
            <p className="text-sm text-muted-foreground">The maximum number of users allowed in the room at one time.</p>
          </div>

          <div className="space-y-3">
            <Label className="flex items-center text-base">
              <Lock className="mr-2 h-5 w-5 text-muted-foreground" /> Room Privacy
            </Label>
            <RadioGroup
              defaultValue="public"
              onValueChange={handlePrivacyChange}
              className="flex flex-col space-y-2 sm:flex-row sm:space-y-0 sm:space-x-4"
            >
              <div className="flex items-center space-x-2 rounded-md border border-border p-3 hover:bg-accent hover:text-accent-foreground transition-colors cursor-pointer has-[:checked]:border-primary has-[:checked]:bg-accent">
                <RadioGroupItem value="public" id="public" />
                 <Globe className="h-4 w-4 text-muted-foreground" />
                <Label htmlFor="public" className="font-medium cursor-pointer">Public</Label>
                <p className="text-xs text-muted-foreground flex-1 text-right sm:text-left sm:flex-none">Anyone can join</p>
              </div>
              <div className="flex items-center space-x-2 rounded-md border border-border p-3 hover:bg-accent hover:text-accent-foreground transition-colors cursor-pointer has-[:checked]:border-primary has-[:checked]:bg-accent">
                <RadioGroupItem value="private" id="private" />
                 <Lock className="h-4 w-4 text-muted-foreground" />
                <Label htmlFor="private" className="font-medium cursor-pointer">Private</Label>
                 <p className="text-xs text-muted-foreground flex-1 text-right sm:text-left sm:flex-none">Only invited users</p>
              </div>
            </RadioGroup>
             <p className="text-sm text-muted-foreground">Control who can join your stage.</p>
          </div>

          <Button
            onClick={handleCreateStage}
            className="w-full py-3 text-lg bg-primary hover:bg-primary/90 text-primary-foreground"
            disabled={maxCapacity === '' || maxCapacity <= 0}
          >
            Create Stage
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}

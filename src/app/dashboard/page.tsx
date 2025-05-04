"use client";

import React, { useState } from 'react'; // Import useState
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { PlusCircle, LogIn } from 'lucide-react';
import { useRouter } from 'next/navigation'; // Use next/navigation for App Router
import JoinStageModal from '@/components/dashboard/join-stage-modal'; // Import the modal
import { Header } from '@/components/header'; // Import the Header component

export default function DashboardPage() {
  const router = useRouter();
  const [isJoinModalOpen, setIsJoinModalOpen] = useState(false); // State for modal visibility

  const handleCreate = () => {
    // Navigate to the create stage page
    router.push('/create-stage');
  };

  const handleJoin = () => {
    // Open the join stage modal
    setIsJoinModalOpen(true);
    console.log("Join button clicked - opening modal");
  };

  return (
    <>
      <Header />
      <div className="flex min-h-screen items-center justify-center bg-background p-4">
        <Card className="w-full max-w-md shadow-lg">
          <CardHeader className="text-center">
            <CardTitle className="text-2xl font-bold">Welcome to StagePass</CardTitle>
            <CardDescription>What would you like to do?</CardDescription>
          </CardHeader>
          <CardContent className="flex flex-col space-y-4 p-6">
            <Button
              onClick={handleCreate}
              className="w-full justify-center py-6 text-lg bg-primary hover:bg-primary/90 text-primary-foreground"
            >
              <PlusCircle className="mr-2 h-5 w-5" /> Create a Stage
            </Button>
            <Button
              onClick={handleJoin}
              variant="outline"
              className="w-full justify-center py-6 text-lg border-border hover:bg-accent hover:text-accent-foreground"
            >
              <LogIn className="mr-2 h-5 w-5" /> Join a Stage
            </Button>
          </CardContent>
        </Card>

        {/* Render the Join Stage Modal */}
        <JoinStageModal isOpen={isJoinModalOpen} onOpenChange={setIsJoinModalOpen} />
      </div>
    </>
  );
}

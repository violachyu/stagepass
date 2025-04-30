"use client";

import React, { useState } from 'react';
import dynamic from 'next/dynamic';
import { User } from 'lucide-react';
import { Button } from '@/components/ui/button';
import AuthModal from '@/components/auth/auth-modal';
import { Skeleton } from "@/components/ui/skeleton";

// Dynamically import the ThreeScene component to avoid SSR issues with window/document
const ThreeScene = dynamic(() => import('@/components/three/three-scene'), {
  ssr: false,
  loading: () => <Skeleton className="absolute inset-0 bg-muted" />, // Show skeleton while loading
});

export default function Home() {
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);

  return (
    <div className="relative min-h-screen w-full overflow-hidden">
      {/* Container for the Three.js scene */}
      <div className="absolute inset-0 z-0">
        <ThreeScene />
      </div>

      {/* Overlay content */}
      <div className="relative z-10 flex h-screen flex-col">
        {/* Header/Top Right Corner */}
        <header className="flex justify-end p-4">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setIsAuthModalOpen(true)}
            aria-label="Login or Sign Up"
          >
            <User className="h-6 w-6 text-foreground hover:text-accent transition-colors" />
          </Button>
        </header>

        {/* Main content area (can be used for other overlays if needed) */}
        <main className="flex flex-1 items-center justify-center">
          {/* Optionally add centered text or other elements here */}
        </main>
      </div>

      {/* Authentication Modal */}
      <AuthModal isOpen={isAuthModalOpen} onOpenChange={setIsAuthModalOpen} />
    </div>
  );
}

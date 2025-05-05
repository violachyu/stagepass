"use client";

import React from 'react';
import dynamic from 'next/dynamic';
import { Header } from '@/components/header';
import { Skeleton } from "@/components/ui/skeleton";

// Dynamically import the ThreeScene component to avoid SSR issues with window/document
const ThreeScene = dynamic(() => import('@/components/three/three-scene'), {
  ssr: false,
  loading: () => <Skeleton className="absolute inset-0 bg-muted" />, // Show skeleton while loading
});

export default function Home() {
  return (
    <div className="relative min-h-screen w-full overflow-hidden">
      {/* Container for the Three.js scene */}
      <div className="absolute inset-0 z-0">
        <ThreeScene />
      </div>

      {/* Overlay content */}
      <div className="relative z-10 flex h-screen flex-col">
        {/* Header is now a separate component with SignedIn/SignedOut logic */}
        <Header />

        {/* Main content area (can be used for other overlays if needed) */}
        <main className="flex flex-1 items-center justify-center">
          {/* Optionally add centered text or other elements here */}
        </main>
      </div>
    </div>
  );
}

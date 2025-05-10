"use client";

import React from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { LockIcon } from 'lucide-react';

export default function AccessDenied() {
  const router = useRouter();
  
  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-background p-4">
      <div className="w-full max-w-md rounded-lg border border-border bg-card p-6 shadow-lg">
        <div className="mb-6 flex flex-col items-center">
          <div className="mb-4 rounded-full bg-primary/10 p-3">
            <LockIcon className="h-8 w-8 text-primary" />
          </div>
          <h1 className="text-center text-2xl font-bold text-foreground">Access Denied</h1>
          <p className="mt-2 text-center text-muted-foreground">
            You need to sign in to access the app
          </p>
        </div>
        
        <Button 
          onClick={() => router.push('/')}
          className="w-full bg-primary text-primary-foreground hover:bg-primary/90"
        >
          Go to Home Page
        </Button>
      </div>
    </div>
  );
} 
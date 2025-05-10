"use client"

import Link from "next/link"
import { User } from "lucide-react"
import { Button } from "@/components/ui/button"
import { usePathname } from "next/navigation"
import { UserButton, SignedIn, SignedOut } from "@daveyplate/better-auth-ui"
import { cn } from "@/lib/utils"
import { useState } from "react"
import AuthModal from "@/components/auth/auth-modal"

export function Header() {
  const pathname = usePathname()
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false)

  return (
    <header className="sticky top-0 z-50 px-4 py-3 border-b bg-background/60 backdrop-blur">
      <div className="container mx-auto flex items-center justify-between">
        <div className="flex items-center gap-4">
          <span className="flex items-center gap-2 font-bold text-xl">
            StagePass
          </span>
          
          
        </div>

        {/* Auth Section */}
        <div>
          <SignedIn>
            <UserButton />
          </SignedIn>
          <SignedOut>
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setIsAuthModalOpen(true)}
              aria-label="Login or Sign Up"
            >
              <User className="h-5 w-5 text-foreground hover:text-accent transition-colors" />
            </Button>
          </SignedOut>
        </div>
      </div>
      
      {/* Auth Modal */}
      <AuthModal isOpen={isAuthModalOpen} onOpenChange={setIsAuthModalOpen} />
    </header>
  )
} 
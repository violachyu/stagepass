"use client"

import { authClient } from "@/lib/auth-client"

export default function TestAuth() {
  return (
    <div>
      <button onClick={() => authClient.signIn.social({ provider: "google" })}>
        Test Google Sign In
      </button>
    </div>
  )
} 
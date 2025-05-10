"use client"

import { AuthCard } from "@daveyplate/better-auth-ui"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { useEffect } from "react"

import { cn } from "@/lib/utils"

export function AuthView({ pathname }: { pathname: string }) {
    const router = useRouter()

    useEffect(() => {
        // For sign-in and sign-up, redirect to the home page to use custom modal
        if (pathname === "sign-in" || pathname === "sign-up") {
            router.push("/")
            return
        }
        
        router.refresh()
    }, [router, pathname])

    // Don't render our own UI for sign-in/sign-up as we use custom modal
    if (pathname === "sign-in" || pathname === "sign-up") {
        return null
    }

    return (
        <main className="flex grow flex-col items-center justify-center gap-3 p-4">
            <AuthCard pathname={pathname} />

            <p
                className={cn(
                    ["callback", "settings", "sign-out"].includes(pathname) && "hidden",
                    "text-muted-foreground text-xs"
                )}
            >
                Powered by{" "}
                <Link
                    className="text-primary underline"
                    href="https://better-auth.com"
                    target="_blank"
                >
                    better-auth.
                </Link>
            </p>
        </main>
    )
} 
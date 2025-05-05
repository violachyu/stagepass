import { type NextRequest, NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import { headers } from "next/headers"

export async function middleware(request: NextRequest) {
    const path = request.nextUrl.pathname

    const session = await auth.api.getSession({
        headers: await headers()
    })

    // Protected routes that require authentication
    if ((path === "/create-stage" || path === "/dashboard" || path === "/live-room") && !session) {
        return NextResponse.redirect(new URL("/", request.url))
    }

    // Admin routes (if you have any)
    if (path === "/admin") {
        if (!session) {
            return NextResponse.redirect(new URL("/", request.url))
        }

        if (session.user.role !== "admin") {
            return NextResponse.redirect(new URL("/", request.url))
        }
    }

    return NextResponse.next()
}

export const config = {
    runtime: "nodejs",
    matcher: ["/create-stage", "/dashboard", "/live-room", "/admin"]
} 
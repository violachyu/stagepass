import { betterAuth } from "better-auth"
import { drizzleAdapter } from "better-auth/adapters/drizzle"
import { admin } from "better-auth/plugins"
import { nextCookies } from "better-auth/next-js"

// Import from the correct location - database directory at project root
import { db } from "../../database/db"
import * as schema from "../../database/schema"

export const auth = betterAuth({
    database: drizzleAdapter(db, {
        provider: "pg",
        usePlural: true,
        schema
    }),
    session: {
        cookieCache: {
            enabled: true,
            // Cache duration in seconds.
            // set to 5 mins for development; 
            // could be a week or longer in production
            maxAge: 5 * 60 
        }
    },
    emailAndPassword: {
        enabled: true
    },
    plugins: [
        admin(),
        nextCookies() // keep this last in `plugins` array
    ]
}) 
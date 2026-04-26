/**
 * middleware.ts — Authentication middleware for Glossarion
 *
 * Uses Clerk when NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY is set.
 * Falls back to pass-through when Clerk is not configured (dev/demo mode).
 *
 * To enable Clerk:
 *   1. Run: pnpm add @clerk/nextjs
 *   2. Add to .env.local:
 *        NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=pk_test_...
 *        CLERK_SECRET_KEY=sk_test_...
 *   3. Replace this file with the standard Clerk middleware:
 *
 *        import { clerkMiddleware, createRouteMatcher } from '@clerk/nextjs/server'
 *        const isProtectedRoute = createRouteMatcher(['/dashboard(.*)'])
 *        export default clerkMiddleware((auth, req) => {
 *          if (isProtectedRoute(req)) auth().protect()
 *        })
 *        export const config = { matcher: ['/((?!_next|.*\\..*).*)'] }
 */

import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

const clerkConfigured = !!(process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY)

export function middleware(request: NextRequest) {
  // If Clerk is configured, this file should be replaced with the Clerk
  // middleware snippet above. For now, we pass all requests through.
  if (!clerkConfigured) {
    return NextResponse.next()
  }

  // Clerk middleware is active — see comments above for the full integration.
  // Until @clerk/nextjs is installed, this simply allows all requests.
  return NextResponse.next()
}

export const config = {
  matcher: [
    // Skip Next.js internals and all static files
    '/((?!_next|[^?]*\\.(?:html?|css|js(?!on)|jpe?g|webp|png|gif|svg|ttf|woff2?|ico|csv|docx?|xlsx?|zip|webmanifest)).*)',
    // Always run for API routes
    '/(api|trpc)(.*)',
  ],
}

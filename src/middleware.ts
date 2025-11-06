import { NextResponse, type NextRequest } from 'next/server'
import { updateSession } from '@/lib/supabase/middleware'

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl

  // Public routes (no auth required) - SKIP Supabase entirely
  const publicRoutes = ['/', '/login', '/signup', '/onboarding', '/quote']
  const isPublicRoute = publicRoutes.some(route =>
    pathname === route || pathname.startsWith(`${route}/`)
  )

  // For public routes: Don't touch Supabase, just continue
  if (isPublicRoute) {
    return NextResponse.next()
  }

  // For protected routes: Update session and check auth
  try {
    return await updateSession(request)
  } catch (error) {
    console.error('[Middleware] Error updating session:', error)

    // If Supabase fails, redirect to login
    const url = request.nextUrl.clone()
    url.pathname = '/login'
    url.searchParams.set('error', 'session_error')
    return NextResponse.redirect(url)
  }
}

export const config = {
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
}

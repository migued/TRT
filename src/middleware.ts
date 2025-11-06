import { NextResponse, type NextRequest } from 'next/server'
import { updateSession } from '@/lib/supabase/middleware'
import { createServerClient } from '@supabase/ssr'

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl
  const hostname = request.headers.get('host') || ''

  // Public routes (no auth required)
  const publicRoutes = ['/', '/login', '/signup', '/quote']
  const isPublicRoute = publicRoutes.some(route =>
    pathname === route || pathname.startsWith(`${route}/`)
  )

  // Update Supabase session
  let response = await updateSession(request)

  // Get user session
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        get(name: string) {
          return request.cookies.get(name)?.value
        },
        set(name: string, value: string, options: any) {
          // Cookie handling
        },
        remove(name: string, options: any) {
          // Cookie removal
        },
      },
    }
  )

  const { data: { user } } = await supabase.auth.getUser()

  // Redirect logic
  if (!user && !isPublicRoute) {
    // Not authenticated, redirect to login
    const url = request.nextUrl.clone()
    url.pathname = '/login'
    url.searchParams.set('redirectTo', pathname)
    return NextResponse.redirect(url)
  }

  if (user && (pathname === '/login' || pathname === '/signup')) {
    // Already authenticated, redirect to app
    // Check if user has a workspace
    const { data: profile } = await supabase
      .from('profiles')
      .select('workspace_id, workspaces(slug)')
      .eq('id', user.id)
      .single()

    if (profile?.workspaces) {
      const workspaceSlug = (profile.workspaces as any).slug
      return NextResponse.redirect(new URL(`/${workspaceSlug}`, request.url))
    } else {
      // No workspace, redirect to onboarding
      return NextResponse.redirect(new URL('/onboarding', request.url))
    }
  }

  // Workspace detection for Pro/Enterprise plans
  // TODO: Implement subdomain/custom domain detection
  // For now, everything goes through path-based routing

  return response
}

export const config = {
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
}

import { NextResponse } from 'next/server'
import { jwtVerify } from 'jose'
import type { NextRequest } from 'next/server'

export async function proxy(req: NextRequest) {
  const url = req.nextUrl
  const host = req.headers.get('host') || ''
  const expectedHost = (process.env.NEXT_PUBLIC_PRIMARY_DOMAIN || 'brightlinephotography.co').toLowerCase()

  // Enforce canonical host for all non-local requests
  const isLocal = host.includes('localhost') || host.startsWith('127.0.0.1')
  const isCanonical = host === expectedHost || host === `www.${expectedHost}`
  if (!isLocal && host && !isCanonical) {
    url.hostname = expectedHost
    return NextResponse.redirect(url)
  }

  // Basic auth for admin area, but allowlist specific routes
  if (url.pathname.startsWith('/admin')) {
    const allowlist = ['/admin/login']
    const isAllowlisted = allowlist.some((p) => url.pathname === p || url.pathname.startsWith(p + '/'))
    if (isAllowlisted) return NextResponse.next()

    const cookie = req.cookies.get('admin_session')?.value
    const secret = process.env.ADMIN_SESSION_SECRET || ''
    const redirectToLogin = () => {
      const next = encodeURIComponent(url.pathname + (url.search || ''))
      url.pathname = '/admin/login'
      url.search = next ? `?next=${next}` : ''
      return NextResponse.redirect(url)
    }

    if (!cookie || !secret) {
      return redirectToLogin()
    }
    try {
      const key = new TextEncoder().encode(secret)
      await jwtVerify(cookie, key)
      return NextResponse.next()
    } catch {
      return redirectToLogin()
    }
  }

  return NextResponse.next()
}

export const config = {
  matcher: ['/:path*'],
}

import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

export function proxy(req: NextRequest) {
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

  // Basic auth for admin area
  if (url.pathname.startsWith('/admin')) {
    const header = req.headers.get('authorization') || ''
    const expectedUser = process.env.ADMIN_USER || 'admin'
    const expectedPass = process.env.ADMIN_PASS || 'admin'
    if (header.startsWith('Basic ')) {
      try {
        const base64 = header.slice(6)
        const [user, pass] = Buffer.from(base64, 'base64').toString().split(':')
        if (user === expectedUser && pass === expectedPass) {
          return NextResponse.next()
        }
      } catch {
        // fall through
      }
    }
    const res = new NextResponse('Authentication required', { status: 401 })
    res.headers.set('WWW-Authenticate', 'Basic realm="Admin Area"')
    return res
  }

  return NextResponse.next()
}

export const config = {
  matcher: ['/:path*'],
}


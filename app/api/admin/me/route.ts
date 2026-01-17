import { NextResponse } from 'next/server'
import { jwtVerify } from 'jose'

export const runtime = 'nodejs'

export async function GET(req: Request) {
  const secret = process.env.ADMIN_SESSION_SECRET || ''
  if (!secret) return NextResponse.json({ error: 'No secret' }, { status: 500 })
  const cookie = (req as any).headers?.get('cookie') as string | null
  const m = cookie ? cookie.match(/(?:^|; )admin_session=([^;]+)/) : null
  const token = m ? decodeURIComponent(m[1]) : null
  if (!token) return NextResponse.json({ error: 'Not authenticated' }, { status: 401 })
  try {
    const { payload } = await jwtVerify(token, new TextEncoder().encode(secret))
    return NextResponse.json({ username: (payload as any).username || null, sub: payload.sub })
  } catch {
    return NextResponse.json({ error: 'Invalid session' }, { status: 401 })
  }
}


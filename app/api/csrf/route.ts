import { NextResponse } from 'next/server'

export const runtime = 'nodejs'

export async function GET() {
  const token = Math.random().toString(36).slice(2) + Math.random().toString(36).slice(2)
  const res = NextResponse.json({ token })
  res.headers.append('Set-Cookie', `csrf_token=${encodeURIComponent(token)}; Path=/; HttpOnly; SameSite=Lax; Secure`)
  return res
}


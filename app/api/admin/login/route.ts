import { NextResponse } from 'next/server'
import { SignJWT } from 'jose'
import { prisma } from '@/lib/prisma'
import { compare } from 'bcryptjs'
import { clientKey, rateLimit, verifyCsrf } from '@/lib/security'

export const runtime = 'nodejs'

function getSecret() {
  const secret = process.env.ADMIN_SESSION_SECRET || ''
  if (!secret) throw new Error('ADMIN_SESSION_SECRET is not set')
  return new TextEncoder().encode(secret)
}

export async function POST(req: Request) {
  const key = clientKey(req)
  const rl = rateLimit(`login:${key}`, 5, 60_000)
  if (!rl.ok) return NextResponse.json({ error: 'Too many attempts. Try again later.' }, { status: 429 })
  if (!verifyCsrf(req)) return NextResponse.json({ error: 'Invalid CSRF token' }, { status: 403 })
  const { username, password } = await req.json().catch(() => ({ username: '', password: '' }))
  if (!username || !password) return NextResponse.json({ error: 'Missing credentials' }, { status: 400 })
  const user = await prisma.user.findUnique({ where: { username } })
  if (!user) return NextResponse.json({ error: 'Invalid credentials' }, { status: 401 })
  const ok = await compare(password, user.passwordHash)
  if (!ok) return NextResponse.json({ error: 'Invalid credentials' }, { status: 401 })

  const token = await new SignJWT({ sub: user.id, username: user.username, role: 'admin' })
    .setProtectedHeader({ alg: 'HS256' })
    .setIssuedAt()
    .setExpirationTime('7d')
    .sign(getSecret())

  const res = NextResponse.json({ ok: true })
  res.headers.append(
    'Set-Cookie',
    `admin_session=${token}; Path=/; HttpOnly; SameSite=Lax; Max-Age=${60 * 60 * 24 * 7}; Secure`
  )
  return res
}

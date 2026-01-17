import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { hash } from 'bcryptjs'
import { clientKey, rateLimit, verifyCsrf } from '@/lib/security'

export const runtime = 'nodejs'

type Ctx = { params: Promise<{ id: string }> }

export async function DELETE(req: Request, { params }: Ctx) {
  const key = clientKey(req)
  const rl = rateLimit(`userdel:${key}`, 10, 60_000)
  if (!rl.ok) return NextResponse.json({ error: 'Rate limit exceeded' }, { status: 429 })
  if (!verifyCsrf(req)) return NextResponse.json({ error: 'Invalid CSRF token' }, { status: 403 })
  const { id } = await params
  try {
    await prisma.user.delete({ where: { id } })
    return NextResponse.json({ ok: true })
  } catch (e: any) {
    return NextResponse.json({ error: e?.message || 'Failed to delete user' }, { status: 400 })
  }
}

export async function PATCH(req: Request, { params }: Ctx) {
  const key = clientKey(req)
  const rl = rateLimit(`userpw:${key}`, 10, 60_000)
  if (!rl.ok) return NextResponse.json({ error: 'Rate limit exceeded' }, { status: 429 })
  if (!verifyCsrf(req)) return NextResponse.json({ error: 'Invalid CSRF token' }, { status: 403 })
  const { id } = await params
  const { password } = await req.json().catch(() => ({ password: '' }))
  if (!password) return NextResponse.json({ error: 'Missing password' }, { status: 400 })
  const passwordHash = await hash(password, 12)
  try {
    await prisma.user.update({ where: { id }, data: { passwordHash } })
    return NextResponse.json({ ok: true })
  } catch (e: any) {
    return NextResponse.json({ error: e?.message || 'Failed to update user' }, { status: 400 })
  }
}

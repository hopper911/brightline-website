import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { hash } from 'bcryptjs'

export const runtime = 'nodejs'

export async function POST(req: Request) {
  const { username, password } = await req.json().catch(() => ({ username: '', password: '' }))
  if (!username || !password) return NextResponse.json({ error: 'Missing fields' }, { status: 400 })
  const passwordHash = await hash(password, 12)
  try {
    const user = await prisma.user.create({ data: { username, passwordHash }, select: { id: true, username: true } })
    return NextResponse.json({ user })
  } catch (e: any) {
    if (e?.code === 'P2002') return NextResponse.json({ error: 'Username already exists' }, { status: 409 })
    return NextResponse.json({ error: 'Failed to register' }, { status: 500 })
  }
}


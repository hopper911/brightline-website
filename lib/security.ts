import { NextRequest, NextResponse } from 'next/server'

const globalBucket = global as unknown as {
  __rl?: Map<string, number[]>
}

function bucket() {
  if (!globalBucket.__rl) globalBucket.__rl = new Map()
  return globalBucket.__rl
}

export function clientKey(req: Request | NextRequest): string {
  const h = (req as any).headers as Headers
  const ip = h.get('x-forwarded-for') || h.get('x-real-ip') || ''
  const ua = h.get('user-agent') || ''
  return `${ip}|${ua}`
}

export function rateLimit(key: string, limit: number, windowMs: number): { ok: boolean; remaining: number } {
  const now = Date.now()
  const b = bucket()
  const arr = b.get(key) || []
  const recent = arr.filter((t) => now - t < windowMs)
  if (recent.length >= limit) {
    b.set(key, recent)
    return { ok: false, remaining: 0 }
  }
  recent.push(now)
  b.set(key, recent)
  return { ok: true, remaining: Math.max(0, limit - recent.length) }
}

export function getCsrfFromCookie(req: Request | NextRequest): string | null {
  const cookie = (req as any).headers?.get('cookie') as string | null
  if (!cookie) return null
  const m = cookie.match(/(?:^|; )csrf_token=([^;]+)/)
  return m ? decodeURIComponent(m[1]) : null
}

export function verifyCsrf(req: Request | NextRequest): boolean {
  const header = (req as any).headers?.get('x-csrf-token') || ''
  const cookie = getCsrfFromCookie(req) || ''
  return header && cookie && header === cookie
}


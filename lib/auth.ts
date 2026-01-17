import { cookies } from 'next/headers'
import { jwtVerify } from 'jose'

export async function requireAdmin(): Promise<{ userId: string; username?: string } | null> {
  const cookieStore = await cookies()
  const token = cookieStore.get('admin_session')?.value
  const secret = process.env.ADMIN_SESSION_SECRET || ''
  if (!token || !secret) return null
  try {
    const key = new TextEncoder().encode(secret)
    const { payload } = await jwtVerify(token, key)
    const sub = (payload.sub as string) || ''
    if (!sub) return null
    return { userId: sub, username: (payload as any).username as string | undefined }
  } catch {
    return null
  }
}

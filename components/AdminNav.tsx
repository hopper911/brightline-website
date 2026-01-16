'use client'

import Link from 'next/link'
import { useEffect, useState } from 'react'

export default function AdminNav() {
  const [ok, setOk] = useState<boolean | null>(null)

  useEffect(() => {
    let mounted = true
    const run = async () => {
      try {
        const res = await fetch('/api/health', { cache: 'no-store' })
        const j = await res.json()
        if (!mounted) return
        setOk(Boolean(j?.ok))
      } catch {
        if (!mounted) return
        setOk(false)
      }
    }
    run()
    const id = setInterval(run, 30000)
    return () => {
      mounted = false
      clearInterval(id)
    }
  }, [])

  const dotColor = ok == null ? 'bg-yellow-400' : ok ? 'bg-emerald-400' : 'bg-red-500'
  const dotTitle = ok == null ? 'Checking…' : ok ? 'Healthy' : 'Unhealthy'

  return (
    <header className="border-b border-white/10">
      <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-4">
        <Link href="/" className="text-sm uppercase tracking-[0.25em] opacity-80 hover:opacity-100">
          Bright Line — Admin
        </Link>
        <nav className="flex items-center gap-4 text-xs uppercase tracking-widest opacity-80">
          <Link href="/admin/media" className="hover:opacity-100">Media</Link>
          <Link href="/admin/status" className="hover:opacity-100 flex items-center gap-2">
            <span>Status</span>
            <span title={dotTitle} className={`inline-block h-2.5 w-2.5 rounded-full ${dotColor}`} />
          </Link>
        </nav>
      </div>
    </header>
  )
}


'use client'

import { useEffect, useState } from 'react'
import AdminNav from '@/components/AdminNav'

type Health = { ok: boolean; error?: string }

export default function AdminStatusPage() {
  const [health, setHealth] = useState<Health | null>(null)
  const [latencyMs, setLatencyMs] = useState<number | null>(null)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const run = async () => {
      try {
        const start = performance.now()
        const res = await fetch('/api/health', { cache: 'no-store' })
        const json = (await res.json()) as Health
        setLatencyMs(Math.round(performance.now() - start))
        setHealth(json)
        if (!res.ok || !json.ok) setError(json.error || 'Unhealthy')
      } catch (e: any) {
        setError(e?.message || 'Failed to fetch health')
      }
    }
    run()
  }, [])

  return (
    <div>
      <AdminNav />
      <div className="mx-auto max-w-3xl px-4 py-8">
      <h1 className="text-2xl font-semibold tracking-wide">System Status</h1>

      <div className="mt-6 grid gap-4">
        <div className="rounded border border-white/10 p-4">
          <div className="text-sm uppercase tracking-widest opacity-70">Database</div>
          <div className="mt-2 text-lg">
            {health == null ? 'Checking…' : health.ok ? 'OK' : 'ERROR'}
          </div>
          <div className="mt-1 text-xs opacity-70">
            Latency: {latencyMs != null ? `${latencyMs} ms` : '—'}
          </div>
          {error ? <div className="mt-2 text-sm text-red-400">{error}</div> : null}
        </div>

        <div className="rounded border border-white/10 p-4">
          <div className="text-sm uppercase tracking-widest opacity-70">Environment</div>
          <div className="mt-2 text-xs opacity-80">
            <div>Site URL: {process.env.NEXT_PUBLIC_SITE_URL || 'not set'}</div>
            <div>Primary Domain: {process.env.NEXT_PUBLIC_PRIMARY_DOMAIN || 'not set'}</div>
          </div>
        </div>
      </div>
      </div>
    </div>
  )
}

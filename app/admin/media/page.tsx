'use client'

import { useEffect, useState } from 'react'
import AdminNav from '@/components/AdminNav'

type MediaKind = 'IMAGE' | 'VIDEO'

type MediaForm = {
  kind: MediaKind
  title: string
  url: string
  thumbnailUrl?: string
  subtitle?: string
  description?: string
  width?: number
  height?: number
  durationSec?: number
  altText?: string
  aspectRatio?: string
  featured?: boolean
  sortOrder?: number
  source?: string
  tags?: string
}

export default function AdminMediaPage() {
  const [items, setItems] = useState<any[]>([])
  const [editing, setEditing] = useState<any | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [message, setMessage] = useState<string | null>(null)

  const [form, setForm] = useState<MediaForm>({
    kind: 'IMAGE',
    title: '',
    url: '',
    featured: false,
    sortOrder: 0,
    tags: '',
  })

  async function load() {
    setLoading(true)
    try {
      const r = await fetch('/api/media')
      const j = await r.json()
      setItems(j.items ?? [])
    } catch (e: any) {
      setError(e?.message || 'Failed to load media')
    } finally {
      setLoading(false)
    }
  }

  async function onDelete(id: string) {
    if (!confirm('Delete this item?')) return
    try {
      const r = await fetch(`/api/media/${id}`, { method: 'DELETE' })
      const j = await r.json()
      if (!r.ok || !j.ok) throw new Error(j?.error || 'Delete failed')
      setMessage('Deleted')
      load()
    } catch (e: any) {
      setError(e?.message || 'Delete failed')
    }
  }

  function startEdit(item: any) {
    setEditing(item)
    setForm({
      kind: item.kind,
      title: item.title,
      url: item.url,
      thumbnailUrl: item.thumbnailUrl || '',
      subtitle: item.subtitle || '',
      description: item.description || '',
      width: item.width || undefined,
      height: item.height || undefined,
      durationSec: item.durationSec || undefined,
      altText: item.altText || '',
      aspectRatio: item.aspectRatio || '',
      featured: item.featured || false,
      sortOrder: item.sortOrder || 0,
      source: item.source || '',
      tags: (item.tags || []).join(', '),
    })
  }

  useEffect(() => {
    load()
  }, [])

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError(null)
    setMessage(null)

    const payload: any = {
      kind: form.kind,
      title: form.title,
      url: form.url,
      thumbnailUrl: form.thumbnailUrl || undefined,
      subtitle: form.subtitle || undefined,
      description: form.description || undefined,
      width: form.width ? Number(form.width) : undefined,
      height: form.height ? Number(form.height) : undefined,
      durationSec: form.durationSec ? Number(form.durationSec) : undefined,
      altText: form.altText || undefined,
      aspectRatio: form.aspectRatio || undefined,
      featured: !!form.featured,
      sortOrder: form.sortOrder ? Number(form.sortOrder) : 0,
      source: form.source || undefined,
      tags: form.tags ? form.tags.split(',').map((t) => t.trim()).filter(Boolean) : [],
    }

    try {
      const r = await fetch(editing ? `/api/media/${editing.id}` : '/api/media', {
        method: editing ? 'PATCH' : 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      })
      const j = await r.json()
      if (!r.ok) throw new Error(j?.error || 'Failed to create media')
      setMessage('Saved successfully')
      setEditing(null)
      setForm((prev) => ({ ...prev, title: '', url: '', thumbnailUrl: '' }))
      load()
    } catch (e: any) {
      setError(e?.message || 'Failed to create media')
    }
  }

  return (
    <div>
      <AdminNav />
      <div className="mx-auto max-w-6xl px-4 py-8">
        <h1 className="text-2xl font-semibold tracking-wide">Admin — Media</h1>

        <form onSubmit={onSubmit} className="mt-6 grid grid-cols-1 gap-4 rounded border border-white/10 p-4 md:grid-cols-2">
          <div>
            <label className="block text-xs uppercase tracking-widest opacity-70">Kind</label>
            <select
              value={form.kind}
              onChange={(e) => setForm({ ...form, kind: e.target.value as MediaKind })}
              className="mt-1 w-full rounded border border-white/20 bg-transparent p-2 text-sm"
            >
              <option value="IMAGE">IMAGE</option>
              <option value="VIDEO">VIDEO</option>
            </select>
          </div>
          <div>
            <label className="block text-xs uppercase tracking-widest opacity-70">Title</label>
            <input
              value={form.title}
              onChange={(e) => setForm({ ...form, title: e.target.value })}
              required
              className="mt-1 w-full rounded border border-white/20 bg-transparent p-2 text-sm"
            />
          </div>
          <div className="md:col-span-2">
            <label className="block text-xs uppercase tracking-widest opacity-70">URL</label>
            <input
              value={form.url}
              onChange={(e) => setForm({ ...form, url: e.target.value })}
              required
              placeholder="/images/piece.jpg or https://..."
              className="mt-1 w-full rounded border border-white/20 bg-transparent p-2 text-sm"
            />
          </div>
          <div>
            <label className="block text-xs uppercase tracking-widest opacity-70">Thumbnail URL</label>
            <input
              value={form.thumbnailUrl || ''}
              onChange={(e) => setForm({ ...form, thumbnailUrl: e.target.value })}
              className="mt-1 w-full rounded border border-white/20 bg-transparent p-2 text-sm"
            />
          </div>
          <div>
            <label className="block text-xs uppercase tracking-widest opacity-70">Subtitle</label>
            <input
              value={form.subtitle || ''}
              onChange={(e) => setForm({ ...form, subtitle: e.target.value })}
              className="mt-1 w-full rounded border border-white/20 bg-transparent p-2 text-sm"
            />
          </div>
          <div className="md:col-span-2">
            <label className="block text-xs uppercase tracking-widest opacity-70">Description</label>
            <textarea
              value={form.description || ''}
              onChange={(e) => setForm({ ...form, description: e.target.value })}
              rows={3}
              className="mt-1 w-full rounded border border-white/20 bg-transparent p-2 text-sm"
            />
          </div>
          <div>
            <label className="block text-xs uppercase tracking-widest opacity-70">Width</label>
            <input
              type="number"
              value={form.width || ''}
              onChange={(e) => setForm({ ...form, width: Number(e.target.value) })}
              className="mt-1 w-full rounded border border-white/20 bg-transparent p-2 text-sm"
            />
          </div>
          <div>
            <label className="block text-xs uppercase tracking-widest opacity-70">Height</label>
            <input
              type="number"
              value={form.height || ''}
              onChange={(e) => setForm({ ...form, height: Number(e.target.value) })}
              className="mt-1 w-full rounded border border-white/20 bg-transparent p-2 text-sm"
            />
          </div>
          <div>
            <label className="block text-xs uppercase tracking-widest opacity-70">Duration (sec)</label>
            <input
              type="number"
              value={form.durationSec || ''}
              onChange={(e) => setForm({ ...form, durationSec: Number(e.target.value) })}
              className="mt-1 w-full rounded border border-white/20 bg-transparent p-2 text-sm"
            />
          </div>
          <div>
            <label className="block text-xs uppercase tracking-widest opacity-70">Alt Text</label>
            <input
              value={form.altText || ''}
              onChange={(e) => setForm({ ...form, altText: e.target.value })}
              className="mt-1 w-full rounded border border-white/20 bg-transparent p-2 text-sm"
            />
          </div>
          <div>
            <label className="block text-xs uppercase tracking-widest opacity-70">Aspect Ratio</label>
            <input
              placeholder="16:9"
              value={form.aspectRatio || ''}
              onChange={(e) => setForm({ ...form, aspectRatio: e.target.value })}
              className="mt-1 w-full rounded border border-white/20 bg-transparent p-2 text-sm"
            />
          </div>
          <div>
            <label className="block text-xs uppercase tracking-widest opacity-70">Featured</label>
            <input
              type="checkbox"
              checked={!!form.featured}
              onChange={(e) => setForm({ ...form, featured: e.target.checked })}
              className="mt-2"
            />
          </div>
          <div>
            <label className="block text-xs uppercase tracking-widest opacity-70">Sort Order</label>
            <input
              type="number"
              value={form.sortOrder || 0}
              onChange={(e) => setForm({ ...form, sortOrder: Number(e.target.value) })}
              className="mt-1 w-full rounded border border-white/20 bg-transparent p-2 text-sm"
            />
          </div>
          <div>
            <label className="block text-xs uppercase tracking-widest opacity-70">Source</label>
            <input
              value={form.source || ''}
              onChange={(e) => setForm({ ...form, source: e.target.value })}
              className="mt-1 w-full rounded border border-white/20 bg-transparent p-2 text-sm"
            />
          </div>
          <div className="md:col-span-2">
            <label className="block text-xs uppercase tracking-widest opacity-70">Tags (comma-separated)</label>
            <input
              placeholder="fashion, food, commercial-real-estate, design"
              value={form.tags || ''}
              onChange={(e) => setForm({ ...form, tags: e.target.value })}
              className="mt-1 w-full rounded border border-white/20 bg-transparent p-2 text-sm"
            />
          </div>

          <div className="md:col-span-2">
            <button
              type="submit"
              disabled={loading}
              className="rounded border border-white/20 px-4 py-2 text-xs uppercase tracking-widest hover:border-white/40 disabled:opacity-50"
            >
              {loading ? 'Saving…' : 'Save'}
            </button>
            {error ? <span className="ml-3 text-red-400">{error}</span> : null}
            {message ? <span className="ml-3 text-green-400">{message}</span> : null}
          </div>
        </form>

        <div className="mt-10">
          <h2 className="mb-3 text-lg font-semibold tracking-wide">Existing Items</h2>
          <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
            {items.map((i) => (
              <div key={i.id} className="rounded border border-white/10 p-3">
                <div className="text-sm font-semibold">{i.title}</div>
                <div className="mt-1 text-xs opacity-70">{i.kind} — {i.subtitle || '—'}</div>
                <div className="mt-1 break-all text-[11px] opacity-60">{i.url}</div>
                {i.tags?.length ? (
                  <div className="mt-1 text-[11px] opacity-70">Tags: {i.tags.join(', ')}</div>
                ) : null}
                <div className="mt-3 flex gap-2 text-xs">
                  <button onClick={() => startEdit(i)} className="rounded border border-white/20 px-2 py-1 hover:border-white/40">Edit</button>
                  <button onClick={() => onDelete(i.id)} className="rounded border border-red-400/40 px-2 py-1 text-red-300 hover:border-red-400">Delete</button>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}

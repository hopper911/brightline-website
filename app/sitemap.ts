import type { MetadataRoute } from 'next'

const routes = ['', '/portfolio', '/portfolio/fashion', '/portfolio/food', '/portfolio/commercial-real-estate', '/portfolio/design']

export default function sitemap(): MetadataRoute.Sitemap {
  const site = (process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000').replace(/\/$/, '')
  const now = new Date()

  return routes.map((path) => ({
    url: `${site}${path || '/'}`,
    lastModified: now,
    changeFrequency: 'weekly',
    priority: path === '' ? 1 : 0.7,
  }))
}


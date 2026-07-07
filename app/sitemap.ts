import type { MetadataRoute } from 'next'
import { listarEdicoes } from '@/lib/edicoes'

const SITE_URL = 'https://noticias.eullerlolato.com'

export default function sitemap(): MetadataRoute.Sitemap {
  const pt = listarEdicoes('pt').map((e) => ({
    url: `${SITE_URL}/edicoes/${e.date}`,
    lastModified: new Date(`${e.date}T09:00:00Z`),
    changeFrequency: 'never' as const,
    priority: 0.7,
  }))
  const en = listarEdicoes('en').map((e) => ({
    url: `${SITE_URL}/en/editions/${e.date}`,
    lastModified: new Date(`${e.date}T09:00:00Z`),
    changeFrequency: 'never' as const,
    priority: 0.7,
  }))

  return [
    { url: SITE_URL, changeFrequency: 'weekly', priority: 1 },
    { url: `${SITE_URL}/en`, changeFrequency: 'weekly', priority: 1 },
    { url: `${SITE_URL}/edicoes`, changeFrequency: 'daily', priority: 0.9 },
    { url: `${SITE_URL}/en/editions`, changeFrequency: 'daily', priority: 0.9 },
    ...pt,
    ...en,
  ]
}

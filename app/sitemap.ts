import type { MetadataRoute } from 'next'
import { listarEdicoes } from '@/lib/edicoes'

const SITE_URL = 'https://noticias.eullerlolato.com'

export default function sitemap(): MetadataRoute.Sitemap {
  const edicoes = listarEdicoes().map((e) => ({
    url: `${SITE_URL}/edicoes/${e.date}`,
    lastModified: new Date(`${e.date}T09:00:00Z`),
    changeFrequency: 'never' as const,
    priority: 0.7,
  }))

  return [
    { url: SITE_URL, changeFrequency: 'weekly', priority: 1 },
    { url: `${SITE_URL}/edicoes`, changeFrequency: 'daily', priority: 0.9 },
    ...edicoes,
  ]
}

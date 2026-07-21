import { listarEdicoes } from '@/lib/edicoes'

const SITE_URL = 'https://noticias.eullerlolato.com'

function escapeXml(s: string) {
  return s
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;')
}

export async function GET() {
  const edicoes = listarEdicoes('pt').slice(0, 30)

  const items = edicoes
    .map((e) => {
      const url = `${SITE_URL}/edicoes/${e.date}`
      const pubDate = new Date(`${e.date}T09:00:00Z`).toUTCString()
      return `
    <item>
      <title>${escapeXml(e.title)}</title>
      <link>${url}</link>
      <guid isPermaLink="true">${url}</guid>
      <pubDate>${pubDate}</pubDate>
      <description>${escapeXml(e.description)}</description>
    </item>`
    })
    .join('')

  const xml = `<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0" xmlns:atom="http://www.w3.org/2005/Atom">
  <channel>
    <title>Cripto News</title>
    <link>${SITE_URL}</link>
    <description>Análise diária do mercado cripto — Bitcoin, Ethereum e altcoins, todo dia às 06h.</description>
    <language>pt-BR</language>
    <atom:link href="${SITE_URL}/rss.xml" rel="self" type="application/rss+xml" />${items}
  </channel>
</rss>`

  return new Response(xml, {
    headers: { 'Content-Type': 'application/rss+xml; charset=utf-8' },
  })
}

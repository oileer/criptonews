import type { Metadata } from 'next'
import Link from 'next/link'
import { notFound } from 'next/navigation'
import Nav from '../../components/Nav'
import CtaFinal from '../../components/CtaFinal'
import { listarEdicoes, buscarEdicao, formatarData } from '@/lib/edicoes'

const SITE_URL = 'https://noticias.eullerlolato.com'

export function generateStaticParams() {
  return listarEdicoes().map((e) => ({ data: e.date }))
}

export async function generateMetadata({ params }: { params: Promise<{ data: string }> }): Promise<Metadata> {
  const { data } = await params
  const edicao = buscarEdicao(data)
  if (!edicao) return {}
  return {
    title: edicao.title,
    description: edicao.description,
    alternates: { canonical: `/edicoes/${edicao.date}` },
    openGraph: {
      type: 'article',
      title: edicao.title,
      description: edicao.description,
      publishedTime: `${edicao.date}T09:00:00Z`,
      url: `${SITE_URL}/edicoes/${edicao.date}`,
    },
  }
}

export default async function EdicaoPage({ params }: { params: Promise<{ data: string }> }) {
  const { data } = await params
  const edicao = buscarEdicao(data)
  if (!edicao) notFound()

  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'NewsArticle',
    headline: edicao.title,
    description: edicao.description,
    datePublished: `${edicao.date}T09:00:00Z`,
    dateModified: `${edicao.date}T09:00:00Z`,
    inLanguage: 'pt-BR',
    author: { '@type': 'Organization', name: 'Cripto News', url: SITE_URL },
    publisher: { '@type': 'Organization', name: 'Cripto News', url: SITE_URL },
    mainEntityOfPage: `${SITE_URL}/edicoes/${edicao.date}`,
  }

  return (
    <main style={{ background: 'var(--bg)', minHeight: '100vh' }}>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />
      <Nav />
      <article style={{ maxWidth: 720, margin: '0 auto', padding: '140px 24px 40px' }}>
        <Link href="/edicoes" style={{ fontSize: 14, color: 'var(--text-muted)', textDecoration: 'none' }}>
          ← todas as edições
        </Link>
        <p className="eyebrow" style={{ margin: '32px 0 12px' }}>edição de {formatarData(edicao.date)}</p>
        <h1 style={{
          fontSize: 'clamp(28px, 4.5vw, 44px)',
          fontWeight: 700,
          letterSpacing: '-0.02em',
          lineHeight: 1.15,
          color: 'var(--text-primary)',
          marginBottom: 32,
        }}>
          {edicao.title}
        </h1>
        <div
          className="edicao-conteudo"
          style={{ fontSize: 17, lineHeight: 1.8, color: 'var(--text-secondary)' }}
          dangerouslySetInnerHTML={{ __html: edicao.html }}
        />
      </article>
      <CtaFinal />
    </main>
  )
}

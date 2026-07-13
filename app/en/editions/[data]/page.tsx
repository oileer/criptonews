import type { Metadata } from 'next'
import Link from 'next/link'
import { notFound } from 'next/navigation'
import Nav from '../../../components/Nav'
import PartnerCta from '../../../components/PartnerCta'
import CtaFinal from '../../../components/CtaFinal'
import { listarEdicoes, buscarEdicao, formatarData } from '@/lib/edicoes'

const SITE_URL = 'https://noticias.eullerlolato.com'

export function generateStaticParams() {
  return listarEdicoes('en').map((e) => ({ data: e.date }))
}

export async function generateMetadata({ params }: { params: Promise<{ data: string }> }): Promise<Metadata> {
  const { data } = await params
  const edicao = buscarEdicao(data, 'en')
  if (!edicao) return {}
  return {
    title: edicao.title,
    description: edicao.description,
    alternates: {
      canonical: `/en/editions/${edicao.date}`,
      languages: { 'pt-BR': `/edicoes/${edicao.date}`, en: `/en/editions/${edicao.date}` },
    },
    openGraph: {
      type: 'article',
      locale: 'en_US',
      title: edicao.title,
      description: edicao.description,
      publishedTime: `${edicao.date}T09:00:00Z`,
      url: `${SITE_URL}/en/editions/${edicao.date}`,
    },
  }
}

export default async function EditionPage({ params }: { params: Promise<{ data: string }> }) {
  const { data } = await params
  const edicao = buscarEdicao(data, 'en')
  if (!edicao) notFound()

  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'NewsArticle',
    headline: edicao.title,
    description: edicao.description,
    datePublished: `${edicao.date}T09:00:00Z`,
    dateModified: `${edicao.date}T09:00:00Z`,
    inLanguage: 'en-US',
    author: { '@type': 'Organization', name: 'Crypto News', url: `${SITE_URL}/en` },
    publisher: { '@type': 'Organization', name: 'Crypto News', url: `${SITE_URL}/en` },
    mainEntityOfPage: `${SITE_URL}/en/editions/${edicao.date}`,
  }

  return (
    <main style={{ background: 'var(--bg)', minHeight: '100vh' }}>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />
      <Nav lang="en" />
      <article style={{ maxWidth: 720, margin: '0 auto', padding: '140px 24px 40px' }}>
        <Link href="/en/editions" style={{ fontSize: 14, color: 'var(--text-muted)', textDecoration: 'none' }}>
          ← all editions
        </Link>
        <p className="eyebrow" style={{ margin: '32px 0 12px' }}>edition of {formatarData(edicao.date, 'en')}</p>
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
      <PartnerCta lang="en" />
      <CtaFinal lang="en" />
    </main>
  )
}

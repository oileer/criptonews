import type { Metadata } from 'next'
import Link from 'next/link'
import { notFound } from 'next/navigation'
import Nav from '../components/Nav'
import PartnerCta from '../components/PartnerCta'
import CtaFinal from '../components/CtaFinal'
import PrecoAtivo from '../components/PrecoAtivo'
import Termometro from '../components/Termometro'
import { listarEdicoes, formatarData } from '@/lib/edicoes'

const SITE_URL = 'https://noticias.eullerlolato.com'

// Só os top ativos — qualidade > volume. 50 páginas programáticas rasas
// penaliza SEO; BTC/ETH são as únicas com volume de busca que justifica.
const ATIVOS: Record<string, { par: string; nome: string; nomeFemino?: boolean }> = {
  bitcoin: { par: 'BTCUSDT', nome: 'Bitcoin' },
  ethereum: { par: 'ETHUSDT', nome: 'Ethereum' },
}

export function generateStaticParams() {
  return Object.keys(ATIVOS).map((ativo) => ({ ativo: `${ativo}-hoje` }))
}

function resolverSlug(slugCompleto: string) {
  const chave = slugCompleto.replace(/-hoje$/, '')
  return ATIVOS[chave] ? { chave, ...ATIVOS[chave] } : null
}

export async function generateMetadata({ params }: { params: Promise<{ ativo: string }> }): Promise<Metadata> {
  const { ativo } = await params
  const dados = resolverSlug(ativo)
  if (!dados) return {}
  const titulo = `${dados.nome} Hoje — Preço ao Vivo, Termômetro e Análise`
  const descricao = `Preço do ${dados.nome} agora, Fear & Greed atualizado e a leitura do dia do mercado cripto. Dados ao vivo, atualizados a cada 15 minutos.`
  return {
    title: titulo,
    description: descricao,
    alternates: { canonical: `/${dados.chave}-hoje` },
    openGraph: { type: 'website', title: titulo, description: descricao, url: `${SITE_URL}/${dados.chave}-hoje` },
  }
}

export default async function AtivoHojePage({ params }: { params: Promise<{ ativo: string }> }) {
  const { ativo } = await params
  const dados = resolverSlug(ativo)
  if (!dados) notFound()

  const [edicaoHoje] = listarEdicoes('pt')
  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'FinancialProduct',
    name: `${dados.nome} (${dados.par.replace('USDT', '')})`,
    url: `${SITE_URL}/${dados.chave}-hoje`,
    provider: { '@type': 'Organization', name: 'Cripto News', url: SITE_URL },
  }

  return (
    <main style={{ background: 'var(--bg)', minHeight: '100vh' }}>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />
      <Nav />
      <article style={{ maxWidth: 720, margin: '0 auto', padding: '160px 24px 40px' }}>
        <p className="eyebrow" style={{ marginBottom: 12, textAlign: 'center' }}>preço ao vivo · atualizado a cada 15min</p>
        <h1
          style={{
            fontSize: 'clamp(28px, 4.5vw, 44px)',
            fontWeight: 700,
            letterSpacing: '-0.02em',
            lineHeight: 1.15,
            textAlign: 'center',
            color: 'var(--text-primary)',
            marginBottom: 40,
          }}
        >
          {dados.nome} hoje
        </h1>

        <PrecoAtivo par={dados.par} />
        <Termometro />

        {edicaoHoje && (
          <div style={{ marginTop: 48 }}>
            <p className="eyebrow" style={{ marginBottom: 12 }}>a leitura do mercado hoje</p>
            <h2
              style={{
                fontSize: 'clamp(20px, 3vw, 26px)',
                fontWeight: 700,
                letterSpacing: '-0.01em',
                color: 'var(--text-primary)',
                marginBottom: 16,
              }}
            >
              {edicaoHoje.title}
            </h2>
            <p style={{ fontSize: 16, lineHeight: 1.7, color: 'var(--text-secondary)', marginBottom: 20 }}>
              {edicaoHoje.description}
            </p>
            <Link
              href={`/edicoes/${edicaoHoje.date}`}
              style={{ fontSize: 14, fontWeight: 600, color: 'var(--gold)' }}
              className="gold-text"
            >
              ler a edição completa de {formatarData(edicaoHoje.date)} →
            </Link>
          </div>
        )}
      </article>
      <PartnerCta />
      <CtaFinal />
    </main>
  )
}

import type { Metadata } from 'next'
import Nav from '../components/Nav'
import PartnerCta from '../components/PartnerCta'
import CtaFinal from '../components/CtaFinal'
import Termometro from '../components/Termometro'
import GradeMercado from '../components/GradeMercado'

const SITE_URL = 'https://noticias.eullerlolato.com'

export const metadata: Metadata = {
  title: 'Mercado Cripto ao Vivo — Preços, Termômetro e Fear & Greed',
  description: 'Painel ao vivo do mercado cripto: termômetro e-trade.ai, Fear & Greed e preços dos principais ativos, atualizados a cada 15 minutos.',
  alternates: { canonical: '/mercado' },
  openGraph: { type: 'website', url: `${SITE_URL}/mercado`, title: 'Mercado Cripto ao Vivo — Cripto News' },
}

export default function MercadoPage() {
  return (
    <main style={{ background: 'var(--bg)', minHeight: '100vh' }}>
      <Nav />
      <div style={{ maxWidth: 900, margin: '0 auto', padding: '160px 24px 40px' }}>
        <p className="eyebrow" style={{ marginBottom: 12, textAlign: 'center' }}>ao vivo · atualizado a cada 15min</p>
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
          mercado cripto agora
        </h1>

        <Termometro />

        <div style={{ marginTop: 40 }}>
          <p className="eyebrow" style={{ marginBottom: 16 }}>preços</p>
          <GradeMercado />
        </div>
      </div>
      <PartnerCta />
      <CtaFinal />
    </main>
  )
}

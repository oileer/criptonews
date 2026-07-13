'use client'
import type { Lang } from '@/lib/i18n'
import Logo from './Logo'

const copy = {
  pt: {
    eyebrow: 'parceiro',
    title1: 'quer saber se o gráfico',
    title2: 'está pedindo entrada?',
    sub: 'o e-trade.ai analisa o print do seu gráfico com IA e devolve viés, suportes/resistências e um plano de operação — em segundos.',
    button: 'testar o e-trade.ai',
  },
  en: {
    eyebrow: 'partner',
    title1: 'wondering if the chart',
    title2: 'is signaling an entry?',
    sub: 'e-trade.ai reads your chart screenshot with AI and returns bias, support/resistance levels and a trade plan — in seconds.',
    button: 'try e-trade.ai',
  },
}

export default function PartnerCta({ lang = 'pt' }: { lang?: Lang }) {
  const t = copy[lang]

  return (
    <section style={{ background: 'var(--bg)', padding: '0 24px 80px' }}>
      <div
        style={{
          maxWidth: 700,
          margin: '0 auto',
          background: 'var(--card-bg)',
          border: '1px solid var(--card-border)',
          borderRadius: 32,
          padding: '48px 40px',
          textAlign: 'center',
          position: 'relative',
          overflow: 'hidden',
        }}
      >
        <div
          style={{
            position: 'absolute',
            width: 320,
            height: 320,
            borderRadius: '50%',
            top: '50%',
            left: '50%',
            transform: 'translate(-50%, -50%)',
            background: 'radial-gradient(circle, rgba(240,180,41,0.08) 0%, transparent 70%)',
            pointerEvents: 'none',
          }}
        />

        <div style={{ display: 'flex', justifyContent: 'center', marginBottom: 16 }}>
          <Logo size={40} />
        </div>
        <p className="eyebrow" style={{ marginBottom: 12 }}>{t.eyebrow}</p>
        <h3
          style={{
            fontSize: 'clamp(24px, 3.5vw, 34px)',
            fontWeight: 700,
            letterSpacing: '-0.02em',
            lineHeight: 1.15,
            textTransform: 'lowercase',
            color: 'var(--text-primary)',
            marginBottom: 12,
          }}
        >
          {t.title1}
          <br />
          <span className="gold-text">{t.title2}</span>
        </h3>

        <p style={{ fontSize: 15, color: 'var(--text-secondary)', marginBottom: 28, maxWidth: 480, marginInline: 'auto' }}>
          {t.sub}
        </p>

        <a
          href="https://etradeai.eullerlolato.com"
          target="_blank"
          rel="noopener noreferrer"
          className="btn-gold"
          style={{ padding: '14px 28px', fontSize: 15, borderRadius: 999, display: 'inline-block' }}
        >
          {t.button}
        </a>
      </div>
    </section>
  )
}

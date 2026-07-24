'use client'
import { dict, type Lang } from '@/lib/i18n'
import Logo from './Logo'
import ThemeToggle from './ThemeToggle'

const bannerCopy = {
  pt: {
    text: 'novo: análise de gráfico com IA em segundos',
    cta: 'testar o e-trade.ai →',
  },
  en: {
    text: 'new: AI chart analysis in seconds',
    cta: 'try e-trade.ai →',
  },
}

const etradeCopy = {
  pt: 'e-trade.ai',
  en: 'e-trade.ai',
}

export default function Nav({ lang = 'pt' }: { lang?: Lang }) {
  const t = dict[lang]
  const b = bannerCopy[lang]
  const etrade = etradeCopy[lang]
  const scrollToForm = () => {
    document.querySelector('#form-hero')?.scrollIntoView({ behavior: 'smooth' })
  }

  return (
    <div style={{ position: 'fixed', top: 0, left: 0, right: 0, zIndex: 100 }}>
      <a
        href="https://etradeai.eullerlolato.com"
        target="_blank"
        rel="noopener noreferrer"
        style={{
          display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
          flexWrap: 'wrap',
          padding: '9px 16px',
          fontSize: 13,
          textAlign: 'center',
          textDecoration: 'none',
          color: '#111',
          background: 'linear-gradient(90deg, #f0b429, #ff8a47)',
        }}
      >
        <span style={{ fontWeight: 700 }}>{b.text}</span>
        <span style={{ fontWeight: 600, textDecoration: 'underline' }}>{b.cta}</span>
      </a>
      <nav style={{
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        padding: '16px 32px',
        background: 'rgba(250,250,250,0.85)',
        backdropFilter: 'blur(16px)',
        WebkitBackdropFilter: 'blur(16px)',
        borderBottom: '1px solid var(--card-border)',
      }}>
      <a href={t.homeHref} style={{ display: 'flex', alignItems: 'center', gap: 10, fontWeight: 700, fontSize: 17, letterSpacing: '-0.02em', textTransform: 'lowercase', color: 'var(--text-primary)', textDecoration: 'none' }}>
        <Logo size={28} />
        cripto<span className="gold-text">news</span>
      </a>

      <div style={{ display: 'flex', alignItems: 'center', gap: 32 }}>
        <a href={t.editionsHref} style={{ fontSize: 14, color: 'var(--text-muted)', textTransform: 'lowercase', transition: 'color 0.2s' }}
          onMouseEnter={e => (e.currentTarget.style.color = 'var(--text-primary)')}
          onMouseLeave={e => (e.currentTarget.style.color = 'var(--text-muted)')}>
          {t.navEditions}
        </a>
        <a href={t.navHowHref} style={{ fontSize: 14, color: 'var(--text-muted)', textTransform: 'lowercase', transition: 'color 0.2s' }}
          onMouseEnter={e => (e.currentTarget.style.color = 'var(--text-primary)')}
          onMouseLeave={e => (e.currentTarget.style.color = 'var(--text-muted)')}>
          {t.navHow}
        </a>
        <a href={lang === 'pt' ? '/en' : '/'} style={{ fontSize: 14, color: 'var(--text-muted)', transition: 'color 0.2s' }}
          onMouseEnter={e => (e.currentTarget.style.color = 'var(--text-primary)')}
          onMouseLeave={e => (e.currentTarget.style.color = 'var(--text-muted)')}>
          {lang === 'pt' ? '🇺🇸 EN' : '🇧🇷 PT'}
        </a>
        <a
          href="https://etradeai.eullerlolato.com"
          target="_blank"
          rel="noopener noreferrer"
          style={{
            display: 'flex', alignItems: 'center', gap: 6,
            fontSize: 14, fontWeight: 600,
            padding: '9px 16px', borderRadius: 999,
            border: '1px solid var(--card-border)',
            color: 'var(--text-primary)', textDecoration: 'none',
            transition: 'border-color 0.2s, background 0.2s',
          }}
          onMouseEnter={e => { e.currentTarget.style.borderColor = '#f0b429'; e.currentTarget.style.background = 'rgba(240,180,41,0.08)' }}
          onMouseLeave={e => { e.currentTarget.style.borderColor = 'var(--card-border)'; e.currentTarget.style.background = 'transparent' }}
        >
          ⚡ {etrade}
        </a>
        <button onClick={scrollToForm} className="btn-gold" style={{ padding: '10px 20px', fontSize: 14, borderRadius: 999 }}>
          {t.navCta}
        </button>
        <ThemeToggle />
      </div>
      </nav>
    </div>
  )
}

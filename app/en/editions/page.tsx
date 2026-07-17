import type { Metadata } from 'next'
import Link from 'next/link'
import Nav from '../../components/Nav'
import { listarEdicoes, formatarData } from '@/lib/edicoes'

export const metadata: Metadata = {
  title: 'Editions — daily crypto market analysis',
  description:
    'Archive of every Crypto News edition: daily Bitcoin, Ethereum and altcoin analysis with real-time data, every day at 6am.',
  alternates: {
    canonical: '/en/editions',
    languages: { 'pt-BR': '/edicoes', en: '/en/editions' },
  },
}

export default function EditionsPage() {
  const edicoes = listarEdicoes('en')

  return (
    <main style={{ background: 'var(--bg)', minHeight: '100vh' }}>
      <Nav lang="en" />
      <section style={{ maxWidth: 760, margin: '0 auto', padding: '180px 24px 80px' }}>
        <p className="eyebrow" style={{ marginBottom: 16 }}>archive</p>
        <h1 style={{
          fontSize: 'clamp(36px, 6vw, 64px)',
          fontWeight: 700,
          letterSpacing: '-0.03em',
          lineHeight: 1.05,
          textTransform: 'lowercase',
          color: 'var(--text-primary)',
          marginBottom: 12,
        }}>
          all <span className="gold-text">editions.</span>
        </h1>
        <p style={{ fontSize: 17, color: 'var(--text-secondary)', marginBottom: 48, lineHeight: 1.55 }}>
          what happened in the crypto market, day by day — the same analysis subscribers get by email at 6am.
        </p>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          {edicoes.map((e) => (
            <Link
              key={e.date}
              href={`/en/editions/${e.date}`}
              style={{
                display: 'block',
                padding: '24px 28px',
                background: 'var(--card-bg)',
                border: '1px solid var(--card-border)',
                borderRadius: 20,
                textDecoration: 'none',
              }}
            >
              <p style={{ fontSize: 13, color: 'var(--gold)', fontWeight: 600, marginBottom: 6 }}>
                {formatarData(e.date, 'en')}
              </p>
              <h2 style={{ fontSize: 20, fontWeight: 700, color: 'var(--text-primary)', letterSpacing: '-0.01em', marginBottom: 8 }}>
                {e.title}
              </h2>
              <p style={{ fontSize: 15, color: 'var(--text-secondary)', lineHeight: 1.5 }}>{e.description}</p>
            </Link>
          ))}
          {edicoes.length === 0 && (
            <p style={{ color: 'var(--text-muted)' }}>first edition coming soon.</p>
          )}
        </div>
      </section>
    </main>
  )
}

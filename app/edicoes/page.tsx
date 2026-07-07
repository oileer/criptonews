import type { Metadata } from 'next'
import Link from 'next/link'
import Nav from '../components/Nav'
import { listarEdicoes, formatarData } from '@/lib/edicoes'

export const metadata: Metadata = {
  title: 'Edições — análise diária do mercado cripto',
  description:
    'Arquivo de todas as edições da Cripto News: análise diária de Bitcoin, Ethereum e altcoins com dados em tempo real, todo dia às 06h.',
  alternates: { canonical: '/edicoes' },
}

export default function EdicoesPage() {
  const edicoes = listarEdicoes()

  return (
    <main style={{ background: 'var(--bg)', minHeight: '100vh' }}>
      <Nav />
      <section style={{ maxWidth: 760, margin: '0 auto', padding: '140px 24px 80px' }}>
        <p className="eyebrow" style={{ marginBottom: 16 }}>arquivo</p>
        <h1 style={{
          fontSize: 'clamp(36px, 6vw, 64px)',
          fontWeight: 700,
          letterSpacing: '-0.03em',
          lineHeight: 1.05,
          textTransform: 'lowercase',
          color: 'var(--text-primary)',
          marginBottom: 12,
        }}>
          todas as <span className="gold-text">edições.</span>
        </h1>
        <p style={{ fontSize: 17, color: 'var(--text-secondary)', marginBottom: 48, lineHeight: 1.55 }}>
          o que aconteceu no mercado cripto, dia a dia — a mesma análise que chega no e-mail dos assinantes às 06h.
        </p>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          {edicoes.map((e) => (
            <Link
              key={e.date}
              href={`/edicoes/${e.date}`}
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
                {formatarData(e.date)}
              </p>
              <h2 style={{ fontSize: 20, fontWeight: 700, color: 'var(--text-primary)', letterSpacing: '-0.01em', marginBottom: 8 }}>
                {e.title}
              </h2>
              <p style={{ fontSize: 15, color: 'var(--text-secondary)', lineHeight: 1.5 }}>{e.description}</p>
            </Link>
          ))}
          {edicoes.length === 0 && (
            <p style={{ color: 'var(--text-muted)' }}>primeira edição chegando em breve.</p>
          )}
        </div>
      </section>
    </main>
  )
}

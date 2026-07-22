'use client'
import { useEffect, useState } from 'react'
import type { Lang } from '@/lib/i18n'

type Snapshot = {
  atualizadoEm: string
  termometro?: number
  fearGreed?: { valor: number; rotulo: string }
  precos?: Record<string, { preco: number; variacao24h?: number }>
}

const LABELS: Record<Lang, { titulo: string; subtitulo: (min: number) => string; faixas: [number, string][] }> = {
  pt: {
    titulo: 'termômetro e-trade.ai',
    subtitulo: (min) => `atualizado há ${min} min · ao vivo`,
    faixas: [
      [25, 'medo extremo'],
      [45, 'medo'],
      [55, 'neutro'],
      [75, 'ganância'],
      [101, 'ganância extrema'],
    ],
  },
  en: {
    titulo: 'e-trade.ai thermometer',
    subtitulo: (min) => `updated ${min} min ago · live`,
    faixas: [
      [25, 'extreme fear'],
      [45, 'fear'],
      [55, 'neutral'],
      [75, 'greed'],
      [101, 'extreme greed'],
    ],
  },
}

function rotuloFaixa(score: number, faixas: [number, string][]): string {
  return faixas.find(([teto]) => score < teto)?.[1] ?? faixas[faixas.length - 1][1]
}

export default function Termometro({ lang = 'pt' }: { lang?: Lang }) {
  const [snap, setSnap] = useState<Snapshot | null>(null)

  useEffect(() => {
    let ativo = true
    fetch('https://etradeai.eullerlolato.com/api/market/snapshot')
      .then((r) => (r.ok ? r.json() : null))
      .then((d) => ativo && setSnap(d))
      .catch(() => {})
    return () => {
      ativo = false
    }
  }, [])

  if (snap?.termometro == null) return null // sem dado fresco — não mostra card vazio/quebrado

  const t = LABELS[lang]
  const idadeMin = Math.max(0, Math.round((Date.now() - new Date(snap.atualizadoEm).getTime()) / 60000))
  const score = Math.round(snap.termometro)
  const btc = snap.precos?.BTCUSDT

  return (
    <div
      style={{
        maxWidth: 420,
        margin: '0 auto 32px',
        background: 'var(--card-bg)',
        border: '1px solid var(--card-border)',
        borderRadius: 24,
        padding: '20px 28px',
        display: 'flex',
        flexDirection: 'column',
        gap: 10,
        textAlign: 'center',
      }}
    >
      <span style={{ fontSize: 11, letterSpacing: '0.15em', textTransform: 'uppercase', color: 'var(--text-muted)' }}>
        {t.titulo}
      </span>
      <div style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'center', gap: 8 }}>
        <span
          className="gold-text"
          style={{ fontSize: 36, fontWeight: 700, lineHeight: 1 }}
        >
          {score}
        </span>
        <span style={{ color: 'var(--text-muted)', fontSize: 13 }}>/100 · {rotuloFaixa(score, t.faixas)}</span>
      </div>
      <div
        style={{
          height: 5,
          borderRadius: 999,
          background: 'linear-gradient(to right, #e85c4a, #f0b429, #2ecc71)',
          position: 'relative',
        }}
      >
        <div
          style={{
            position: 'absolute',
            top: -2.5,
            left: `${score}%`,
            transform: 'translateX(-50%)',
            width: 10,
            height: 10,
            borderRadius: '50%',
            background: 'var(--text-primary)',
            border: '2px solid var(--white)',
          }}
        />
      </div>
      {(snap.fearGreed || btc) && (
        <p style={{ color: 'var(--text-secondary)', fontSize: 12 }}>
          {snap.fearGreed && `Fear & Greed ${snap.fearGreed.valor} (${snap.fearGreed.rotulo})`}
          {snap.fearGreed && btc && ' · '}
          {btc &&
            `BTC US$ ${btc.preco.toLocaleString('en-US', { maximumFractionDigits: 0 })}${
              btc.variacao24h != null ? ` (${btc.variacao24h > 0 ? '+' : ''}${btc.variacao24h.toFixed(1)}%)` : ''
            }`}
        </p>
      )}
      <p style={{ color: 'var(--text-muted)', fontSize: 10 }}>{t.subtitulo(idadeMin)}</p>
    </div>
  )
}

'use client'
import { useEffect, useState } from 'react'

type Snapshot = {
  atualizadoEm: string
  termometro?: number
  fearGreed?: { valor: number; rotulo: string }
  precos?: Record<string, { preco: number; variacao24h?: number }>
}

const COPY = {
  atualizado: (min: number) => `atualizado há ${min} min · ao vivo`,
  variacao: 'variação 24h',
  fg: 'Fear & Greed',
}

// Dados ao vivo específicos de 1 ativo pras páginas /[ativo]-hoje — mesmo
// endpoint público do Termometro.tsx, mas focado num par só.
export default function PrecoAtivo({ par }: { par: string }) {
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

  const dado = snap?.precos?.[par]
  if (!dado) return null // sem dado fresco — não mostra card vazio/quebrado

  const idadeMin = snap ? Math.max(0, Math.round((Date.now() - new Date(snap.atualizadoEm).getTime()) / 60000)) : 0
  const subiu = (dado.variacao24h ?? 0) >= 0

  return (
    <div
      style={{
        maxWidth: 520,
        margin: '0 auto 32px',
        background: 'var(--card-bg)',
        border: '1px solid var(--card-border)',
        borderRadius: 24,
        padding: '28px 32px',
        display: 'flex',
        flexDirection: 'column',
        gap: 14,
        textAlign: 'center',
      }}
    >
      <div style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'center', gap: 10 }}>
        <span className="gold-text" style={{ fontSize: 44, fontWeight: 700, lineHeight: 1, letterSpacing: '-0.02em' }}>
          US$ {dado.preco.toLocaleString('en-US', { maximumFractionDigits: dado.preco > 100 ? 0 : 2 })}
        </span>
      </div>
      {dado.variacao24h != null && (
        <span
          style={{
            display: 'inline-flex',
            alignSelf: 'center',
            alignItems: 'center',
            gap: 4,
            fontSize: 14,
            fontWeight: 600,
            color: subiu ? '#1a9c53' : '#d64545',
            background: subiu ? 'rgba(26,156,83,0.1)' : 'rgba(214,69,69,0.1)',
            padding: '4px 12px',
            borderRadius: 999,
          }}
        >
          {subiu ? '▲' : '▼'} {Math.abs(dado.variacao24h).toFixed(2)}% · {COPY.variacao}
        </span>
      )}
      {snap?.fearGreed && (
        <p style={{ color: 'var(--text-secondary)', fontSize: 13 }}>
          {COPY.fg}: {snap.fearGreed.valor} ({snap.fearGreed.rotulo})
        </p>
      )}
      <p style={{ color: 'var(--text-muted)', fontSize: 11 }}>{COPY.atualizado(idadeMin)}</p>
    </div>
  )
}

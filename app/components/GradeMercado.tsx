'use client'
import { useEffect, useState } from 'react'

type Snapshot = {
  atualizadoEm: string
  precos?: Record<string, { preco: number; variacao24h?: number }>
}

// Curadoria por relevância/liquidez — não são todos os ~46 pares do
// snapshot, só os que interessam pro trader que chega em /mercado.
const ATIVOS = [
  { par: 'BTCUSDT', simbolo: 'BTC' },
  { par: 'ETHUSDT', simbolo: 'ETH' },
  { par: 'SOLUSDT', simbolo: 'SOL' },
  { par: 'BNBUSDT', simbolo: 'BNB' },
  { par: 'XRPUSDT', simbolo: 'XRP' },
  { par: 'ADAUSDT', simbolo: 'ADA' },
  { par: 'DOGEUSDT', simbolo: 'DOGE' },
  { par: 'LINKUSDT', simbolo: 'LINK' },
  { par: 'AVAXUSDT', simbolo: 'AVAX' },
  { par: 'SUIUSDT', simbolo: 'SUI' },
  { par: 'LTCUSDT', simbolo: 'LTC' },
  { par: 'NEARUSDT', simbolo: 'NEAR' },
]

export default function GradeMercado() {
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

  if (!snap?.precos) {
    return <p style={{ textAlign: 'center', color: 'var(--text-muted)', fontSize: 14 }}>carregando preços…</p>
  }

  return (
    <div
      style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fill, minmax(140px, 1fr))',
        gap: 12,
      }}
    >
      {ATIVOS.map(({ par, simbolo }) => {
        const dado = snap.precos?.[par]
        if (!dado) return null
        const subiu = (dado.variacao24h ?? 0) >= 0
        return (
          <div
            key={par}
            style={{
              background: 'var(--card-bg)',
              border: '1px solid var(--card-border)',
              borderRadius: 16,
              padding: '16px 18px',
            }}
          >
            <p style={{ fontSize: 12, fontWeight: 700, letterSpacing: '0.05em', color: 'var(--text-muted)', marginBottom: 6 }}>
              {simbolo}
            </p>
            <p style={{ fontSize: 17, fontWeight: 700, color: 'var(--text-primary)', marginBottom: 4 }}>
              US$ {dado.preco.toLocaleString('en-US', { maximumFractionDigits: dado.preco > 100 ? 0 : dado.preco > 1 ? 2 : 4 })}
            </p>
            {dado.variacao24h != null && (
              <p style={{ fontSize: 13, fontWeight: 600, color: subiu ? '#1a9c53' : '#d64545' }}>
                {subiu ? '▲' : '▼'} {Math.abs(dado.variacao24h).toFixed(2)}%
              </p>
            )}
          </div>
        )
      })}
    </div>
  )
}

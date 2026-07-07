'use client'
import { useState } from 'react'
import { useRouter } from 'next/navigation'

export default function CtaFinal() {
  const router = useRouter()
  const [email, setEmail] = useState('')
  const [status, setStatus] = useState<'idle' | 'loading' | 'done' | 'error'>('idle')

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!email) return
    setStatus('loading')
    try {
      const res = await fetch('/api/subscribe', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email }),
      })
      if (res.ok) {
        setStatus('done')
        setTimeout(() => router.push('/edicoes'), 1400)
      } else {
        setStatus('error')
      }
    } catch {
      setStatus('error')
    }
  }

  return (
    <section style={{ background: 'var(--bg)', padding: '80px 24px 100px' }}>
      <div style={{
        maxWidth: 700, margin: '0 auto',
        background: 'var(--card-bg)',
        border: '1px solid var(--card-border)',
        borderRadius: 32,
        padding: '64px 48px',
        textAlign: 'center',
        position: 'relative',
        overflow: 'hidden',
      }}>
        {/* glow decorativo */}
        <div style={{
          position: 'absolute', width: 400, height: 400,
          borderRadius: '50%', top: '50%', left: '50%',
          transform: 'translate(-50%, -50%)',
          background: 'radial-gradient(circle, rgba(240,180,41,0.08) 0%, transparent 70%)',
          pointerEvents: 'none',
        }} />

        <p className="eyebrow" style={{ marginBottom: 16 }}>comece agora</p>
        <h2 style={{
          fontSize: 'clamp(32px, 5vw, 56px)',
          fontWeight: 700,
          letterSpacing: '-0.03em',
          lineHeight: 1.05,
          textTransform: 'lowercase',
          color: 'var(--text-primary)',
          marginBottom: 16,
        }}>
          próxima edição:<br />
          <span className="gold-text">amanhã às 06h.</span>
        </h2>

        <p style={{ fontSize: 17, color: 'var(--text-secondary)', marginBottom: 36, lineHeight: 1.55 }}>
          junte-se a traders que já começam o dia informados — sem abrir twitter, sem grupo de whatsapp.
        </p>

        {status === 'done' ? (
          <div style={{
            display: 'inline-block', padding: '16px 32px',
            background: 'var(--white)', border: '1px solid var(--card-border)',
            borderRadius: 999, color: '#22c55e', fontWeight: 600, fontSize: 16,
          }}>
            ✓ você está na lista. até amanhã às 06h!
          </div>
        ) : (
          <form onSubmit={handleSubmit} style={{
            display: 'flex', gap: 8,
            maxWidth: 460, margin: '0 auto',
            padding: '6px 6px 6px 20px',
            borderRadius: 999,
            border: '1.5px solid var(--card-border)',
            background: 'var(--white)',
            alignItems: 'center',
            boxShadow: '0 2px 20px rgba(0,0,0,0.06)',
          }}>
            <input
              type="email"
              placeholder="coloque seu email"
              value={email}
              onChange={e => setEmail(e.target.value)}
              required
              style={{ flex: 1, border: 'none', outline: 'none', fontSize: 16, background: 'transparent', color: 'var(--text-primary)' }}
            />
            <button
              type="submit"
              disabled={status === 'loading'}
              className="btn-gold"
              style={{ padding: '12px 24px', fontSize: 15, borderRadius: 999, whiteSpace: 'nowrap' }}
            >
              {status === 'loading' ? 'enviando...' : 'inscreva-se'}
            </button>
          </form>
        )}

        {status === 'error' && (
          <p style={{ marginTop: 12, fontSize: 13, color: '#e05c5c' }}>erro ao cadastrar. tente novamente.</p>
        )}

        <p style={{ marginTop: 16, fontSize: 13, color: 'var(--text-muted)' }}>
          gratuito · sem spam · cancele quando quiser
        </p>
      </div>
    </section>
  )
}

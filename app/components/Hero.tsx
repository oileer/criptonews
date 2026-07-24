'use client'
import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { dict, type Lang } from '@/lib/i18n'

export default function Hero({ lang = 'pt', edicoesCount = 0 }: { lang?: Lang; edicoesCount?: number }) {
  const t = dict[lang]
  const router = useRouter()
  const [email, setEmail] = useState('')
  const [status, setStatus] = useState<'idle' | 'loading' | 'done' | 'error'>('idle')

  useEffect(() => {
    const obs = new IntersectionObserver(
      entries => entries.forEach(e => e.isIntersecting && e.target.classList.add('visible')),
      { threshold: 0.1 }
    )
    document.querySelectorAll('.fade').forEach(el => obs.observe(el))
    return () => obs.disconnect()
  }, [])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!email) return
    setStatus('loading')
    try {
      const res = await fetch('/api/subscribe', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, lang }),
      })
      if (res.ok) {
        setStatus('done')
        setTimeout(() => router.push(t.editionsHref), 1400)
      } else {
        setStatus('error')
      }
    } catch {
      setStatus('error')
    }
  }

  return (
    <section style={{
      position: 'relative',
      minHeight: '100vh',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      padding: '160px 24px 80px',
      overflow: 'hidden',
      background: 'var(--bg)',
    }}>


      <div style={{ position: 'relative', zIndex: 1, textAlign: 'center', maxWidth: 860 }}>

        {/* Badge */}
        <div className="fade" style={{
          display: 'inline-flex', alignItems: 'center', gap: 8,
          padding: '6px 16px', borderRadius: 999,
          border: '1px solid var(--card-border)', background: 'var(--white)',
          fontSize: 13, color: 'var(--text-muted)', marginBottom: 32,
        }}>
          <span style={{ width: 6, height: 6, borderRadius: '50%', background: 'var(--gold)', display: 'inline-block', boxShadow: '0 0 6px var(--gold)' }} />
          {t.badge}
        </div>

        {/* Headline */}
        <h1 className="fade d1" style={{
          fontSize: 'clamp(52px, 9vw, 112px)',
          fontWeight: 700,
          lineHeight: 0.95,
          letterSpacing: '-0.04em',
          marginBottom: 28,
          textTransform: 'lowercase',
          color: 'var(--text-primary)',
        }}>
          {t.headline1}<br />
          <span className="gold-text">{t.headline2}</span>
        </h1>

        {/* Subtítulo */}
        <p className="fade d2" style={{
          fontSize: 'clamp(16px, 1.8vw, 20px)',
          color: 'var(--text-secondary)',
          maxWidth: 560,
          margin: '0 auto 40px',
          lineHeight: 1.55,
        }}>
          {t.sub}{' '}
          <strong style={{ color: 'var(--text-primary)' }}>{t.subStrong}</strong>
        </p>

        {/* Form */}
        {status === 'done' ? (
          <div className="fade d3" style={{
            display: 'inline-block', padding: '16px 32px',
            background: 'var(--white)', border: '1px solid var(--card-border)',
            borderRadius: 999, color: '#22c55e', fontWeight: 600, fontSize: 16,
          }}>
            {t.done}
          </div>
        ) : (
          <form id="form-hero" className="fade d3" onSubmit={handleSubmit} style={{
            display: 'flex', gap: 8,
            maxWidth: 500, margin: '0 auto',
            padding: '6px 6px 6px 20px',
            borderRadius: 999,
            border: '1.5px solid var(--card-border)',
            background: 'var(--white)',
            alignItems: 'center',
            boxShadow: '0 2px 20px rgba(0,0,0,0.06)',
          }}>
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#999" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ flexShrink: 0 }}>
              <rect x="2" y="4" width="20" height="16" rx="2"/><path d="m22 7-8.97 5.7a1.94 1.94 0 0 1-2.06 0L2 7"/>
            </svg>
            <input
              type="email"
              placeholder={t.placeholder}
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
              {status === 'loading' ? t.buttonLoading : t.button}
            </button>
          </form>
        )}

        {status === 'error' && (
          <p style={{ marginTop: 12, fontSize: 13, color: '#e05c5c' }}>{t.error}</p>
        )}

        {/* Social proof — número real de edições publicadas, não estimativa de audiência */}
        {edicoesCount > 0 && (
          <div className="fade d4" style={{ marginTop: 24, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8 }}>
            <span style={{ width: 6, height: 6, borderRadius: '50%', background: 'var(--gold)', display: 'inline-block', boxShadow: '0 0 6px var(--gold)' }} />
            <p style={{ fontSize: 14, color: 'var(--text-secondary)' }}>
              <strong style={{ color: 'var(--text-primary)' }}>{t.socialProofStrong(edicoesCount)}</strong> {t.socialProof(edicoesCount)}
            </p>
          </div>
        )}
      </div>
    </section>
  )
}

'use client'
import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'

const avatars = ['#f0b429', '#ff8a47', '#111', '#888']
const initials = ['RF', 'CL', 'DM', 'LT']

export default function Hero() {
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
    <section style={{
      position: 'relative',
      minHeight: '100vh',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      padding: '120px 24px 80px',
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
          newsletter · cripto · todo dia às 06h
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
          o mercado cripto<br />
          <span className="gold-text">em 5 minutos.</span>
        </h1>

        {/* Subtítulo */}
        <p className="fade d2" style={{
          fontSize: 'clamp(16px, 1.8vw, 20px)',
          color: 'var(--text-secondary)',
          maxWidth: 560,
          margin: '0 auto 40px',
          lineHeight: 1.55,
        }}>
          as principais notícias do mercado cripto, diariamente no seu email.{' '}
          <strong style={{ color: 'var(--text-primary)' }}>totalmente grátis.</strong>
        </p>

        {/* Form */}
        {status === 'done' ? (
          <div className="fade d3" style={{
            display: 'inline-block', padding: '16px 32px',
            background: 'var(--white)', border: '1px solid var(--card-border)',
            borderRadius: 999, color: '#22c55e', fontWeight: 600, fontSize: 16,
          }}>
            ✓ você está na lista. até amanhã às 06h!
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

        {/* Social proof */}
        <div className="fade d4" style={{ marginTop: 24, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 12 }}>
          <div style={{ display: 'flex' }}>
            {avatars.map((bg, i) => (
              <div key={i} style={{
                width: 32, height: 32, borderRadius: '50%',
                background: bg, border: '2px solid var(--white)',
                marginLeft: i > 0 ? -10 : 0,
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontSize: 10, fontWeight: 700, color: i === 2 ? '#fff' : '#111',
              }}>
                {initials[i]}
              </div>
            ))}
          </div>
          <p style={{ fontSize: 14, color: 'var(--text-secondary)' }}>
            <strong style={{ color: 'var(--text-primary)' }}>+1.200 traders</strong> já recebem toda manhã
          </p>
        </div>
      </div>
    </section>
  )
}

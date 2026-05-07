'use client'

export default function Nav() {
  const scrollToForm = () => {
    document.querySelector('#form-hero')?.scrollIntoView({ behavior: 'smooth' })
  }

  return (
    <nav style={{
      position: 'fixed', top: 0, left: 0, right: 0, zIndex: 100,
      display: 'flex', alignItems: 'center', justifyContent: 'space-between',
      padding: '16px 32px',
      background: 'rgba(250,250,250,0.85)',
      backdropFilter: 'blur(16px)',
      WebkitBackdropFilter: 'blur(16px)',
      borderBottom: '1px solid var(--card-border)',
    }}>
      <div style={{ fontWeight: 700, fontSize: 17, letterSpacing: '-0.02em', textTransform: 'lowercase' }}>
        cripto<span className="gold-text">news</span>
      </div>

      <div style={{ display: 'flex', alignItems: 'center', gap: 32 }}>
        <a href="#como-funciona" style={{ fontSize: 14, color: 'var(--text-muted)', textTransform: 'lowercase', transition: 'color 0.2s' }}
          onMouseEnter={e => (e.currentTarget.style.color = 'var(--text-primary)')}
          onMouseLeave={e => (e.currentTarget.style.color = 'var(--text-muted)')}>
          como funciona
        </a>
        <button onClick={scrollToForm} className="btn-gold" style={{ padding: '10px 20px', fontSize: 14, borderRadius: 999 }}>
          inscreva-se
        </button>
      </div>
    </nav>
  )
}

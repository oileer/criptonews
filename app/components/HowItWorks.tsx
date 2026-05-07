'use client'
import { useRef, useState } from 'react'

const steps = [
  {
    num: '1.',
    title: 'se inscreva',
    desc: 'coloque seu email e clique no botão para se inscrever gratuitamente',
    gif: '/gifs/email.gif',
  },
  {
    num: '2.',
    title: 'prepare um café',
    desc: 'todo dia às 06h, a edição chega no seu email. abre, lê em 5 minutos e já sabe onde o mercado dormiu',
    gif: '/gifs/cafe.gif',
  },
  {
    num: '3.',
    title: 'opere com vantagem',
    desc: 'com o contexto certo, você entra no dia com clareza — sem ficar atrás do mercado',
    gif: '/gifs/chart.gif',
  },
]

export default function HowItWorks() {
  const [active, setActive] = useState(0)
  const sliderRef = useRef<HTMLDivElement>(null)

  const goTo = (i: number) => {
    setActive(i)
    if (sliderRef.current) {
      const card = sliderRef.current.children[i] as HTMLElement
      card.scrollIntoView({ behavior: 'smooth', block: 'nearest', inline: 'center' })
    }
  }

  return (
    <section id="como-funciona" style={{ background: 'var(--bg)', padding: '60px 24px 100px' }}>
      <div style={{ maxWidth: 900, margin: '0 auto' }}>

        <div style={{ textAlign: 'center', marginBottom: 48 }}>
          <p className="eyebrow">como funciona</p>
          <h2 className="section-title">
            você mais atualizado{' '}
            <span className="gold-text">em 5 minutos</span>
          </h2>
        </div>

        <div ref={sliderRef} style={{
          display: 'flex',
          overflowX: 'auto',
          scrollSnapType: 'x mandatory',
          gap: 16,
          scrollbarWidth: 'none',
          paddingBottom: 8,
        }}>
          {steps.map((step, i) => (
            <div key={i} style={{
              flexShrink: 0,
              width: '100%',
              minWidth: 'min(100%, 860px)',
              scrollSnapAlign: 'center',
              border: '1px solid var(--card-border)',
              borderRadius: 32,
              background: 'var(--card-bg)',
              overflow: 'hidden',
            }}>
              <div style={{ width: '100%', aspectRatio: '16/9', background: '#e0e0e0' }}>
                <img src={step.gif} alt={step.title} style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }} />
              </div>

              <div style={{ padding: '40px 48px 48px' }}>
                <div className="gold-text" style={{
                  fontSize: 'clamp(64px, 10vw, 120px)',
                  fontWeight: 700, lineHeight: 1,
                  letterSpacing: '-0.04em', marginBottom: 12,
                }}>
                  {step.num}
                </div>
                <h3 style={{
                  fontSize: 'clamp(26px, 3.5vw, 40px)',
                  fontWeight: 700, letterSpacing: '-0.02em',
                  lineHeight: 1.1, marginBottom: 12,
                  textTransform: 'lowercase',
                  color: 'var(--text-primary)',
                }}>
                  {step.title}
                </h3>
                <p style={{ fontSize: 17, color: 'var(--text-secondary)', lineHeight: 1.6, maxWidth: 460 }}>
                  {step.desc}
                </p>
              </div>
            </div>
          ))}
        </div>

        {/* Dots clicáveis */}
        <div style={{ display: 'flex', justifyContent: 'center', gap: 8, marginTop: 24 }}>
          {steps.map((_, i) => (
            <button key={i} onClick={() => goTo(i)} style={{
              width: active === i ? 28 : 10,
              height: 10, borderRadius: 999,
              background: active === i ? 'var(--gold)' : 'var(--card-border)',
              border: 'none', cursor: 'pointer',
              transition: 'all 0.3s ease',
              padding: 0,
            }} />
          ))}
        </div>
      </div>
    </section>
  )
}

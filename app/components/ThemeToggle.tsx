'use client'
import { useEffect, useState } from 'react'

// Alterna claro/escuro gravando data-theme no <html> + localStorage. O script
// inline no layout.tsx já aplica a escolha salva antes do primeiro paint.
export default function ThemeToggle() {
  const [escuro, setEscuro] = useState<boolean | null>(null) // null = ainda não sabemos (evita flash de ícone errado)

  useEffect(() => {
    const salvo = localStorage.getItem('theme')
    const sistemaEscuro = window.matchMedia('(prefers-color-scheme: dark)').matches
    setEscuro(salvo ? salvo === 'dark' : sistemaEscuro)
  }, [])

  const alternar = () => {
    const novo = !escuro
    setEscuro(novo)
    document.documentElement.setAttribute('data-theme', novo ? 'dark' : 'light')
    localStorage.setItem('theme', novo ? 'dark' : 'light')
  }

  if (escuro === null) return <div style={{ width: 36, height: 36 }} /> // placeholder do mesmo tamanho, sem flash

  return (
    <button
      onClick={alternar}
      aria-label={escuro ? 'ativar tema claro' : 'ativar tema escuro'}
      style={{
        width: 36,
        height: 36,
        borderRadius: '50%',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        border: '1px solid var(--card-border)',
        background: 'var(--white)',
        color: 'var(--text-primary)',
        transition: 'border-color 0.2s, background 0.2s',
        flexShrink: 0,
      }}
      onMouseEnter={(e) => (e.currentTarget.style.borderColor = 'var(--gold)')}
      onMouseLeave={(e) => (e.currentTarget.style.borderColor = 'var(--card-border)')}
    >
      {escuro ? (
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <circle cx="12" cy="12" r="5" /><line x1="12" y1="1" x2="12" y2="3" /><line x1="12" y1="21" x2="12" y2="23" />
          <line x1="4.22" y1="4.22" x2="5.64" y2="5.64" /><line x1="18.36" y1="18.36" x2="19.78" y2="19.78" />
          <line x1="1" y1="12" x2="3" y2="12" /><line x1="21" y1="12" x2="23" y2="12" />
          <line x1="4.22" y1="19.78" x2="5.64" y2="18.36" /><line x1="18.36" y1="5.64" x2="19.78" y2="4.22" />
        </svg>
      ) : (
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z" />
        </svg>
      )}
    </button>
  )
}

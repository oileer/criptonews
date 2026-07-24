import fs from 'node:fs'
import path from 'node:path'
import Link from 'next/link'
import { listarEdicoes, formatarData } from '@/lib/edicoes'
import type { Lang } from '@/lib/i18n'

const COPY = {
  pt: { eyebrow: 'a edição de hoje', cta: 'ler a edição completa →', audio: 'ouvir em áudio' },
  en: { eyebrow: "today's edition", cta: 'read the full edition →', audio: 'listen to audio' },
}

// Prova de qualidade antes de pedir o e-mail: mostra a edição REAL mais
// recente na home, não uma promessa genérica. Server component — lê os
// arquivos direto, sem round-trip de API.
export default function EdicaoDeHoje({ lang = 'pt' }: { lang?: Lang }) {
  const [maisRecente] = listarEdicoes(lang)
  if (!maisRecente) return null

  const t = COPY[lang]
  const editionsBase = lang === 'en' ? '/en/editions' : '/edicoes'
  const temAudio = fs.existsSync(path.join(process.cwd(), 'public', 'videos', `${maisRecente.date}.mp4`))

  return (
    <section style={{ padding: '0 24px 40px' }}>
      <div
        style={{
          maxWidth: 700,
          margin: '0 auto',
          background: 'var(--card-bg)',
          border: '1px solid var(--card-border)',
          borderRadius: 32,
          padding: '40px 40px 32px',
        }}
      >
        <p className="eyebrow" style={{ marginBottom: 12 }}>
          {t.eyebrow} · {formatarData(maisRecente.date, lang)}
        </p>
        <h2
          style={{
            fontSize: 'clamp(22px, 3.2vw, 30px)',
            fontWeight: 700,
            letterSpacing: '-0.01em',
            lineHeight: 1.2,
            color: 'var(--text-primary)',
            marginBottom: 14,
          }}
        >
          {maisRecente.title}
        </h2>
        <p style={{ fontSize: 16, lineHeight: 1.7, color: 'var(--text-secondary)', marginBottom: 24 }}>
          {maisRecente.description}
        </p>

        {temAudio && (
          <div style={{ marginBottom: 24 }}>
            <p style={{ fontSize: 12, color: 'var(--text-muted)', marginBottom: 8, textTransform: 'uppercase', letterSpacing: '0.1em' }}>
              {t.audio}
            </p>
            {/* eslint-disable-next-line jsx-a11y/media-has-caption -- narração puramente informativa, sem diálogo */}
            <audio controls style={{ width: '100%', height: 36 }}>
              <source src={`/videos/${maisRecente.date}.mp4`} type="video/mp4" />
            </audio>
          </div>
        )}

        <Link href={`${editionsBase}/${maisRecente.date}`} className="gold-text" style={{ fontSize: 15, fontWeight: 600 }}>
          {t.cta}
        </Link>
      </div>
    </section>
  )
}

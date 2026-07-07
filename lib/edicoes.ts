import fs from 'fs'
import path from 'path'
import type { Lang } from './i18n'

export interface Edicao {
  date: string // YYYY-MM-DD
  title: string
  description: string
  html: string
}

function dirDe(lang: Lang) {
  return path.join(process.cwd(), 'content', lang === 'en' ? 'edicoes-en' : 'edicoes')
}

export function listarEdicoes(lang: Lang = 'pt'): Edicao[] {
  const dir = dirDe(lang)
  if (!fs.existsSync(dir)) return []
  return fs
    .readdirSync(dir)
    .filter((f) => f.endsWith('.json'))
    .map((f) => JSON.parse(fs.readFileSync(path.join(dir, f), 'utf-8')) as Edicao)
    .sort((a, b) => b.date.localeCompare(a.date))
}

export function buscarEdicao(date: string, lang: Lang = 'pt'): Edicao | null {
  const arq = path.join(dirDe(lang), `${date}.json`)
  if (!/^\d{4}-\d{2}-\d{2}$/.test(date) || !fs.existsSync(arq)) return null
  return JSON.parse(fs.readFileSync(arq, 'utf-8')) as Edicao
}

export function formatarData(date: string, lang: Lang = 'pt'): string {
  const [y, m, d] = date.split('-')
  return lang === 'en' ? `${m}/${d}/${y}` : `${d}/${m}/${y}`
}

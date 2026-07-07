import fs from 'fs'
import path from 'path'

export interface Edicao {
  date: string // YYYY-MM-DD
  title: string
  description: string
  html: string
}

const DIR = path.join(process.cwd(), 'content', 'edicoes')

export function listarEdicoes(): Edicao[] {
  if (!fs.existsSync(DIR)) return []
  return fs
    .readdirSync(DIR)
    .filter((f) => f.endsWith('.json'))
    .map((f) => JSON.parse(fs.readFileSync(path.join(DIR, f), 'utf-8')) as Edicao)
    .sort((a, b) => b.date.localeCompare(a.date))
}

export function buscarEdicao(date: string): Edicao | null {
  const arq = path.join(DIR, `${date}.json`)
  if (!/^\d{4}-\d{2}-\d{2}$/.test(date) || !fs.existsSync(arq)) return null
  return JSON.parse(fs.readFileSync(arq, 'utf-8')) as Edicao
}

export function formatarData(date: string): string {
  const [y, m, d] = date.split('-')
  return `${d}/${m}/${y}`
}

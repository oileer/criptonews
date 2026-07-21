import { redirect } from 'next/navigation'
import { listarEdicoes } from '@/lib/edicoes'

// Permalink estável pra bio/QR/grupos: sempre aponta pra edição mais recente.
export async function GET() {
  const [maisRecente] = listarEdicoes('pt')
  if (!maisRecente) redirect('/edicoes')
  redirect(`/edicoes/${maisRecente.date}`)
}

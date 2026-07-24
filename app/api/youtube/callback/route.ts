import { NextRequest, NextResponse } from 'next/server'

/**
 * Callback manual do OAuth do YouTube (Google) — uso único, pra pegar o `code`
 * que o Google manda de volta e trocar por refresh token (scripts/youtube-auth.mjs
 * no kody). O `code` expira em minutos: essa página só exibe ele em texto puro
 * pra copiar rápido, sem nenhum processamento automático (não guarda nada).
 */
export async function GET(req: NextRequest) {
  const code = req.nextUrl.searchParams.get('code')
  const erro = req.nextUrl.searchParams.get('error_description') ?? req.nextUrl.searchParams.get('error')

  if (erro) {
    return new NextResponse(`Erro no OAuth do YouTube:\n${erro}`, {
      status: 400,
      headers: { 'Content-Type': 'text/plain; charset=utf-8', 'X-Robots-Tag': 'noindex' },
    })
  }
  if (!code) {
    return new NextResponse('Sem código na URL — algo deu errado antes de chegar aqui.', {
      status: 400,
      headers: { 'Content-Type': 'text/plain; charset=utf-8', 'X-Robots-Tag': 'noindex' },
    })
  }

  return new NextResponse(`code:\n${code}\n\nCopie e cole isso na conversa AGORA — expira em minutos.`, {
    headers: { 'Content-Type': 'text/plain; charset=utf-8', 'X-Robots-Tag': 'noindex' },
  })
}

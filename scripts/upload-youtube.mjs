// Sobe o vídeo diário pro YouTube como Short (resumable upload, YouTube Data
// API v3). Reaproveita o mesmo arquivo pra Reels/IG depois (post-social.mjs).
//
// Uso: node --env-file=.env.local scripts/upload-youtube.mjs [AAAA-MM-DD]
// Env: GOOGLE_CLIENT_ID, GOOGLE_CLIENT_SECRET, GOOGLE_REFRESH_TOKEN
import { readFileSync, existsSync, statSync } from 'node:fs'
import path from 'node:path'
import { tokenUsuario } from './lib/google-auth.mjs'

const dataArg = process.argv[2] || new Date().toLocaleDateString('sv-SE', { timeZone: 'America/Sao_Paulo' })

function titulo(edicao) {
  const t = `Bitcoin e Cripto Hoje ${edicao.date.split('-').reverse().join('/')} — Cripto News #shorts`
  return t.length > 100 ? t.slice(0, 100) : t
}

function descricao(edicao) {
  return `${edicao.description}\n\nAssine a newsletter gratuita: https://noticias.eullerlolato.com\nAnálise de gráfico com IA: https://etradeai.eullerlolato.com\n\n#bitcoin #cripto #criptomoedas #shorts`
}

async function uploadResumable(accessToken, metadata, caminhoVideo) {
  const tamanho = statSync(caminhoVideo).size

  const iniciar = await fetch(
    'https://www.googleapis.com/upload/youtube/v3/videos?uploadType=resumable&part=snippet,status',
    {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
        'X-Upload-Content-Type': 'video/mp4',
        'X-Upload-Content-Length': String(tamanho),
      },
      body: JSON.stringify(metadata),
    }
  )
  if (!iniciar.ok) throw new Error(`iniciar upload falhou: ${iniciar.status} ${await iniciar.text()}`)
  const uploadUrl = iniciar.headers.get('location')
  if (!uploadUrl) throw new Error('sem Location header na resposta de início do upload')

  const videoBuffer = readFileSync(caminhoVideo)
  const res = await fetch(uploadUrl, {
    method: 'PUT',
    headers: { 'Content-Type': 'video/mp4', 'Content-Length': String(tamanho) },
    body: videoBuffer,
  })
  const json = await res.json()
  if (!res.ok) throw new Error(`upload falhou: ${res.status} ${JSON.stringify(json)}`)
  return json
}

async function main() {
  const { GOOGLE_CLIENT_ID, GOOGLE_CLIENT_SECRET, GOOGLE_REFRESH_TOKEN } = process.env
  if (!GOOGLE_CLIENT_ID || !GOOGLE_CLIENT_SECRET || !GOOGLE_REFRESH_TOKEN) {
    console.error('[upload-youtube] faltam credenciais Google — nada a fazer')
    process.exit(1)
  }

  const arqEdicao = path.join('content', 'edicoes', `${dataArg}.json`)
  const arqVideo = path.join('content', 'videos', `${dataArg}.mp4`)
  if (!existsSync(arqEdicao)) throw new Error(`edição de ${dataArg} não encontrada`)
  if (!existsSync(arqVideo)) throw new Error(`vídeo de ${dataArg} não encontrado — rode gen-video-diario.mjs antes`)

  const edicao = JSON.parse(readFileSync(arqEdicao, 'utf8'))

  const accessToken = await tokenUsuario({
    clientId: GOOGLE_CLIENT_ID,
    clientSecret: GOOGLE_CLIENT_SECRET,
    refreshToken: GOOGLE_REFRESH_TOKEN,
  })

  const metadata = {
    snippet: {
      title: titulo(edicao),
      description: descricao(edicao),
      tags: ['bitcoin', 'cripto', 'criptomoedas', 'mercado cripto', 'trading'],
      categoryId: '25', // News & Politics
    },
    status: { privacyStatus: 'public', selfDeclaredMadeForKids: false },
  }

  console.log(`[upload-youtube] subindo vídeo de ${dataArg}...`)
  const resultado = await uploadResumable(accessToken, metadata, arqVideo)
  console.log(`[upload-youtube] publicado: https://youtube.com/shorts/${resultado.id}`)
}

main().catch((e) => {
  console.error('[upload-youtube] falhou:', e.message)
  process.exit(1)
})

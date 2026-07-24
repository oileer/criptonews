// Vídeo diário automático — narra a edição do dia sobre a arte de story já
// gerada (1080x1920, mesma proporção do YouTube Shorts/Reels/TikTok),
// legendas queimadas, ~45s. Zero passo manual.
//
// Pipeline: edição do dia (texto) → TTS (Google Cloud, service account já
// existente) → legendas .srt distribuídas pela duração real do áudio →
// ffmpeg (Ken Burns sutil na arte do story + legenda + áudio) → MP4.
//
// Uso: node --env-file=.env.local scripts/gen-video-diario.mjs [AAAA-MM-DD]
// Requer: content/social/<data>-story.png já gerado (rodar gen-social-art.mjs antes).
import { readFileSync, writeFileSync, existsSync, mkdirSync, copyFileSync } from 'node:fs'
import { execFile } from 'node:child_process'
import { promisify } from 'node:util'
import path from 'node:path'
import { sintetizarVoz } from './lib/tts.mjs'
import { gerarSrt } from './lib/legendas.mjs'

const run = promisify(execFile)
const FFMPEG = process.env.FFMPEG_PATH || path.join(process.env.HOME ?? '', 'opt', 'ffmpeg-current', 'ffmpeg')
const FFPROBE = process.env.FFPROBE_PATH || path.join(process.env.HOME ?? '', 'opt', 'ffmpeg-current', 'ffprobe')
const FONTE = '/usr/share/fonts/truetype/dejavu/DejaVuSans-Bold.ttf'

const dataArg = process.argv[2] || new Date().toLocaleDateString('sv-SE', { timeZone: 'America/Sao_Paulo' })

function textoNarracao(edicao) {
  // Título + descrição já é o resumo do dia, no tom certo — mesmo texto que
  // vira a legenda do Instagram. Corta pra caber num vídeo de ~45s
  // (TTS a 1.02x roda perto de 15-16 chars/seg em pt-BR).
  const bruto = `Cripto News, edição de hoje. ${edicao.description}`
  return bruto.length > 720 ? bruto.slice(0, 717) + '...' : bruto
}

async function duracaoAudio(caminhoMp3) {
  const { stdout } = await run(FFPROBE, ['-v', 'error', '-show_entries', 'format=duration', '-of', 'csv=p=0', caminhoMp3])
  return parseFloat(stdout.trim())
}

async function main() {
  const arqEdicao = path.join('content', 'edicoes', `${dataArg}.json`)
  if (!existsSync(arqEdicao)) throw new Error(`edição de ${dataArg} não encontrada — rode o robô diário antes`)
  const edicao = JSON.parse(readFileSync(arqEdicao, 'utf8'))

  const arqStory = path.join('content', 'social', `${dataArg}-story.png`)
  if (!existsSync(arqStory)) throw new Error(`arte de story de ${dataArg} não encontrada — rode gen-social-art.mjs antes`)

  const dirSaida = path.join('content', 'videos')
  mkdirSync(dirSaida, { recursive: true })
  // public/videos/ é servido pela Vercel — a Graph API (Reels) exige video_url
  // público, igual já fazemos com as imagens em public/social/.
  const dirPublico = path.join('public', 'videos')
  mkdirSync(dirPublico, { recursive: true })
  const arqAudio = path.join(dirSaida, `${dataArg}.mp3`)
  const arqSrt = path.join(dirSaida, `${dataArg}.srt`)
  const arqVideo = path.join(dirSaida, `${dataArg}.mp4`)
  const arqVideoPublico = path.join(dirPublico, `${dataArg}.mp4`)

  console.log(`Gerando vídeo de ${dataArg}...`)
  const narracao = textoNarracao(edicao)

  console.log('  sintetizando voz (Google TTS)...')
  const audio = await sintetizarVoz(narracao)
  writeFileSync(arqAudio, audio)

  const duracao = await duracaoAudio(arqAudio)
  console.log(`  áudio pronto: ${duracao.toFixed(1)}s`)

  console.log('  gerando legendas...')
  writeFileSync(arqSrt, gerarSrt(narracao, duracao))

  console.log('  renderizando vídeo (ffmpeg)...')
  // Ken Burns sutil (zoompan lento) na arte de story parada + legenda
  // queimada (força estilo: fundo semi-opaco atrás do texto pra legibilidade
  // em qualquer parte da imagem) + áudio narrado.
  const fps = 30
  const totalFrames = Math.ceil(duracao * fps)
  const filtro = [
    `scale=1080:1920,zoompan=z='min(zoom+0.0006,1.08)':d=${totalFrames}:s=1080x1920:fps=${fps}`,
    `subtitles=${arqSrt}:force_style='FontName=DejaVu Sans,FontSize=17,Bold=1,PrimaryColour=&H00FFFFFF,BackColour=&H99000000,BorderStyle=4,Outline=0,Shadow=0,MarginV=140,Alignment=2'`,
  ].join(',')

  await run(FFMPEG, [
    '-y',
    '-loop', '1',
    '-i', arqStory,
    '-i', arqAudio,
    '-filter_complex', `[0:v]${filtro}[v]`,
    '-map', '[v]',
    '-map', '1:a',
    '-c:v', 'libx264',
    '-pix_fmt', 'yuv420p',
    '-c:a', 'aac',
    '-b:a', '128k',
    '-shortest',
    arqVideo,
  ])

  copyFileSync(arqVideo, arqVideoPublico)

  console.log(`  ✓ ${arqVideo}`)
  console.log('Concluído.')
}

main().catch((e) => {
  console.error('[gen-video-diario] falhou:', e.message)
  process.exit(1)
})

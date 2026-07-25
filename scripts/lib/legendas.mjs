// Gera legendas (.ass) em blocos curtos (até 2 linhas cada, padrão de
// Shorts/Reels/TikTok) distribuídos proporcionalmente ao tamanho ao longo da
// duração total do áudio — sem timestamp por palavra real (exigiria SSML com
// marks e parsing fino), mas honesto o bastante pra acompanhar a fala.
//
// .ass em vez de .srt: o filtro `subtitles` do ffmpeg/libass autoescala a
// fonte com base no PlayRes do script — sem declarar explicitamente
// PlayResX/PlayResY, ele assume um default baixo (tipicamente 384x288) e
// infla o texto de forma grotesca em vídeos verticais de alta resolução
// (1080x1920). O .ass permite declarar a resolução real e controlar o
// tamanho de fonte com precisão.
//
// Blocos curtos (não frase inteira) evitam outro problema: frase longa vira
// muitas linhas empilhadas que crescem pra cima e invadem o conteúdo da arte
// atrás — bloco de até 2 linhas mantém a legenda sempre compacta e ancorada
// embaixo, não importa o tamanho da frase original.

const PLAY_RES_X = 1080
const PLAY_RES_Y = 1920
const MAX_CHARS_POR_LINHA = 30
const MAX_LINHAS_POR_BLOCO = 2

function formatarTempoAss(segundos) {
  const h = Math.floor(segundos / 3600)
  const m = Math.floor((segundos % 3600) / 60)
  const s = Math.floor(segundos % 60)
  const centesimos = Math.round((segundos - Math.floor(segundos)) * 100)
  const pad = (n, len = 2) => String(n).padStart(len, '0')
  return `${h}:${pad(m)}:${pad(s)}.${pad(centesimos)}`
}

/** Quebra um texto em linhas de até MAX_CHARS_POR_LINHA chars (array de linhas, sem juntar ainda). */
function quebrarEmLinhas(texto) {
  const palavras = texto.split(' ')
  const linhas = []
  let atual = ''
  for (const palavra of palavras) {
    const candidato = atual ? `${atual} ${palavra}` : palavra
    if (candidato.length > MAX_CHARS_POR_LINHA && atual) {
      linhas.push(atual)
      atual = palavra
    } else {
      atual = candidato
    }
  }
  if (atual) linhas.push(atual)
  return linhas
}

/**
 * Agrupa palavras em blocos que cabem em até MAX_LINHAS_POR_BLOCO linhas —
 * testa a quebra de verdade a cada palavra adicionada (não estima por
 * contagem de chars, que erra quando o wrap greedy não bate exato).
 */
function agruparEmBlocos(texto) {
  const palavras = texto.split(/\s+/).filter(Boolean)
  const blocos = []
  let atual = ''
  for (const palavra of palavras) {
    const candidato = atual ? `${atual} ${palavra}` : palavra
    if (quebrarEmLinhas(candidato).length > MAX_LINHAS_POR_BLOCO && atual) {
      blocos.push(atual)
      atual = palavra
    } else {
      atual = candidato
    }
  }
  if (atual) blocos.push(atual)
  return blocos
}

const CABECALHO_ASS = `[Script Info]
ScriptType: v4.00+
PlayResX: ${PLAY_RES_X}
PlayResY: ${PLAY_RES_Y}
ScaledBorderAndShadow: yes

[V4+ Styles]
Format: Name, Fontname, Fontsize, PrimaryColour, SecondaryColour, OutlineColour, BackColour, Bold, Italic, Underline, StrikeOut, ScaleX, ScaleY, Spacing, Angle, BorderStyle, Outline, Shadow, Alignment, MarginL, MarginR, MarginV, Encoding
Style: Default,DejaVu Sans,56,&H00FFFFFF,&H000000FF,&H00000000,&H20000000,1,0,0,0,100,100,0,0,3,10,0,2,70,70,110,1

[Events]
Format: Layer, Start, End, Style, Name, MarginL, MarginR, MarginV, Effect, Text
`

/** Gera o conteúdo .ass completo distribuindo os blocos proporcionalmente ao tamanho, na duração total (segundos). */
export function gerarAss(texto, duracaoTotalSeg) {
  const blocos = agruparEmBlocos(texto)
  const totalChars = blocos.reduce((s, b) => s + b.length, 0)

  let cursor = 0
  const linhas = blocos.map((bloco) => {
    const duracao = (bloco.length / totalChars) * duracaoTotalSeg
    const inicio = cursor
    const fim = Math.min(cursor + duracao, duracaoTotalSeg)
    cursor = fim
    return `Dialogue: 0,${formatarTempoAss(inicio)},${formatarTempoAss(fim)},Default,,0,0,0,,${quebrarEmLinhas(bloco).join('\\N')}`
  })

  return CABECALHO_ASS + linhas.join('\n') + '\n'
}

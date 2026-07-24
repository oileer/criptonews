// Gera legendas (.srt) distribuídas proporcionalmente ao tamanho de cada
// frase ao longo da duração total do áudio — sem timestamp por palavra real
// (exigiria SSML com marks e parsing fino), mas honesto o bastante pra
// acompanhar a fala num vídeo curto de 45s.

function dividirEmFrases(texto) {
  return (texto.match(/[^.!?]+[.!?]+|\S+$/g) ?? [texto]).map((f) => f.trim()).filter(Boolean)
}

function formatarTempoSrt(segundos) {
  const h = Math.floor(segundos / 3600)
  const m = Math.floor((segundos % 3600) / 60)
  const s = Math.floor(segundos % 60)
  const ms = Math.round((segundos - Math.floor(segundos)) * 1000)
  const pad = (n, len = 2) => String(n).padStart(len, '0')
  return `${pad(h)}:${pad(m)}:${pad(s)},${pad(ms, 3)}`
}

/** Quebra uma frase longa em linhas de até ~42 chars (padrão de legibilidade de legenda). */
function quebrarLinha(frase, maxChars = 42) {
  if (frase.length <= maxChars) return frase
  const palavras = frase.split(' ')
  let linha1 = ''
  let i = 0
  while (i < palavras.length && (linha1 + palavras[i]).length <= maxChars) {
    linha1 += (linha1 ? ' ' : '') + palavras[i]
    i++
  }
  const linha2 = palavras.slice(i).join(' ')
  return linha2 ? `${linha1}\n${linha2}` : linha1
}

/** Gera o conteúdo .srt distribuindo as frases proporcionalmente ao tamanho, na duração total (segundos). */
export function gerarSrt(texto, duracaoTotalSeg) {
  const frases = dividirEmFrases(texto)
  const totalChars = frases.reduce((s, f) => s + f.length, 0)

  let cursor = 0
  const blocos = frases.map((frase, i) => {
    const duracao = (frase.length / totalChars) * duracaoTotalSeg
    const inicio = cursor
    const fim = Math.min(cursor + duracao, duracaoTotalSeg)
    cursor = fim
    return `${i + 1}\n${formatarTempoSrt(inicio)} --> ${formatarTempoSrt(fim)}\n${quebrarLinha(frase)}\n`
  })
  return blocos.join('\n')
}

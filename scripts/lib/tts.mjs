// Google Cloud Text-to-Speech — narração pt-BR pro vídeo diário.
// Free tier: 1M chars/mês pra vozes WaveNet/Neural2 (a newsletter usa uma
// fração disso: ~800 chars/dia × 30 = 24k/mês).
import { tokenServiceAccount } from './google-auth.mjs'

const VOZ = 'pt-BR-Wavenet-B' // masculina, tom neutro — "Analista-Chefe"

// Texto em pedaços de até ~900 chars pra caber no limite da API (5000 bytes)
// com folga — divide por frase, não corta no meio.
function dividirEmPedacos(texto, maxChars = 900) {
  const frases = texto.match(/[^.!?]+[.!?]+|\S+$/g) ?? [texto]
  const pedacos = []
  let atual = ''
  for (const frase of frases) {
    if ((atual + frase).length > maxChars && atual) {
      pedacos.push(atual.trim())
      atual = frase
    } else {
      atual += frase
    }
  }
  if (atual.trim()) pedacos.push(atual.trim())
  return pedacos
}

/** Sintetiza um texto em áudio MP3 (Buffer). Divide em pedaços se for longo. */
export async function sintetizarVoz(texto) {
  const token = await tokenServiceAccount('https://www.googleapis.com/auth/cloud-platform')
  const pedacos = dividirEmPedacos(texto)
  const buffers = []

  for (const pedaco of pedacos) {
    const res = await fetch('https://texttospeech.googleapis.com/v1/text:synthesize', {
      method: 'POST',
      headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({
        input: { text: pedaco },
        voice: { languageCode: 'pt-BR', name: VOZ },
        audioConfig: { audioEncoding: 'MP3', speakingRate: 1.02 },
      }),
      signal: AbortSignal.timeout(30000),
    })
    const json = await res.json()
    if (!res.ok) throw new Error(`TTS falhou: ${JSON.stringify(json)}`)
    buffers.push(Buffer.from(json.audioContent, 'base64'))
  }

  // Concatenar MP3s crus funciona (frame-based, sem contêiner complexo) —
  // players/ffmpeg tocam sequencialmente sem re-encode.
  return Buffer.concat(buffers)
}

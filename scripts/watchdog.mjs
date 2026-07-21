// Watchdog do pipeline diário — roda a cada 10min via cron (kody).
// Checa: edição de hoje existe (depois das 6h20) e o snapshot do e-trade.ai
// está fresco (<30min). Se algo falhar, manda um alerta por e-mail via Resend.
// Env: RESEND_API_KEY, WATCHDOG_ALERT_EMAIL, ETRADE_API_URL, ETRADE_API_KEY
import fs from 'fs'
import path from 'path'

const RESEND_API_KEY = process.env.RESEND_API_KEY
const ALERT_EMAIL = process.env.WATCHDOG_ALERT_EMAIL || 'eullerlolatosmo@gmail.com'
const ETRADE_API = process.env.ETRADE_API_URL || 'http://100.97.40.28:8787'
const STATE_FILE = path.join(process.cwd(), '.watchdog-state.json')

function hojeSP() {
  return new Date().toLocaleString('en-CA', { timeZone: 'America/Sao_Paulo' }).slice(0, 10)
}

function horaMinutoSP() {
  const [, hm] = new Date().toLocaleString('en-CA', { timeZone: 'America/Sao_Paulo' }).split(', ')
  const [h, m] = hm.split(':').map(Number)
  return h * 60 + m
}

async function checarEdicaoDeHoje() {
  const minutosDoDia = horaMinutoSP()
  if (minutosDoDia < 6 * 60 + 20) return null // ainda não é hora de cobrar

  const hoje = hojeSP()
  const arq = path.join(process.cwd(), 'content', 'edicoes', `${hoje}.json`)
  if (!fs.existsSync(arq)) {
    return `edição de hoje (${hoje}) não foi publicada até ${Math.floor(minutosDoDia / 60)}h${String(minutosDoDia % 60).padStart(2, '0')}`
  }
  return null
}

async function checarSnapshotEtrade() {
  try {
    const res = await fetch(`${ETRADE_API}/v1/market/overview`, {
      headers: { 'x-api-key': process.env.ETRADE_API_KEY ?? '' },
    })
    if (!res.ok) return `etrade-api respondeu ${res.status} em /v1/market/overview`
    const body = await res.json()
    const ts = body?.timestamp || body?.updatedAt || body?.atualizadoEm
    if (!ts) return null // sem timestamp no payload, não dá pra checar frescor
    const idadeMin = (Date.now() - new Date(ts).getTime()) / 60000
    if (idadeMin > 30) return `snapshot do e-trade.ai com ${Math.round(idadeMin)}min de atraso`
    return null
  } catch (e) {
    return `etrade-api inacessível: ${e.message}`
  }
}

function lerEstado() {
  try {
    return JSON.parse(fs.readFileSync(STATE_FILE, 'utf-8'))
  } catch {
    return {}
  }
}

function salvarEstado(estado) {
  fs.writeFileSync(STATE_FILE, JSON.stringify(estado))
}

async function alertar(problemas) {
  if (!RESEND_API_KEY) {
    console.error('[watchdog] RESEND_API_KEY ausente, não deu pra alertar:', problemas)
    return
  }
  const html = `<p><strong>Watchdog Cripto News / e-trade.ai</strong></p><ul>${problemas
    .map((p) => `<li>${p}</li>`)
    .join('')}</ul><p>Checado às ${new Date().toLocaleString('pt-BR', { timeZone: 'America/Sao_Paulo' })}.</p>`

  const res = await fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: { Authorization: `Bearer ${RESEND_API_KEY}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({
      from: 'Watchdog <watchdog@noticias.eullerlolato.com>',
      to: ALERT_EMAIL,
      subject: '⚠️ Watchdog: problema no pipeline diário',
      html,
    }),
  })
  if (!res.ok) console.error('[watchdog] falha ao enviar alerta:', res.status, await res.text())
}

async function main() {
  const problemas = (await Promise.all([checarEdicaoDeHoje(), checarSnapshotEtrade()])).filter(Boolean)

  const hoje = hojeSP()
  const estado = lerEstado()
  const chave = problemas.sort().join('|')

  // só alerta uma vez por problema/dia, pra não spammar a cada 10min
  if (problemas.length > 0 && !(estado.dia === hoje && estado.ultimoAlerta === chave)) {
    await alertar(problemas)
    salvarEstado({ dia: hoje, ultimoAlerta: chave })
  } else if (problemas.length === 0 && estado.dia === hoje && estado.ultimoAlerta) {
    salvarEstado({ dia: hoje, ultimoAlerta: '' })
  }

  if (problemas.length) console.error('[watchdog]', problemas.join(' | '))
  else console.log('[watchdog] ok')
}

main()

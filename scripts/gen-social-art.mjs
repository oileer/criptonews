// Gera as artes diárias pros posts sociais (IG/FB/Threads) — fundo gelo igual ao site
// (--bg #fafafa), badges vetoriais Cripto News + e-trade.ai, CTA "link na bio".
// Uso: node --env-file=.env.local scripts/gen-social-art.mjs [AAAA-MM-DD]
// Saída: content/social/<data>-feed.png (1080x1080) e <data>-story.png (1080x1920)

import fs from 'node:fs'
import path from 'node:path'
import satori from 'satori'
import { Resvg } from '@resvg/resvg-js'
import wawoff2 from 'wawoff2'

const OURO = '#f0b429'
const LARANJA = '#ff8a47'
const VERDE = '#1a9c53'
const VERMELHO = '#d64545'
const BG = '#fafafa'
const CARD_BG = '#f0f0f0'
const CARD_BORDA = '#d8d8d8'
const TEXTO = '#111111'
const TEXTO_SEC = '#444444'
const TEXTO_MUTED = '#888888'

const ETRADE_API = process.env.ETRADE_API_URL || 'http://100.97.40.28:8787'
const API_KEY = process.env.ETRADE_API_KEY ?? ''

const dataArg = process.argv[2] || new Date().toLocaleDateString('sv-SE', { timeZone: 'America/Sao_Paulo' })
const [ano, mes, dia] = dataArg.split('-')
const dataBR = `${dia}/${mes}/${ano}`

// ---------- dados ----------

async function api(rota) {
  const res = await fetch(`${ETRADE_API}/v1/${rota}`, {
    headers: { 'x-api-key': API_KEY },
    signal: AbortSignal.timeout(30000),
  })
  if (!res.ok) throw new Error(`API ${rota} ${res.status}`)
  return res.json()
}

function destaquesDaEdicao() {
  const arq = path.join('content', 'edicoes', `${dataArg}.json`)
  if (!fs.existsSync(arq)) return []
  const { html } = JSON.parse(fs.readFileSync(arq, 'utf8'))
  const depois = html.split(/DESTAQUES DO DIA<\/b>/i)[1] ?? ''
  return [...depois.matchAll(/<b>([^<]+)<\/b>/g)].map(m => m[1].trim()).slice(0, 3)
}

// ---------- helpers ----------

const h = (type, style, ...children) => ({
  type,
  props: { style: { display: 'flex', ...style }, children: children.length === 1 ? children[0] : children },
})

const fmtUSD = v => v >= 1000
  ? `US$ ${Math.round(v).toLocaleString('pt-BR')}`
  : `US$ ${v.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`

// ---------- marca (mesmo losango vetorial do site — polígonos, sem PNG) ----------

function Diamante(tam) {
  const pts = [
    ['.92', '127.9 0 125.1 9.5 125.1 285.1 127.9 287.9 255.9 212.3'],
    ['.65', '127.9 0 0 212.3 127.9 287.9 127.9 154.2'],
    ['.85', '127.9 312.2 126.3 314.1 126.3 412.3 127.9 416.9 256 236.6'],
    ['.6', '127.9 416.9 127.9 312.2 0 236.6'],
    ['.45', '127.9 287.9 255.9 212.3 127.9 154.2'],
    ['.3', '0 212.3 127.9 287.9 127.9 154.2'],
  ]
  return {
    type: 'svg',
    props: {
      width: tam, height: tam * 1.63, viewBox: '0 0 256 417',
      children: pts.map(([op, points]) => ({
        type: 'polygon', props: { fill: '#ffffff', fillOpacity: op, points },
      })),
    },
  }
}

function badge(tam) {
  return h('div', {
    width: tam, height: tam, borderRadius: tam * 0.27, flexShrink: 0,
    background: `linear-gradient(135deg, ${OURO}, ${LARANJA})`,
    alignItems: 'center', justifyContent: 'center',
    boxShadow: '0 2px 10px rgba(240,180,41,.35)',
  }, Diamante(tam * 0.42))
}

function marca(nome, tamBadge, tamTexto, letterSpacing = 3) {
  return h('div', { alignItems: 'center', gap: tamBadge * 0.4 },
    badge(tamBadge),
    h('div', { fontSize: tamTexto, fontWeight: 700, color: TEXTO, letterSpacing }, nome),
  )
}

// ---------- blocos ----------

function cabecalho(e) {
  return h('div', {
    flexDirection: 'column', padding: `${44 * e}px ${52 * e}px 0`,
  },
    h('div', { justifyContent: 'space-between', alignItems: 'center' },
      marca('CRIPTO NEWS', 46 * e, 34 * e),
      marca('E-TRADE.AI', 40 * e, 28 * e),
    ),
    h('div', {
      fontSize: 26 * e, color: TEXTO_MUTED, marginTop: 22 * e,
      paddingBottom: 22 * e, borderBottom: `2px solid ${CARD_BORDA}`,
    }, `${dataBR} · o mercado cripto do dia`),
  )
}

function seta(sobe, tam, cor) {
  const pontos = sobe ? '50,0 100,100 0,100' : '0,0 100,0 50,100'
  return {
    type: 'svg',
    props: {
      width: tam, height: tam, viewBox: '0 0 100 100', style: { marginRight: tam * 0.4 },
      children: [{ type: 'polygon', props: { points: pontos, fill: cor } }],
    },
  }
}

function colTicker(rotulo, variacao, valor, ultima, e, pct = true) {
  const sobe = variacao >= 0
  const cor = sobe ? VERDE : VERMELHO
  const sinal = sobe ? '+' : ''
  const texto = pct ? `${sinal}${variacao.toFixed(2)}%` : `${sinal}${variacao}`
  return h('div', {
    flexDirection: 'column', alignItems: 'center', flex: 1,
    padding: `${20 * e}px 8px`, borderRight: ultima ? 'none' : `1px solid ${CARD_BORDA}`,
  },
    h('div', { fontSize: 22 * e, color: TEXTO_MUTED, letterSpacing: 2, fontWeight: 700 }, rotulo),
    h('div', { alignItems: 'center', marginTop: 12 * e },
      seta(sobe, 20 * e, cor),
      h('div', { fontSize: 27 * e, color: cor, fontWeight: 700 }, texto),
    ),
    h('div', { fontSize: 28 * e, color: TEXTO, marginTop: 8 * e, fontWeight: 700 }, valor),
  )
}

function gradeTickers(moedas, fg, e) {
  return h('div', {
    flexDirection: 'column', background: CARD_BG,
    border: `1px solid ${CARD_BORDA}`, borderRadius: 18, marginTop: 30 * e,
  },
    h('div', {},
      ...moedas.map(m => colTicker(m.symbol, m.var24h, fmtUSD(m.preco), false, e)),
      colTicker('F&G', fg.valor - (fg.ontem ?? fg.valor), `${fg.valor}/100`, true, e, false),
    ),
    h('div', { justifyContent: 'center', paddingBottom: 12 * e, fontSize: 18 * e, color: TEXTO_MUTED },
      `data de ref. ${dataBR} · 24h`),
  )
}

function termometro(score, faixa, e) {
  return h('div', {
    flexDirection: 'column', background: CARD_BG,
    border: `1px solid ${CARD_BORDA}`, borderRadius: 18, marginTop: 22 * e,
    padding: `${22 * e}px ${34 * e}px`,
  },
    h('div', { justifyContent: 'space-between', alignItems: 'center' },
      h('div', { fontSize: 22 * e, color: TEXTO_MUTED, letterSpacing: 2, fontWeight: 700 },
        `TERMÔMETRO E-TRADE.AI · ${faixa.toUpperCase()}`),
      h('div', { fontSize: 32 * e, color: '#b8860f', fontWeight: 700 }, `${score}/100`),
    ),
    h('div', { width: '100%', height: 12 * e, background: CARD_BORDA, borderRadius: 6 * e, marginTop: 20 * e },
      h('div', {
        width: `${score}%`, height: 12 * e, borderRadius: 6 * e,
        background: `linear-gradient(90deg, ${OURO}, ${LARANJA})`,
      }),
    ),
  )
}

function blocoDestaques(destaques, e) {
  if (!destaques.length) return h('div', {})
  return h('div', { flexDirection: 'column', marginTop: 30 * e },
    h('div', { fontSize: 22 * e, color: TEXTO_MUTED, letterSpacing: 2, fontWeight: 700 }, 'DESTAQUES DO DIA'),
    ...destaques.map(t =>
      h('div', { alignItems: 'flex-start', marginTop: 14 * e },
        h('div', { fontSize: 26 * e, color: '#b8860f', fontWeight: 700, marginRight: 14 * e }, '·'),
        h('div', { fontSize: 26 * e, color: TEXTO_SEC, fontWeight: 500, lineHeight: 1.35 }, t),
      ),
    ),
  )
}

function rodape(e) {
  return h('div', {
    flexDirection: 'column', alignItems: 'center',
    padding: `${28 * e}px ${40 * e}px ${40 * e}px`, marginTop: 'auto',
  },
    h('div', { fontSize: 24 * e, color: TEXTO_SEC, textAlign: 'center' },
      'Análise completa grátis no seu e-mail, todo dia às 6h'),
    h('div', {
      background: `linear-gradient(90deg, ${OURO}, ${LARANJA})`,
      color: '#111111', fontWeight: 700, fontSize: 26 * e, marginTop: 18 * e,
      padding: `${14 * e}px ${38 * e}px`, borderRadius: 999,
    }, 'link na bio'),
  )
}

function arte({ largura, altura, e, dados }) {
  const { score, faixa, moedas, fg, destaques } = dados
  return h('div', {
    width: largura, height: altura, flexDirection: 'column',
    background: BG, fontFamily: 'HelveticaNow',
  },
    cabecalho(e),
    h('div', { flexDirection: 'column', flex: 1, padding: `0 ${52 * e}px`, justifyContent: altura > largura ? 'space-around' : 'flex-start' },
      gradeTickers(moedas, fg, e),
      termometro(score, faixa, e),
      blocoDestaques(destaques, e),
    ),
    rodape(e),
  )
}

// ---------- render ----------

async function carregarFontes() {
  const dir = path.join('public', 'fonts')
  const pesos = [['Regular', 400], ['Medium', 500], ['Bold', 700]]
  const fontes = []
  // decompress em série — o WASM do wawoff2 não aguenta chamadas concorrentes
  for (const [nome, weight] of pesos) {
    const data = Buffer.from(await wawoff2.decompress(fs.readFileSync(path.join(dir, `HelveticaNowDisplay-${nome}.woff2`))))
    fontes.push({ name: 'HelveticaNow', data, weight, style: 'normal' })
  }
  return fontes
}

function validar(el, caminho = 'raiz') {
  if (!el || typeof el !== 'object') return
  const filhos = [].concat(el.props?.children ?? []).filter(c => c !== undefined && c !== null && c !== false)
  if (filhos.length > 1 && !['flex', 'contents', 'none'].includes(el.props?.style?.display) && el.type !== 'svg')
    console.error(`SEM FLEX em ${caminho}: ${filhos.length} filhos, style=${JSON.stringify(el.props?.style).slice(0, 140)}`)
  filhos.forEach((c, i) => validar(c, `${caminho}>${i}`))
}

async function renderizar(elemento, largura, altura, arquivo, fonts) {
  validar(elemento)
  const svg = await satori(elemento, { width: largura, height: altura, fonts })
  const png = new Resvg(svg, { fitTo: { mode: 'width', value: largura } }).render().asPng()
  fs.writeFileSync(arquivo, png)
  console.log(`  ✓ ${arquivo} (${Math.round(png.length / 1024)} KB)`)
}

async function main() {
  console.log(`Gerando artes de ${dataBR}...`)
  const [scoreData, overview] = await Promise.all([api('market/score'), api('market/overview')])
  const fgHoje = overview.fearGreed[0]
  const dados = {
    score: scoreData.score,
    faixa: scoreData.faixa,
    moedas: overview.principais.filter(m => ['BTC', 'ETH', 'SOL'].includes(m.symbol)),
    fg: { valor: fgHoje.valor, ontem: overview.fearGreed[1]?.valor },
    destaques: destaquesDaEdicao(),
  }
  const fonts = await carregarFontes()
  const dirSaida = path.join('content', 'social')
  fs.mkdirSync(dirSaida, { recursive: true })
  // Também grava em public/social/ — vira URL pública (site.com/social/...) via Vercel,
  // que é o que a Instagram Graph API exige (image_url tem que ser acessível na internet).
  const dirPublico = path.join('public', 'social')
  fs.mkdirSync(dirPublico, { recursive: true })

  const feedPng = arte({ largura: 1080, altura: 1080, e: 1, dados })
  const storyPng = arte({ largura: 1080, altura: 1920, e: 1.3, dados })
  await renderizar(feedPng, 1080, 1080, path.join(dirSaida, `${dataArg}-feed.png`), fonts)
  await renderizar(storyPng, 1080, 1920, path.join(dirSaida, `${dataArg}-story.png`), fonts)
  await renderizar(feedPng, 1080, 1080, path.join(dirPublico, `${dataArg}-feed.png`), fonts)
  await renderizar(storyPng, 1080, 1920, path.join(dirPublico, `${dataArg}-story.png`), fonts)
  console.log('Concluído.')
}

main().catch(err => { console.error(err); process.exit(1) })

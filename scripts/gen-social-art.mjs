// Gera as artes diárias pros posts sociais (IG/FB/Threads) com o MESMO layout do e-mail
// da newsletter (estilo casa de análise): header preto com marca mono dourada, corpo
// #1a1a1a, card de tickers em colunas, barra do termômetro, destaques e CTA em pill.
// Uso: node --env-file=.env.local scripts/gen-social-art.mjs [AAAA-MM-DD]
// Saída: content/social/<data>-feed.png (1080x1080) e <data>-story.png (1080x1920)

import fs from 'node:fs'
import path from 'node:path'
import satori from 'satori'
import { Resvg } from '@resvg/resvg-js'
import wawoff2 from 'wawoff2'

const OURO = '#f0b429'
const LARANJA = '#ff8a47'
const VERDE = '#2ecc71'
const VERMELHO = '#e74c3c'
const CINZA = '#8a8a8a'
const BORDA = '#262626'

const ETRADE_API = process.env.ETRADE_API_URL || 'http://100.97.40.28:8787'
const API_KEY = process.env.ETRADE_API_KEY ?? ''
const MONO = '/usr/share/fonts/truetype/liberation/LiberationMono-Bold.ttf'

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

// ---------- blocos (espelham o e-mail) ----------

// Header do e-mail: fundo preto, marca Courier dourada letterspacing 4, borda inferior dourada
function cabecalho(e) {
  return h('div', {
    display: 'flex', flexDirection: 'column', background: '#000000',
    borderRadius: '24px 24px 0 0', padding: `${38 * e}px ${52 * e}px ${30 * e}px`,
    borderBottom: `${5 * e}px solid ${OURO}`,
  },
    h('div', { fontFamily: 'Mono', fontSize: 46 * e, color: OURO, letterSpacing: 8 }, 'CRIPTO NEWS'),
    h('div', { fontSize: 26 * e, color: CINZA, marginTop: 14 * e }, `${dataBR} · o mercado cripto do dia`),
  )
}

// Grade de tickers do e-mail: colunas com rótulo / seta+variação / valor
function colTicker(rotulo, variacao, valor, ultima, e, pct = true) {
  const cor = variacao >= 0 ? VERDE : VERMELHO
  const seta = variacao >= 0 ? '▲' : '▼'
  const sinal = variacao >= 0 ? '+' : ''
  const delta = pct ? `${seta} ${sinal}${variacao.toFixed(2)}%` : `${seta} ${sinal}${variacao}`
  return h('div', {
    display: 'flex', flexDirection: 'column', alignItems: 'center', flex: 1,
    padding: `${20 * e}px 8px`, borderRight: ultima ? 'none' : `1px solid ${BORDA}`,
  },
    h('div', { fontSize: 22 * e, color: CINZA, letterSpacing: 2, fontWeight: 700 }, rotulo),
    h('div', { fontSize: 27 * e, color: cor, marginTop: 12 * e }, delta),
    h('div', { fontSize: 28 * e, color: '#e0e0e0', marginTop: 8 * e, fontWeight: 700 }, valor),
  )
}

function gradeTickers(moedas, fg, e) {
  return h('div', {
    display: 'flex', flexDirection: 'column', background: '#141414',
    border: `1px solid ${BORDA}`, borderRadius: 18, marginTop: 30 * e,
  },
    h('div', { display: 'flex' },
      ...moedas.map((m, i) => colTicker(m.symbol, m.var24h, fmtUSD(m.preco), false, e)),
      colTicker('F&G', fg.valor - (fg.ontem ?? fg.valor), `${fg.valor}/100`, true, e, false),
    ),
    h('div', { display: 'flex', justifyContent: 'center', paddingBottom: 12 * e, fontSize: 18 * e, color: '#666' },
      `data de ref. ${dataBR} · 24h`),
  )
}

// Barra do termômetro do e-mail: rótulo + score/100 à direita + barra fina com gradiente
function termometro(score, faixa, e) {
  const larguraBarra = 100
  return h('div', {
    display: 'flex', flexDirection: 'column', background: '#141414',
    border: `1px solid ${BORDA}`, borderRadius: 18, marginTop: 22 * e,
    padding: `${22 * e}px ${34 * e}px`,
  },
    h('div', { display: 'flex', justifyContent: 'space-between', alignItems: 'center' },
      h('div', { fontSize: 22 * e, color: CINZA, letterSpacing: 2, fontWeight: 700 },
        `TERMÔMETRO E-TRADE.AI · ${faixa.toUpperCase()}`),
      h('div', { fontSize: 32 * e, color: OURO, fontWeight: 700 }, `${score}/100`),
    ),
    h('div', { display: 'flex', width: '100%', height: 12 * e, background: BORDA, borderRadius: 6 * e, marginTop: 20 * e },
      h('div', {
        width: `${score}%`, height: 12 * e, borderRadius: 6 * e,
        background: `linear-gradient(90deg, ${OURO}, ${LARANJA})`,
      }),
    ),
  )
}

// Destaques: negrito dourado como os <b> do corpo do e-mail
function blocoDestaques(destaques, e) {
  if (!destaques.length) return h('div', { display: 'flex' })
  return h('div', { display: 'flex', flexDirection: 'column', marginTop: 30 * e },
    h('div', { fontSize: 22 * e, color: CINZA, letterSpacing: 2, fontWeight: 700 }, 'DESTAQUES DO DIA'),
    ...destaques.map(t =>
      h('div', { display: 'flex', alignItems: 'flex-start', marginTop: 14 * e },
        h('div', { fontSize: 26 * e, color: OURO, fontWeight: 700, marginRight: 14 * e }, '·'),
        h('div', { fontSize: 26 * e, color: OURO, fontWeight: 700, lineHeight: 1.35 }, t),
      ),
    ),
  )
}

// Rodapé preto do e-mail com o CTA em pill (gradiente, igual ao botão do e-mail)
function rodape(e) {
  return h('div', {
    display: 'flex', flexDirection: 'column', alignItems: 'center', background: '#111111',
    borderRadius: '0 0 24px 24px', borderTop: `1px solid ${BORDA}`,
    padding: `${24 * e}px`, marginTop: 'auto',
  },
    h('div', { fontSize: 24 * e, color: '#bbbbbb' }, 'Análise completa grátis no seu e-mail, todo dia às 6h'),
    h('div', {
      display: 'flex', background: `linear-gradient(90deg, ${OURO}, ${LARANJA})`,
      color: '#111111', fontWeight: 700, fontSize: 26 * e, marginTop: 16 * e,
      padding: `${14 * e}px ${38 * e}px`, borderRadius: 999,
    }, 'noticias.eullerlolato.com'),
  )
}

function arte({ largura, altura, e, dados }) {
  const { score, faixa, moedas, fg, destaques } = dados
  return h('div', {
    width: largura, height: altura, display: 'flex', flexDirection: 'column',
    background: '#0d0d0d', fontFamily: 'HelveticaNow', padding: 40 * e,
  },
    h('div', {
      display: 'flex', flexDirection: 'column', flex: 1,
      background: '#1a1a1a', borderRadius: 24,
    },
      cabecalho(e),
      h('div', { display: 'flex', flexDirection: 'column', flex: 1, padding: `0 ${52 * e}px`, justifyContent: altura > largura ? 'space-around' : 'flex-start' },
        gradeTickers(moedas, fg, e),
        termometro(score, faixa, e),
        blocoDestaques(destaques, e),
      ),
      rodape(e),
    ),
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
  fontes.push({ name: 'Mono', data: fs.readFileSync(MONO), weight: 700, style: 'normal' })
  return fontes
}

function validar(el, caminho = 'raiz') {
  if (!el || typeof el !== 'object') return
  const filhos = [].concat(el.props?.children ?? []).filter(c => c !== undefined && c !== null && c !== false)
  if (filhos.length > 1 && !['flex', 'contents', 'none'].includes(el.props?.style?.display))
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
  if (process.env.DEBUG_BLOCO) {
    const wrap = el => h('div', { display: 'flex', width: 1080, height: 1080 }, el)
    const blocos = {
      cabecalho: cabecalho(1),
      grade: gradeTickers(dados.moedas, dados.fg, 1),
      termometro: termometro(dados.score, dados.faixa, 1),
      termo_rotulo: h('div', { fontSize: 22, color: CINZA, letterSpacing: 2, fontWeight: 700 }, `TERMÔMETRO E-TRADE.AI · ${dados.faixa.toUpperCase()}`),
      termo_row: h('div', { display: 'flex', justifyContent: 'space-between', alignItems: 'center' },
        h('div', { fontSize: 22, color: CINZA }, 'X'), h('div', { fontSize: 32, color: OURO }, `${dados.score}/100`)),
      termo_bar: h('div', { display: 'flex', width: '100%', height: 12, background: BORDA, borderRadius: 6, marginTop: 20 },
        h('div', { width: `${dados.score}%`, height: 12, borderRadius: 6, background: `linear-gradient(90deg, ${OURO}, ${LARANJA})` })),
      destaques: blocoDestaques(dados.destaques, 1),
      cta: cta(1),
      rodape: rodape(1),
    }
    for (const [nome, el] of Object.entries(blocos)) {
      try { await satori(wrap(el), { width: 1080, height: 1080, fonts }); console.log(nome, 'OK') }
      catch (err) { console.log(nome, 'FALHOU:', err.message) }
    }
    return
  }
  const dirSaida = path.join('content', 'social')
  fs.mkdirSync(dirSaida, { recursive: true })

  await renderizar(arte({ largura: 1080, altura: 1080, e: 1, dados }), 1080, 1080,
    path.join(dirSaida, `${dataArg}-feed.png`), fonts)
  await renderizar(arte({ largura: 1080, altura: 1920, e: 1.3, dados }), 1080, 1920,
    path.join(dirSaida, `${dataArg}-story.png`), fonts)
  console.log('Concluído.')
}

main().catch(err => { console.error(err); process.exit(1) })

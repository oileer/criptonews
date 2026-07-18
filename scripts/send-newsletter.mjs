// Robô da Cripto News — gera as edições do dia (PT e EN) com IA, dispara via
// Resend e publica no site (content/edicoes*/ + git push → Vercel rebuilda).
// Uso:  npm run send            (envia pras duas audiences e publica no site)
//       npm run send:dry        (gera e mostra no console, não envia nem publica)
// Env:  RESEND_API_KEY, RESEND_AUDIENCE_ID, RESEND_AUDIENCE_ID_EN, ANTHROPIC_API_KEY

import Anthropic from '@anthropic-ai/sdk'
import fs from 'node:fs'
import path from 'node:path'
import { execSync } from 'node:child_process'

const RESEND_API_KEY = process.env.RESEND_API_KEY
const DRY_RUN = process.argv.includes('--dry-run')

const dataIso = new Date().toLocaleDateString('en-CA', { timeZone: 'America/Sao_Paulo' }) // YYYY-MM-DD

const LANGS = {
  pt: {
    audienceId: process.env.RESEND_AUDIENCE_ID,
    from: 'Cripto News <news@noticias.eullerlolato.com>',
    dir: 'edicoes',
    dataLocal: new Date().toLocaleDateString('pt-BR', { timeZone: 'America/Sao_Paulo' }),
    assunto: (d) => `Cripto News · ${d}`,
    tituloEdicao: (d) => `Cripto News — ${d}: o mercado cripto do dia`,
    header: 'Análise diária do mercado',
    footer: 'Você recebe porque se cadastrou na Cripto News.',
    unsubscribe: 'Cancelar inscrição',
    system: `Você é o redator da Cripto News, newsletter diária em português para traders brasileiros de criptomoedas. Tom direto, opinativo, com gíria de trader, sem hype. Sempre traduza a notícia em "o que isso significa pra quem opera".`,
    prompt: (agora, dados, hoje) => `Agora são ${agora} (horário de Brasília).

DADOS DE MERCADO EM TEMPO REAL (fonte oficial — use SOMENTE estes números para preços, variações e sentimento; NUNCA cite preço vindo de notícia ou busca):
${dados}

Pesquise as notícias mais importantes do mercado cripto das ÚLTIMAS 24 HORAS (Bitcoin, Ethereum, altcoins, regulação, instituições, ETFs, funding rate). Regras da pesquisa:
- Verifique a data de publicação de cada notícia; descarte qualquer coisa com mais de 24-36h ou sem data clara
- Notícias de preço/cotação devem ser ignoradas — os preços válidos são só os dos dados acima
- Se uma notícia contradisser os dados de mercado acima, os dados acima prevalecem

Escreva a edição de hoje (${hoje}) da Cripto News.

Estrutura obrigatória (responda APENAS com o HTML interno, sem \`\`\`, sem <html>/<body>):
<p><b>CRIPTO NEWS — ${hoje}</b></p>
<p>[parágrafo de abertura resumindo o clima do mercado hoje]</p>
<p><b>DESTAQUES DO DIA</b></p>
[3 a 4 notícias, cada uma como: <p><b>Título da notícia</b><br>análise de 3-5 frases com a leitura prática pro trader</p>]
<p><b>PONTO DE ATENÇÃO</b></p>
<p>[o que observar nas próximas 24-48h]</p>
<p>[frase de despedida no estilo "Até amanhã — fique esperto..."]</p>`,
    regras: `REGRAS INVIOLÁVEIS DE SAÍDA:
- Sua resposta vai DIRETO para a caixa de entrada dos assinantes, sem revisão humana. Não é um chat.
- NUNCA mencione suas ferramentas, buscas, cotas, falhas técnicas ou o seu processo. NUNCA faça perguntas ao leitor nem ofereça "rodar de novo".
- Se a busca de notícias falhar ou retornar pouco, escreva a edição normalmente usando apenas os dados de mercado fornecidos, mantendo a seção DESTAQUES DO DIA com análise técnica/de sentimento — sem avisar o leitor de nada.
- A resposta deve conter APENAS os parágrafos <p> da edição, do primeiro ao último, nada antes nem depois.`,
  },
  en: {
    audienceId: process.env.RESEND_AUDIENCE_ID_EN,
    from: 'Crypto News <news@noticias.eullerlolato.com>',
    dir: 'edicoes-en',
    dataLocal: new Date().toLocaleDateString('en-US', { timeZone: 'America/Sao_Paulo', month: 'long', day: 'numeric', year: 'numeric' }),
    assunto: (d) => `Crypto News · ${d}`,
    tituloEdicao: (d) => `Crypto News — ${d}: today's crypto market`,
    header: 'Daily market analysis',
    footer: 'You are receiving this because you subscribed to Crypto News.',
    unsubscribe: 'Unsubscribe',
    system: `You are the writer of Crypto News, a daily English-language newsletter for crypto traders. Direct, opinionated tone with trader slang, no hype. Always translate each story into "what this means for your trading".`,
    prompt: (agora, dados, hoje) => `Current time: ${agora} (UTC-3).

REAL-TIME MARKET DATA (official source — use ONLY these numbers for prices, changes and sentiment; NEVER quote a price from a news article or search result):
${dados}

Search for the most important crypto market news of the LAST 24 HOURS (Bitcoin, Ethereum, altcoins, regulation, institutions, ETFs, funding rates). Search rules:
- Check the publication date of every story; discard anything older than 24-36h or without a clear date
- Ignore price/quote stories — the only valid prices are in the data above
- If a story contradicts the market data above, the data above prevails

Write today's edition (${hoje}) of Crypto News.

Required structure (reply ONLY with the inner HTML, no \`\`\`, no <html>/<body>):
<p><b>CRYPTO NEWS — ${hoje}</b></p>
<p>[opening paragraph summarizing today's market mood]</p>
<p><b>TODAY'S HIGHLIGHTS</b></p>
[3 to 4 stories, each as: <p><b>Story headline</b><br>3-5 sentence analysis with the practical takeaway for traders</p>]
<p><b>WATCH LIST</b></p>
<p>[what to watch over the next 24-48h]</p>
<p>[sign-off line in the style "See you tomorrow — stay sharp..."]</p>`,
    regras: `NON-NEGOTIABLE OUTPUT RULES:
- Your reply goes STRAIGHT to subscribers' inboxes with no human review. This is not a chat.
- NEVER mention your tools, searches, quotas, technical failures or your process. NEVER ask the reader questions or offer to "try again".
- If the news search fails or returns little, write the edition normally using only the provided market data, keeping the TODAY'S HIGHLIGHTS section with technical/sentiment analysis — without telling the reader anything.
- The reply must contain ONLY the <p> paragraphs of the edition, first to last, nothing before or after.`,
  },
}

// Dados de mercado em tempo real — a IA fica proibida de citar preços de outra fonte.
// Fonte primária: API do e-trade.ai no kody (dados ricos + Termômetro + análise do
// analista-chefe IA). Se a API estiver fora, cai no fetch direto (fallback).
const ETRADE_API = process.env.ETRADE_API_URL || 'http://100.97.40.28:8787'

async function buscarDadosMercado(lang = 'pt') {
  // Tickers estruturados (grade de cotações do e-mail) sempre via fetch
  // direto — barato e independente da API do kody estar de pé.
  const tickersPromise = buscarTickers().catch(() => null)
  try {
    const res = await fetch(`${ETRADE_API}/v1/newsletter/draft?lang=${lang}`, {
      signal: AbortSignal.timeout(120000),
      headers: { "x-api-key": process.env.ETRADE_API_KEY ?? "" },
    })
    if (!res.ok) throw new Error(`API e-trade ${res.status}`)
    const draft = await res.json()
    if (!draft.dados) throw new Error('draft sem dados')
    let dados = draft.dados
    if (draft.anomalias?.length)
      dados += '\n\nSINAIS FORA DO PADRÃO detectados pelo radar (use se relevante):\n- ' + draft.anomalias.join('\n- ')
    if (draft.analiseHtml)
      dados +=
        '\n\nANÁLISE DO ANALISTA-CHEFE do e-trade.ai (use como base técnica; reescreva no tom da newsletter, não copie):\n' +
        draft.analiseHtml.replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim()
    console.log('  (dados via API e-trade.ai — Termômetro ' + (draft.termometro?.score ?? '?') + '/100)')
    return { dados, tickers: await tickersPromise, termometro: draft.termometro?.score ?? null }
  } catch (e) {
    console.warn('  API e-trade.ai indisponível (' + e.message + ') — usando fetch direto')
    return buscarDadosMercadoDireto(await tickersPromise)
  }
}

async function buscarTickers() {
  const [cg, fg] = await Promise.all([
    fetch(
      'https://api.coingecko.com/api/v3/coins/markets?vs_currency=usd&ids=bitcoin,ethereum,solana&price_change_percentage=24h,7d'
    ).then((r) => r.json()),
    fetch('https://api.alternative.me/fng/?limit=2').then((r) => r.json()),
  ])
  return {
    moedas: cg.map((m) => ({
      simbolo: m.symbol.toUpperCase(),
      preco: m.current_price,
      var24h: m.price_change_percentage_24h_in_currency ?? 0,
      var7d: m.price_change_percentage_7d_in_currency ?? 0,
      high24h: m.high_24h,
      low24h: m.low_24h,
    })),
    fearGreed: { hoje: fg.data[0], ontem: fg.data[1] },
  }
}

function buscarDadosMercadoDireto(tickers) {
  if (!tickers) throw new Error('sem dados de mercado (CoinGecko e API e-trade fora)')
  const linhas = tickers.moedas.map(
    (m) =>
      `${m.simbolo}: US$ ${m.preco.toLocaleString('en-US')} ` +
      `(24h: ${m.var24h.toFixed(2)}% | 7d: ${m.var7d.toFixed(2)}%) | ` +
      `high 24h: US$ ${m.high24h.toLocaleString('en-US')} | low 24h: US$ ${m.low24h.toLocaleString('en-US')}`
  )
  const { hoje, ontem } = tickers.fearGreed
  linhas.push(
    `Fear & Greed: ${hoje.value} (${hoje.value_classification}) | yesterday: ${ontem.value} (${ontem.value_classification})`
  )
  return { dados: linhas.join('\n'), tickers, termometro: null }
}

async function gerarConteudo(lang, dadosMercado) {
  const cfg = LANGS[lang]
  const client = new Anthropic()
  const agora = new Date().toLocaleString(lang === 'en' ? 'en-US' : 'pt-BR', { timeZone: 'America/Sao_Paulo' })

  const stream = client.messages.stream({
    // Haiku 4.5 para testes (mais barato); em produção troque por 'claude-sonnet-5'
    // (Sonnet usa a busca 'web_search_20260209' e aceita thinking adaptive)
    model: 'claude-haiku-4-5',
    max_tokens: 16000,
    tools: [{ type: 'web_search_20250305', name: 'web_search', max_uses: 5 }],
    system: `${cfg.system}\n\n${cfg.regras}`,
    messages: [{ role: 'user', content: cfg.prompt(agora, dadosMercado, cfg.dataLocal) }],
  })

  const msg = await stream.finalMessage()
  if (msg.stop_reason === 'refusal') throw new Error(`Geração ${lang} recusada pela API`)
  const bruto = msg.content
    .filter((b) => b.type === 'text')
    .map((b) => b.text)
    .join('')
  // Mantém somente o miolo HTML: do primeiro <p> ao último </p>
  const inicio = bruto.indexOf('<p>')
  const fim = bruto.lastIndexOf('</p>')
  if (inicio === -1 || fim === -1) throw new Error(`Conteúdo ${lang} sem HTML esperado:\n` + bruto)
  return bruto.slice(inicio, fim + 4).trim()
}

// ————— template do e-mail (estilo casa de análise: header de marca, grade de
// cotações com setas, selo do termômetro, conteúdo, CTA e rodapé completo).
// Tabelas + estilo inline: é o que renderiza consistente em Gmail/Outlook/Apple.

const VERDE = '#2ecc71'
const VERMELHO = '#e85c4a'
const OURO = '#f0b429'
const LARANJA = '#ff8a47'

function fmtPreco(v) {
  return v >= 1000
    ? '$' + Math.round(v).toLocaleString('en-US')
    : '$' + v.toLocaleString('en-US', { maximumFractionDigits: 2 })
}

function celulaTicker(rotulo, valor, variacao) {
  const sobe = variacao >= 0
  const cor = sobe ? VERDE : VERMELHO
  const seta = sobe ? '&#9650;' : '&#9660;'
  const sinal = sobe ? '+' : ''
  return `<td align="center" style="padding:14px 4px;border-right:1px solid #262626;">
    <div style="font-family:Arial,sans-serif;font-size:11px;color:#8a8a8a;letter-spacing:1px;font-weight:bold;">${rotulo}</div>
    <div style="font-family:Arial,sans-serif;font-size:13px;color:${cor};margin-top:6px;">${seta} ${sinal}${variacao.toFixed(2)}%</div>
    <div style="font-family:Arial,sans-serif;font-size:13px;color:#e0e0e0;margin-top:4px;font-weight:bold;">${valor}</div>
  </td>`
}

function gradeTickers(lang, tickers) {
  if (!tickers) return ''
  const fg = tickers.fearGreed.hoje
  const fgDelta = Number(fg.value) - Number(tickers.fearGreed.ontem.value)
  const celulas = tickers.moedas
    .map((m) => celulaTicker(m.simbolo, fmtPreco(m.preco), m.var24h))
    .join('\n')
  const fgCor = Number(fg.value) >= 55 ? VERDE : Number(fg.value) <= 45 ? VERMELHO : OURO
  return `<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#141414;border:1px solid #262626;border-radius:12px;margin:24px 0 0;">
    <tr>
      ${celulas}
      <td align="center" style="padding:14px 4px;">
        <div style="font-family:Arial,sans-serif;font-size:11px;color:#8a8a8a;letter-spacing:1px;font-weight:bold;">FEAR &amp; GREED</div>
        <div style="font-family:Arial,sans-serif;font-size:13px;color:${fgCor};margin-top:6px;">${fgDelta >= 0 ? '&#9650; +' : '&#9660; '}${fgDelta}</div>
        <div style="font-family:Arial,sans-serif;font-size:13px;color:#e0e0e0;margin-top:4px;font-weight:bold;">${fg.value}/100</div>
      </td>
    </tr>
    <tr><td colspan="${tickers.moedas.length + 1}" align="center" style="padding:0 0 10px;font-family:Arial,sans-serif;font-size:11px;color:#666;">${lang === 'en' ? 'ref. date' : 'data de ref.'} ${LANGS[lang].dataLocal} &middot; 24h</td></tr>
  </table>`
}

function seloTermometro(lang, score) {
  if (score == null) return ''
  const cor = score >= 55 ? VERDE : score <= 45 ? VERMELHO : OURO
  const pct = Math.max(4, Math.min(100, score))
  const rotulo = lang === 'en' ? 'e-trade thermometer' : 'termômetro e-trade'
  return `<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#141414;border:1px solid #262626;border-radius:12px;margin:16px 0 0;">
    <tr>
      <td style="padding:14px 18px;">
        <span style="font-family:Arial,sans-serif;font-size:11px;color:#8a8a8a;letter-spacing:1px;font-weight:bold;text-transform:uppercase;">${rotulo}</span>
        <span style="font-family:Arial,sans-serif;font-size:16px;color:${cor};font-weight:bold;float:right;">${score}/100</span>
        <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="margin-top:10px;"><tr>
          <td width="${pct}%" style="background:linear-gradient(to right,${OURO},${LARANJA});height:6px;border-radius:3px;font-size:0;line-height:0;">&nbsp;</td>
          <td style="background:#262626;height:6px;border-radius:3px;font-size:0;line-height:0;">&nbsp;</td>
        </tr></table>
      </td>
    </tr>
  </table>`
}

export function montarHtml(lang, conteudo, mercado) {
  const cfg = LANGS[lang]
  const marca = lang === 'en' ? 'CRYPTO NEWS' : 'CRIPTO NEWS'
  // remove o primeiro <p> (CRIPTO NEWS — data): o header do e-mail já mostra marca+data
  const miolo = conteudo.replace(/^<p><b>(CRIPTO|CRYPTO) NEWS[^<]*<\/b><\/p>\s*/i, '')
  return `<!DOCTYPE html>
<html lang="${lang === 'en' ? 'en' : 'pt-BR'}">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width,initial-scale=1">
<meta name="color-scheme" content="dark">
<title>${marca}</title>
</head>
<body style="margin:0;padding:0;background:#0d0d0d;">
<center>
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#0d0d0d;">
<tr><td align="center" style="padding:24px 12px;">
<table role="presentation" width="600" cellpadding="0" cellspacing="0" style="max-width:600px;width:100%;">

  <!-- header de marca -->
  <tr><td style="background:#000000;border-radius:16px 16px 0 0;padding:28px 32px 22px;border-bottom:3px solid ${OURO};">
    <span style="font-family:'Courier New',monospace;font-size:24px;font-weight:bold;color:${OURO};letter-spacing:4px;">${marca}</span>
    <div style="font-family:Arial,sans-serif;font-size:13px;color:#8a8a8a;margin-top:8px;">${cfg.dataLocal} &middot; ${cfg.header}</div>
  </td></tr>

  <!-- corpo -->
  <tr><td style="background:#1a1a1a;padding:8px 32px 32px;">
    ${gradeTickers(lang, mercado?.tickers)}
    ${seloTermometro(lang, mercado?.termometro)}

    <div style="font-family:Georgia,serif;font-size:15px;line-height:1.85;color:#e0e0e0;margin-top:28px;">
${miolo.replace(/<b>/g, `<b style="color:${OURO};">`)}
    </div>

    <!-- CTA e-trade.ai -->
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#141414;border:1px solid #262626;border-radius:12px;margin-top:32px;">
      <tr><td align="center" style="padding:24px 24px 26px;">
        <div style="font-family:Arial,sans-serif;font-size:14px;color:#bbbbbb;line-height:1.6;margin-bottom:16px;">${
          lang === 'en'
            ? `<b style="color:${OURO};">e-trade.ai</b> &mdash; send your chart screenshot and get bias, support/resistance levels and a trade plan, in seconds.`
            : `<b style="color:${OURO};">e-trade.ai</b> &mdash; manda o print do gr&aacute;fico e recebe vi&eacute;s, n&iacute;veis e plano de opera&ccedil;&atilde;o, em segundos.`
        }</div>
        <a href="https://etradeai.eullerlolato.com" style="display:inline-block;background:linear-gradient(to right,${OURO},${LARANJA});color:#111111;font-family:Arial,sans-serif;font-weight:bold;font-size:14px;padding:13px 28px;border-radius:999px;text-decoration:none;">${lang === 'en' ? 'try e-trade.ai' : 'testar o e-trade.ai'}</a>
      </td></tr>
    </table>
  </td></tr>

  <!-- rodapé -->
  <tr><td style="background:#111111;border-radius:0 0 16px 16px;padding:24px 32px;border-top:1px solid #262626;">
    <div style="font-family:Arial,sans-serif;font-size:12px;color:#777;line-height:1.7;text-align:center;">
      ${cfg.footer}<br>
      ${
        lang === 'en'
          ? 'Nothing here is financial advice &mdash; it is market analysis. Do your own research.'
          : 'Nada aqui &eacute; recomenda&ccedil;&atilde;o de investimento &mdash; &eacute; an&aacute;lise de mercado. Fa&ccedil;a sua pr&oacute;pria pesquisa.'
      }<br><br>
      <a href="https://noticias.eullerlolato.com${lang === 'en' ? '/en' : ''}" style="color:${OURO};text-decoration:none;">${lang === 'en' ? 'read on the web' : 'ler no site'}</a>
      &nbsp;&middot;&nbsp;
      <a href="mailto:news@noticias.eullerlolato.com?subject=Unsubscribe" style="color:#777;">${cfg.unsubscribe}</a>
    </div>
  </td></tr>

</table>
</td></tr>
</table>
</center>
</body>
</html>`
}

// Salva a edição no repo pro site publicar (o push acontece uma vez só, no final)
function salvarEdicao(lang, conteudo) {
  const cfg = LANGS[lang]
  const textoPlano = conteudo.replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim()
  const resumo = textoPlano.replace(/^(CRIPTO|CRYPTO) NEWS — \S+\s*/, '').slice(0, 220)

  const edicao = {
    date: dataIso,
    title: cfg.tituloEdicao(cfg.dataLocal),
    description: resumo,
    html: conteudo,
  }

  const dir = path.join(process.cwd(), 'content', cfg.dir)
  fs.mkdirSync(dir, { recursive: true })
  fs.writeFileSync(path.join(dir, `${dataIso}.json`), JSON.stringify(edicao, null, 2) + '\n')
  console.log(`  Edição salva em content/${cfg.dir}/${dataIso}.json`)
}

function publicarNoSite() {
  try {
    execSync('git add content', { stdio: 'pipe' })
    execSync(`git commit -m "Edicoes ${dataIso}"`, { stdio: 'pipe' })
    execSync('git push origin main', { stdio: 'pipe' })
    console.log('Publicado no site (git push feito, Vercel vai rebuildar).')
  } catch (e) {
    console.warn('Aviso: não consegui dar git push das edições —', e.message)
  }
}

async function buscarContatos(audienceId) {
  const res = await fetch(`https://api.resend.com/audiences/${audienceId}/contacts`, {
    headers: { Authorization: `Bearer ${RESEND_API_KEY}` },
  })
  if (!res.ok) throw new Error(`Erro ao buscar contatos: ${res.status} ${await res.text()}`)
  const { data } = await res.json()
  return data.filter((c) => !c.unsubscribed)
}

async function enviar(cfg, email, html) {
  const res = await fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${RESEND_API_KEY}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      from: cfg.from,
      to: email,
      subject: cfg.assunto(cfg.dataLocal),
      html,
    }),
  })
  if (!res.ok) throw new Error(`${email}: ${res.status} ${await res.text()}`)
}

async function main() {
  if (!RESEND_API_KEY || !LANGS.pt.audienceId || !LANGS.en.audienceId)
    throw new Error('RESEND_API_KEY / RESEND_AUDIENCE_ID / RESEND_AUDIENCE_ID_EN ausentes')
  if (!process.env.ANTHROPIC_API_KEY) throw new Error('ANTHROPIC_API_KEY ausente')

  for (const lang of ['pt', 'en']) {
    const cfg = LANGS[lang]
    console.log(`\n[${lang.toUpperCase()}] Buscando dados de mercado em tempo real...`)
    const mercado = await buscarDadosMercado(lang)
    console.log(mercado.dados)
    console.log(`\n[${lang.toUpperCase()}] Gerando edição de ${cfg.dataLocal}...`)
    const conteudo = await gerarConteudo(lang, mercado.dados)

    if (DRY_RUN) {
      console.log(`\n--- DRY RUN [${lang.toUpperCase()}] ---\n`)
      console.log(conteudo)
      console.log('\n--- fim ---')
      continue
    }

    salvarEdicao(lang, conteudo)

    const html = montarHtml(lang, conteudo, mercado)
    const contatos = await buscarContatos(cfg.audienceId)
    console.log(`  Enviando para ${contatos.length} contatos...`)
    let ok = 0
    for (const c of contatos) {
      try {
        await enviar(cfg, c.email, html)
        ok++
        console.log(`    ✓ ${c.email}`)
      } catch (e) {
        console.error(`    ✗ ${e.message}`)
      }
      await new Promise((r) => setTimeout(r, 600)) // rate limit do Resend (2 req/s)
    }
    console.log(`  [${lang.toUpperCase()}] Concluído: ${ok}/${contatos.length} enviados.`)
  }

  if (!DRY_RUN) publicarNoSite()
}

// roda só quando executado direto (permite importar montarHtml em testes/preview)
import { pathToFileURL } from 'node:url'
if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  main().catch((e) => {
    console.error(e)
    process.exit(1)
  })
}

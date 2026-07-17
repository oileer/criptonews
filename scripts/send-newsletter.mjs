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
const ETRADE_API = process.env.ETRADE_API_URL || 'http://100.123.103.94:8787'

async function buscarDadosMercado(lang = 'pt') {
  try {
    const res = await fetch(`${ETRADE_API}/v1/newsletter/draft?lang=${lang}`, {
      signal: AbortSignal.timeout(120000),
      headers: { 'x-api-key': process.env.ETRADE_API_KEY ?? '' },
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
    return dados
  } catch (e) {
    console.warn('  API e-trade.ai indisponível (' + e.message + ') — usando fetch direto')
    return buscarDadosMercadoDireto()
  }
}

async function buscarDadosMercadoDireto() {
  const [cg, fg] = await Promise.all([
    fetch(
      'https://api.coingecko.com/api/v3/coins/markets?vs_currency=usd&ids=bitcoin,ethereum,solana&price_change_percentage=24h,7d'
    ).then((r) => r.json()),
    fetch('https://api.alternative.me/fng/?limit=2').then((r) => r.json()),
  ])

  const linhas = cg.map(
    (m) =>
      `${m.symbol.toUpperCase()}: US$ ${m.current_price.toLocaleString('en-US')} ` +
      `(24h: ${m.price_change_percentage_24h_in_currency?.toFixed(2)}% | ` +
      `7d: ${m.price_change_percentage_7d_in_currency?.toFixed(2)}%) | ` +
      `high 24h: US$ ${m.high_24h.toLocaleString('en-US')} | low 24h: US$ ${m.low_24h.toLocaleString('en-US')}`
  )
  const [fgHoje, fgOntem] = fg.data
  linhas.push(
    `Fear & Greed: ${fgHoje.value} (${fgHoje.value_classification}) | yesterday: ${fgOntem.value} (${fgOntem.value_classification})`
  )
  return linhas.join('\n')
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

function montarHtml(lang, conteudo) {
  const cfg = LANGS[lang]
  return `<!DOCTYPE html>
<html>
<head>
<meta charset="UTF-8">
<style>
  body { font-family: Georgia, serif; max-width: 600px; margin: 0 auto; background: #0d0d0d; }
  .container { background: #1a1a1a; padding: 40px; border-radius: 8px; margin: 20px auto; }
  .header { border-bottom: 3px solid #f0b429; padding-bottom: 16px; margin-bottom: 24px; }
  .header h1 { color: #f0b429; font-size: 22px; margin: 0; letter-spacing: 3px; font-family: monospace; }
  .header p { color: #666; font-size: 13px; margin: 6px 0 0; }
  .content { color: #e0e0e0; line-height: 1.9; font-size: 15px; }
  .content b { color: #f0b429; }
  .sponsor { border-top: 1px solid #333; margin-top: 32px; padding-top: 24px; text-align: center; }
  .sponsor p { color: #999; font-size: 13px; margin: 0 0 12px; line-height: 1.6; }
  .sponsor a.btn { display: inline-block; background: linear-gradient(to right, #f0b429, #ff8a47); color: #111; font-weight: bold; padding: 12px 24px; border-radius: 999px; text-decoration: none; font-size: 14px; }
  .footer { border-top: 1px solid #333; margin-top: 32px; padding-top: 16px; color: #555; font-size: 12px; text-align: center; }
  .footer a { color: #555; }
</style>
</head>
<body>
<div class="container">
  <div class="header">
    <h1>${lang === 'en' ? 'CRYPTO NEWS' : 'CRIPTO NEWS'}</h1>
    <p>${cfg.dataLocal} · ${cfg.header}</p>
  </div>
  <div class="content">
${conteudo}
  </div>
  <div class="sponsor">
    <p>${lang === 'en'
      ? '<b style="color:#f0b429">e-trade.ai</b> — send your chart screenshot and get bias, support/resistance levels and a trade plan, in seconds.'
      : '<b style="color:#f0b429">e-trade.ai</b> — manda o print do gráfico e recebe viés, níveis e plano de operação, em segundos.'}</p>
    <a class="btn" href="https://etradeai.eullerlolato.com">${lang === 'en' ? 'try e-trade.ai' : 'testar o e-trade.ai'}</a>
  </div>
  <div class="footer">
    <p>${cfg.footer}</p>
    <p><a href="mailto:news@noticias.eullerlolato.com?subject=Unsubscribe">${cfg.unsubscribe}</a></p>
  </div>
</div>
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
    const dadosMercado = await buscarDadosMercado(lang)
    console.log(dadosMercado)
    console.log(`\n[${lang.toUpperCase()}] Gerando edição de ${cfg.dataLocal}...`)
    const conteudo = await gerarConteudo(lang, dadosMercado)

    if (DRY_RUN) {
      console.log(`\n--- DRY RUN [${lang.toUpperCase()}] ---\n`)
      console.log(conteudo)
      console.log('\n--- fim ---')
      continue
    }

    salvarEdicao(lang, conteudo)

    const html = montarHtml(lang, conteudo)
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

main().catch((e) => {
  console.error(e)
  process.exit(1)
})

// Robô da Cripto News — gera a edição do dia com IA e dispara via Resend.
// Uso:  npm run send            (envia pra audience inteira)
//       npm run send:dry        (gera e mostra no console, não envia)
// Env:  RESEND_API_KEY, RESEND_AUDIENCE_ID, ANTHROPIC_API_KEY (.env.local)

import Anthropic from '@anthropic-ai/sdk'
import fs from 'node:fs'
import path from 'node:path'
import { execSync } from 'node:child_process'

const RESEND_API_KEY = process.env.RESEND_API_KEY
const AUDIENCE_ID = process.env.RESEND_AUDIENCE_ID
const FROM = 'Cripto News <news@noticias.eullerlolato.com>'
const DRY_RUN = process.argv.includes('--dry-run')

const hoje = new Date().toLocaleDateString('pt-BR', { timeZone: 'America/Sao_Paulo' })

// Dados de mercado em tempo real — a IA fica proibida de citar preços de outra fonte
async function buscarDadosMercado() {
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
      `máx 24h: US$ ${m.high_24h.toLocaleString('en-US')} | mín 24h: US$ ${m.low_24h.toLocaleString('en-US')}`
  )
  const [fgHoje, fgOntem] = fg.data
  linhas.push(
    `Fear & Greed: ${fgHoje.value} (${fgHoje.value_classification}) | ontem: ${fgOntem.value} (${fgOntem.value_classification})`
  )
  return linhas.join('\n')
}

async function gerarConteudo(dadosMercado) {
  const client = new Anthropic()

  const agora = new Date().toLocaleString('pt-BR', { timeZone: 'America/Sao_Paulo' })

  const stream = client.messages.stream({
    // Haiku 4.5 para testes (mais barato); em produção troque por 'claude-sonnet-5'
    // (Sonnet usa a busca 'web_search_20260209' e aceita thinking adaptive)
    model: 'claude-haiku-4-5',
    max_tokens: 16000,
    tools: [{ type: 'web_search_20250305', name: 'web_search', max_uses: 5 }],
    system: `Você é o redator da Cripto News, newsletter diária em português para traders brasileiros de criptomoedas. Tom direto, opinativo, com gíria de trader, sem hype. Sempre traduza a notícia em "o que isso significa pra quem opera".

REGRAS INVIOLÁVEIS DE SAÍDA:
- Sua resposta vai DIRETO para a caixa de entrada dos assinantes, sem revisão humana. Não é um chat.
- NUNCA mencione suas ferramentas, buscas, cotas, falhas técnicas ou o seu processo. NUNCA faça perguntas ao leitor nem ofereça "rodar de novo".
- Se a busca de notícias falhar ou retornar pouco, escreva a edição normalmente usando apenas os dados de mercado fornecidos, mantendo a seção DESTAQUES DO DIA com análise técnica/de sentimento — sem avisar o leitor de nada.
- A resposta deve conter APENAS os parágrafos <p> da edição, do primeiro ao último, nada antes nem depois.`,
    messages: [
      {
        role: 'user',
        content: `Agora são ${agora} (horário de Brasília).

DADOS DE MERCADO EM TEMPO REAL (fonte oficial — use SOMENTE estes números para preços, variações e sentimento; NUNCA cite preço vindo de notícia ou busca):
${dadosMercado}

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
      },
    ],
  })

  const msg = await stream.finalMessage()
  if (msg.stop_reason === 'refusal') throw new Error('Geração recusada pela API')
  const bruto = msg.content
    .filter((b) => b.type === 'text')
    .map((b) => b.text)
    .join('')
  // Mantém somente o miolo HTML: do primeiro <p> ao último </p>
  const inicio = bruto.indexOf('<p>')
  const fim = bruto.lastIndexOf('</p>')
  if (inicio === -1 || fim === -1) throw new Error('Conteúdo gerado sem HTML esperado:\n' + bruto)
  return bruto.slice(inicio, fim + 4).trim()
}

function montarHtml(conteudo) {
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
  .footer { border-top: 1px solid #333; margin-top: 32px; padding-top: 16px; color: #555; font-size: 12px; text-align: center; }
  .footer a { color: #555; }
</style>
</head>
<body>
<div class="container">
  <div class="header">
    <h1>CRIPTO NEWS</h1>
    <p>${hoje} · Análise diária do mercado</p>
  </div>
  <div class="content">
${conteudo}
  </div>
  <div class="footer">
    <p>Você recebe porque se cadastrou na Cripto News.</p>
    <p><a href="mailto:news@noticias.eullerlolato.com?subject=Cancelar%20inscricao">Cancelar inscrição</a></p>
  </div>
</div>
</body>
</html>`
}

// Publica a edição no site: salva o JSON em content/edicoes e dá push (Vercel rebuilda)
function publicarNoSite(conteudo) {
  const dataIso = new Date()
    .toLocaleDateString('en-CA', { timeZone: 'America/Sao_Paulo' }) // YYYY-MM-DD
  const primeiroP = conteudo.replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim()
  const resumo = primeiroP.replace(/^CRIPTO NEWS — \S+\s*/, '').slice(0, 220)

  const edicao = {
    date: dataIso,
    title: `Cripto News — ${hoje}: o mercado cripto do dia`,
    description: resumo,
    html: conteudo,
  }

  const dir = path.join(process.cwd(), 'content', 'edicoes')
  fs.mkdirSync(dir, { recursive: true })
  const arquivo = path.join(dir, `${dataIso}.json`)
  fs.writeFileSync(arquivo, JSON.stringify(edicao, null, 2) + '\n')
  console.log(`Edição salva em content/edicoes/${dataIso}.json`)

  try {
    execSync(`git add "${arquivo}"`, { stdio: 'pipe' })
    execSync(`git commit -m "Edicao ${dataIso}"`, { stdio: 'pipe' })
    execSync('git push origin main', { stdio: 'pipe' })
    console.log('Publicado no site (git push feito, Vercel vai rebuildar).')
  } catch (e) {
    console.warn('Aviso: não consegui dar git push da edição —', e.message)
  }
}

async function buscarContatos() {
  const res = await fetch(`https://api.resend.com/audiences/${AUDIENCE_ID}/contacts`, {
    headers: { Authorization: `Bearer ${RESEND_API_KEY}` },
  })
  if (!res.ok) throw new Error(`Erro ao buscar contatos: ${res.status} ${await res.text()}`)
  const { data } = await res.json()
  return data.filter((c) => !c.unsubscribed)
}

async function enviar(email, html) {
  const res = await fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${RESEND_API_KEY}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      from: FROM,
      to: email,
      subject: `Cripto News · ${hoje}`,
      html,
    }),
  })
  if (!res.ok) throw new Error(`${email}: ${res.status} ${await res.text()}`)
}

async function main() {
  if (!RESEND_API_KEY || !AUDIENCE_ID) throw new Error('RESEND_API_KEY / RESEND_AUDIENCE_ID ausentes')
  if (!process.env.ANTHROPIC_API_KEY) throw new Error('ANTHROPIC_API_KEY ausente')

  console.log('Buscando dados de mercado em tempo real...')
  const dadosMercado = await buscarDadosMercado()
  console.log(dadosMercado)

  console.log(`\nGerando edição de ${hoje}...`)
  const conteudo = await gerarConteudo(dadosMercado)
  const html = montarHtml(conteudo)

  if (DRY_RUN) {
    console.log('\n--- DRY RUN — conteúdo gerado ---\n')
    console.log(conteudo)
    console.log('\n--- fim (nenhum e-mail enviado) ---')
    return
  }

  publicarNoSite(conteudo)

  const contatos = await buscarContatos()
  console.log(`Enviando para ${contatos.length} contatos...`)
  let ok = 0
  for (const c of contatos) {
    try {
      await enviar(c.email, html)
      ok++
      console.log(`  ✓ ${c.email}`)
    } catch (e) {
      console.error(`  ✗ ${e.message}`)
    }
    await new Promise((r) => setTimeout(r, 600)) // rate limit do Resend (2 req/s)
  }
  console.log(`Concluído: ${ok}/${contatos.length} enviados.`)
}

main().catch((e) => {
  console.error(e)
  process.exit(1)
})

// Robô da Cripto News — gera a edição do dia com IA e dispara via Resend.
// Uso:  npm run send            (envia pra audience inteira)
//       npm run send:dry        (gera e mostra no console, não envia)
// Env:  RESEND_API_KEY, RESEND_AUDIENCE_ID, ANTHROPIC_API_KEY (.env.local)

import Anthropic from '@anthropic-ai/sdk'

const RESEND_API_KEY = process.env.RESEND_API_KEY
const AUDIENCE_ID = process.env.RESEND_AUDIENCE_ID
const FROM = 'Cripto News <news@noticias.eullerlolato.com>'
const DRY_RUN = process.argv.includes('--dry-run')

const hoje = new Date().toLocaleDateString('pt-BR', { timeZone: 'America/Sao_Paulo' })

async function gerarConteudo() {
  const client = new Anthropic()

  const stream = client.messages.stream({
    model: 'claude-opus-4-8',
    max_tokens: 64000,
    thinking: { type: 'adaptive' },
    tools: [{ type: 'web_search_20260209', name: 'web_search', max_uses: 8 }],
    system: `Você é o redator da Cripto News, newsletter diária em português para traders brasileiros de criptomoedas. Tom direto, opinativo, com gíria de trader, sem hype. Sempre traduza a notícia em "o que isso significa pra quem opera".`,
    messages: [
      {
        role: 'user',
        content: `Pesquise as notícias mais importantes do mercado cripto das últimas 24 horas (Bitcoin, Ethereum, altcoins, regulação, instituições, ETFs, funding rate) e escreva a edição de hoje (${hoje}) da Cripto News.

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
  // Descarta qualquer comentário do modelo antes do início do HTML
  const inicio = bruto.indexOf('<p>')
  if (inicio === -1) throw new Error('Conteúdo gerado sem HTML esperado:\n' + bruto)
  return bruto.slice(inicio).trim()
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

  console.log(`Gerando edição de ${hoje}...`)
  const conteudo = await gerarConteudo()
  const html = montarHtml(conteudo)

  if (DRY_RUN) {
    console.log('\n--- DRY RUN — conteúdo gerado ---\n')
    console.log(conteudo)
    console.log('\n--- fim (nenhum e-mail enviado) ---')
    return
  }

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

# Cripto News — Estratégia de Crescimento

Site: https://noticias.eullerlolato.com · Repo: github.com/oileer/criptonews
Contexto: começando do zero de audiência (07/2026). Newsletter diária 06h gerada por IA (scripts/send-newsletter.mjs).

## Princípio central
Um pipeline, quatro canais: o mesmo robô que envia o e-mail publica a edição no site (SEO+GEO) e gera o roteiro dos vídeos. Tarefa manual diária: gravar/postar o vídeo.

## Canais (ordem de prioridade)

### 1. Site + SEO (base de tudo)
- Arquivo de edições em `/edicoes` — cada dia uma página nova indexada
- Alvos: "análise bitcoin hoje", "mercado cripto hoje", "notícias bitcoin [data]"
- ~180 páginas em 6 meses = tráfego orgânico perpétuo
- Fluxo: cadastrou o e-mail → redireciona pro blog (retenção + prova de valor imediata)

### 2. GEO — SEO de IA (janela aberta em PT-BR)
- IAs (ChatGPT, Perplexity, Gemini) citam fontes datadas, estruturadas e factuais
- Implementado: JSON-LD NewsArticle por edição, sitemap, robots, llms.txt
- Conteúdo citável: preços com data/hora, Fear & Greed, níveis técnicos

### 3. YouTube Shorts (principal motor de descoberta)
- Short diário 60s: "O mercado cripto hoje em 1 minuto"
- Roteiro = a própria edição do dia (abertura + destaques + ponto de atenção)
- Consistência > produção: 1/dia por 90 dias
- CTA: "análise completa grátis no e-mail às 6h, link na descrição"

### 4. Instagram Reels + carrossel
- Mesmo vídeo do Short repostado + carrossel com os destaques
- 1 produção → 3 canais

### 5. Meta Ads (só depois de validar conversão orgânica)
- Campanha de cadastro pra LP, R$ 10–20/dia inicial
- Criativo: print real da newsletter na inbox + "sem hype, de graça, 6h"
- Meta de CPL: R$ 1–3

### 6. Indicação (quando tiver centenas de assinantes)
- "Indique 3 amigos e ganhe X"

## Global (EN)
- Site bilíngue: `/` (pt-BR) e `/en` (en-US) com hreflang cruzado em todas as páginas
- Audiences separadas no Resend: "Cripto News" (PT) e "Crypto News EN" (b0478ab8-721f-4ffc-be3f-0f498ee43f6a)
- Robô gera e envia as duas edições por dia; blogs em /edicoes e /en/editions

## Status
- [x] Blog de edições com SEO/GEO (PT + EN, hreflang, sitemap, llms.txt)
- [x] Redirect pós-cadastro pro blog (por idioma)
- [x] GA4 (G-Z5SYK2MJLS) + Vercel Analytics
- [x] Robô bilíngue (PT + EN)
- [x] Deploy Vercel em https://noticias.eullerlolato.com (07/07/2026)

## PRÓXIMAS AÇÕES (noite de 07/07)

### 1. Consertar o formulário em produção (URGENTE — está quebrado)
Vercel → projeto → Settings → Environment Variables → adicionar nos 3 ambientes:
- `RESEND_API_KEY` (a mesma do .env.local)
- `RESEND_AUDIENCE_ID` = e1e7c329-0033-497f-a68a-e37e8b393a5f
- `RESEND_AUDIENCE_ID_EN` = b0478ab8-721f-4ffc-be3f-0f498ee43f6a
Depois: Deployments → Redeploy. Testar cadastro na home PT e na /en.

### 2. Créditos Anthropic
Recarregar em platform.claude.com → Plans & Billing (robô está sem créditos).
Modelo atual: Haiku 4.5 (~US$ 0,05-0,08/dia as 2 edições).

### 3. Configurar a CPU de casa (ver SETUP.md — passo a passo completo)
- Clonar repo, npm install, criar .env.local (4 keys)
- Autenticar git (gh auth login) — o robô dá push das edições
- `npm run send:dry` pra validar → `npm run send` pra testar de verdade
- Agendar 06h: comando schtasks pronto no SETUP.md

### 4. Registrar o site nos buscadores (SEO)
- Google Search Console: adicionar noticias.eullerlolato.com, enviar sitemap.xml
- Bing Webmaster Tools: idem (alimenta ChatGPT/Copilot — importante pro GEO)

### 5. Próxima fase (com o Claude)
Automação de posts Instagram + YouTube: roteiro do Short/Reels gerado junto
com a edição diária → pipeline de publicação.

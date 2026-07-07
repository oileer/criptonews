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

## Próximos passos
- [x] Blog de edições com SEO/GEO (PT + EN, hreflang, sitemap, llms.txt)
- [x] Redirect pós-cadastro pro blog (por idioma)
- [x] GA4 (G-Z5SYK2MJLS) + Vercel Analytics
- [x] Robô bilíngue (PT + EN)
- [ ] Deploy Vercel + apontar noticias.eullerlolato.com
- [ ] Agendar envio diário 06h (ver SETUP.md)
- [ ] Automação de postagem: Instagram e YouTube (próxima fase)

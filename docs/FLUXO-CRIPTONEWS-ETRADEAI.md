# Fluxo — Cripto News & e-trade.ai

_Atualizado em 21/07/2026_

---

## 1. Cripto News — fluxo diário (100% automático, roda no servidor kody)

Cron `0 6 * * *` (crontab do kody) dispara `~/apps/criptonews/run-daily.sh`, que executa em cadeia:

1. **`git pull --rebase origin main`** — sincroniza o repo antes de gerar qualquer coisa.

2. **`npm run send`** (`scripts/send-newsletter.mjs`):
   - Busca dados ao vivo na API do e-trade.ai (Termômetro, Fear & Greed, funding, preços BTC/ETH/SOL) — com fallback direto pra fontes públicas se a API cair.
   - Claude gera a análise do "analista-chefe" e o corpo da edição, em **PT e EN**.
   - Salva o JSON em `content/edicoes/AAAA-MM-DD.json` e `content/edicoes-en/AAAA-MM-DD.json`.
   - Envia por e-mail via **Resend**, em audiences separadas (PT e EN).
   - Publica a edição no blog (`/edicoes` e `/en/editions`) → push no GitHub → **Vercel rebuilda** (SEO + GEO: JSON-LD NewsArticle, sitemap, llms.txt).

3. **`scripts/gen-social-art.mjs`**:
   - Gera duas imagens por dia: **feed** (1080×1080) e **story** (1080×1920).
   - Layout gelo (#fafafa, mesma cor de fundo do site), logos **Cripto News** + **e-trade.ai** lado a lado (losango vetorial, sem depender de PNG), grade de tickers BTC/ETH/SOL/F&G, barra do Termômetro, destaques do dia e CTA "**link na bio**".
   - Salva em `content/social/AAAA-MM-DD-feed.png` e `-story.png`.

4. **`scripts/post-social.mjs`** — ⏸ **ainda não existe.**
   Esse é o único elo que falta pra fechar o pipeline: publicar automaticamente no Instagram, Facebook e Threads. O `run-daily.sh` já tem uma guarda (`if [ -f scripts/post-social.mjs ]`) pra não quebrar o cron enquanto o script não existe.

5. Commita e pusha as artes geradas no GitHub.

### O que falta pra fechar 100%
Criar o app na **Meta for Developers** (Instagram Graph API + Threads API), vincular o Instagram a uma Página do Facebook, gerar token de longa duração com as permissões `instagram_content_publish`, `pages_show_list`, `pages_read_engagement`, `threads_content_publish`, e me passar o token + IDs da conta/página. Aí eu construo o `post-social.mjs` e o pipeline fica ponta a ponta automático. YouTube Shorts fica pra fase 2 (credencial OAuth do Google separada, com revisão do app).

---

## 2. e-trade.ai — dois fluxos rodando em paralelo

### Market Brain (API — `etrade-api`, pm2 no kody)
- Roda como processo pm2 (`etrade-api`), online e estável.
- Coleta dados de mercado a cada 15 minutos: overview (top 50, dominância, funding, stablecoins), Fear & Greed, amplitude.
- Calcula o **Termômetro e-trade.ai (0–100)**: F&G 40% + tendência BTC 30% + funding 15% + amplitude 15%.
- Roda análise diária às 5:30 (cache), radar de anomalias, backtest do termômetro.
- Endpoint `newsletter/draft` alimenta o robô do Cripto News.

### App do analyser (Next.js, deploy na Vercel)
- Usuário sobe o print de um gráfico → Claude Vision → schema Zod estruturado (viés, suporte/resistência, plano de entrada/stop/alvo) → salva no Firestore → aparece no histórico.
- Auth via Firebase (email/senha + Google).
- Firestore Rules travadas por `uid` — cada usuário só vê o próprio dado.

### Sistema de créditos
- **1 crédito grátis** por padrão pra usuário novo.
- **Plano HashHedge**: quem compra um desafio pelo link de afiliado (`hashhedge.com?fpr=qtylsx`) recebe créditos diários por 30 dias, via postback/webhook. Régua configurável por valor de mesa (ex: mesa $5K = 5 análises/dia).
- **Pacotes avulsos** via Pix (AbacatePay) como alternativa.
- **Admin** (`eullerlolatosmo@gmail.com`) tem créditos ilimitados — nunca debita.
- **Concessão manual** (rota `/api/admin/conceder-creditos`, criada em 21/07): permite dar créditos diários permanentes (~10 anos de validade) pra e-mails específicos, sem passar pela HashHedge. Usada pra:
  - ✅ `barpfernandopro@gmail.com` — 10 créditos/dia ativos.
  - ⏸ `igormeneghini@icloud.com` — pendente. Ele recebe a newsletter normalmente (é assinante no Resend), mas **nunca fez login no e-trade.ai**, então ainda não existe como usuário no Firebase Auth de lá. Assim que ele logar uma vez no site, é só rodar a concessão de novo.

### Funil de negócio
Cripto News (tráfego) → e-trade.ai (freemium, baixo ticket) → upsell HashHedge (mesas proprietárias, afiliado) → volta em créditos de análise.

### Pendência conhecida
Conforme o `PLAN.md` de 17/07: o **postback da HashHedge** (webhook que credita automaticamente quem compra desafio pelo link) ainda precisava ser configurado no painel deles + variável de ambiente na Vercel. Não foi reconfirmado desde então — vale checar se já foi resolvido.

---

## Resumo rápido

| | Cripto News | e-trade.ai |
|---|---|---|
| **Automação** | 100% ponta a ponta, exceto post em redes sociais | Market Brain 100% automático; créditos por afiliado/manual |
| **Roda em** | kody (cron 6h) → Vercel (blog) | kody (API, pm2) + Vercel (app) |
| **Pendência principal** | Credenciais Meta (IG/FB/Threads) pro `post-social.mjs` | Confirmar postback HashHedge configurado |

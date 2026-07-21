# IA implementada na VPS (kody)

Documentação de como a IA está configurada no servidor `kody` (acesso via Tailscale `100.97.40.28`), para uso dos agentes que trabalham no **criptonews** e no **etrade.ai**.

## Resumo

A VPS roda **duas IAs em paralelo**, com papéis diferentes:

1. **Claude (Anthropic API)** — é a IA de produção, usada dentro do código dos dois apps para gerar conteúdo real (análises de mercado, newsletter).
2. **Ollama local (Qwen3:8b)** — instalado no servidor, rodando como serviço, mas **ainda não integrado** a nenhum app. Disponível só em `localhost:11434` (não exposto para fora da VPS).

---

## 1. Claude (Anthropic) — em produção

### etrade-api (porta 8787, pm2 `etrade-api`, status: online)
- Caminho: `~/apps/etrade-api`
- SDK: `@anthropic-ai/sdk` v0.39.0
- Modelo: `claude-haiku-4-5` (configurável via env `ETRADE_MODEL`, `src/config.mjs:23`)
- É o "cérebro" do e-trade.ai: gera as análises diárias de mercado.
- Endpoints principais (`src/server.mjs`):
  - `GET /v1/health` — status (testado, respondendo ok)
  - `GET /v1/analysis/daily` — análise diária gerada por IA (protegido por auth)
  - `GET /v1/market/overview`, `/v1/market/score`, `/v1/signals/anomalies`
  - `GET /v1/newsletter/draft`, `/v1/reports/weekly`
- Dados gerados ficam salvos em `data/analyses/*.json` e `data/reports/weekly-*.json`.

### criptonews (cron diário 06h, não é processo pm2 contínuo)
- Caminho: `~/apps/criptonews`
- SDK: `@anthropic-ai/sdk` v0.110.0
- Modelo: `claude-haiku-4-5` em `scripts/send-newsletter.mjs:169` (comentário no código já prevê trocar para `claude-sonnet-5` em produção, ainda não trocado)
- Usado para redigir a newsletter diária de cripto enviada por e-mail.
- Fluxo (`run-daily.sh`, cron `0 6 * * *`):
  1. `git pull` do repo
  2. `npm run send` → gera e envia a newsletter (chama Claude)
  3. `gen-social-art.mjs` → gera artes sociais
  4. `post-social.mjs` (se existir) → posta nas redes
  5. commit + push das artes geradas

### Credenciais
Ambos os apps têm suas API keys da Anthropic em arquivos `.env` locais (`etrade-api/.env`, `criptonews/.env.local`) — não versionados, não expostos.

---

## 2. Ollama local (Qwen3:8b) — instalado, ocioso

- Serviço systemd `ollama.service`, ativo desde 18/07/2026, habilitado no boot.
- Escuta só em `127.0.0.1:11434` (localhost da VPS, não acessível de fora).
- Modelo baixado: `qwen3:8b` (5.2 GB).
- Testado e respondendo normalmente (primeira chamada demora ~19s pra carregar o modelo na RAM; chamadas seguintes são mais rápidas enquanto ele fica "quente").
- **Ainda não está integrado** em `etrade-api` nem em `criptonews` — nenhum dos dois faz chamadas para `localhost:11434`. Hoje ele existe só como serviço disponível, sem consumidor.
- Uso pretendido (a confirmar com o Euller): possivelmente para tarefas mais baratas/locais/privadas que não precisem da qualidade do Claude, liberando uso de créditos da API Anthropic.

---

## Para quem for mexer no código

- Se for integrar o Ollama em algum dos apps, o endpoint é `http://localhost:11434/api/generate` (formato Ollama padrão, `model: "qwen3:8b"`).
- Se for trocar de modelo Claude, `etrade-api` já lê de env (`ETRADE_MODEL`); `criptonews` está hardcoded em `send-newsletter.mjs:169`.
- Acesso ao servidor: SSH `kody-tailscale` (Tailscale) — ver skill `/ssh` no Claude Code.

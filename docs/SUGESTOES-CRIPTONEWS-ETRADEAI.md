# Sugestões — Cripto News + e-trade.ai (frontend, backend, VPS, produto)

_Análise de 21/07/2026, com base no código real dos dois repos, na infra do kody e no histórico de operação._

---

## 0. Leitura de cenário (a visão honesta)

O ecossistema está **tecnicamente acima da média** pro estágio: pipeline diário automático, API própria de dados, IA em tudo, funil desenhado. O que ele ainda não tem é **audiência** (2 assinantes PT) e **receita destravada** (postback HashHedge pendente). Então a regra de priorização que usei em tudo abaixo:

> **Crescimento e receita > features novas > arquitetura.**
> Nada de over-engineering em escala que não existe ainda. As sugestões de infra são só as que evitam incêndio (e o incêndio de 17-18/07 — blog 2 dias sem atualizar em silêncio — já mostrou onde dói).

---

## 1. Quick wins — essa semana (impacto alto, esforço baixo)

| # | O quê | Por quê | Esforço |
|---|-------|---------|---------|
| 1 | **Watchdog + alerta do cron das 6h** | A falha de 17-18/07 foi silenciosa por 2 dias. Um cron a cada 10min checa: snapshot da API < 30min? edição de hoje existe depois das 6h20? Se não → e-mail via Resend (a key já está no kody). Nunca mais descobrir atrasado. | 1h |
| 2 | **Créditos pendentes auto-aplicáveis** | O caso Igor vira regra: doc `concessoes/{email}` no Firestore; no primeiro login, `/api/creditos` checa pelo e-mail verificado e aplica sozinho. Concessão manual deixa de depender de "ele já logou?". | 1h |
| 3 | **Vender o relatório semanal que JÁ é gerado** | O cron de domingo 18h já produz o relatório premium — e ninguém vende. Página de venda + Pix (AbacatePay já integrado) + segmento no Resend. Receita com custo marginal zero. | 1 dia |
| 4 | **Terminar o postback HashHedge** | É a única coisa entre o funil e a receita de afiliado. Falta: configurar postback no painel HashHedge + `HASHHEDGE_POSTBACK_SECRET` na Vercel. O código já está pronto e idempotente. | 30min (seu) |
| 5 | **RSS + Google News + Bing** | Edições diárias datadas = perfil ideal pro Google News/Discover. RSS é trivial de gerar dos JSONs. Bing alimenta ChatGPT/Copilot (GEO). Multiplicador orgânico dormindo. | 2h |
| 6 | **Página `/bitcoin-hoje`** (e `/ethereum-hoje`) | "bitcoin hoje" é keyword gigante no BR. Página programática: preço ao vivo (API própria), termômetro, trecho da edição do dia, atualização diária automática. É o melhor tiro de SEO disponível. Só pros top ativos (não fazer 50 páginas rasas). | 1 dia |
| 7 | **Rotacionar credenciais expostas** | A service account do Firebase e a key da Anthropic passaram por chats/arquivos. Boa higiene: gerar key nova da service account (console Firebase → contas de serviço), rotacionar a Anthropic, atualizar Vercel + kody. | 30min (seu) |
| 8 | **Unsubscribe de verdade + List-Unsubscribe** | Hoje o descadastro é `mailto:`. Gmail exige one-click unsubscribe pra remetentes em volume — configurar cedo é barato e protege a entregabilidade quando a lista crescer. Endpoint assinado + header. | 2h |

---

## 2. VPS & Backend (kody)

### 2.1 Confiabilidade
- **`run-daily.sh` com `set -euo pipefail` + status por etapa** — hoje qualquer etapa pode falhar e as seguintes rodam por cima. Registrar OK/FALHA por passo e mandar o resumo no alerta do watchdog (item 1.1).
- **`git pull --rebase --autostash`** no robô — teria evitado metade do incidente de 17/07 (mudança local não commitada travou o rebase).
- **logrotate no `robo.log`** — cresce pra sempre.
- **`pm2 startup` via systemd** (uma vez, com sudo seu) no lugar do hack `@reboot pm2 resurrect` no crontab — sobrevive melhor a reboot sujo.
- **Backup do que é insubstituível**: os snapshots históricos e análises do Market Brain (`data/`) são um dataset proprietário que só cresce em valor. Um `rclone` noturno pra Backblaze B2/Google Drive (custa centavos) resolve. Firestore: agendar export mensal.

### 2.2 Segurança
- O kody parece ser máquina doméstica em WiFi (interface `wlx…`). **Não expor porta pública nele.** A solução do 2.3 elimina a necessidade.
- Se possível, **cabo de rede** no lugar do WiFi — o cron das 6h e os snapshots de 15min dependem dessa estabilidade.
- `unattended-upgrades` pra patches de segurança automáticos.
- Manter tudo atrás do Tailscale como está (bom), `x-api-key` já implementado (bom).

### 2.3 Arquitetura — a mudança com melhor custo-benefício
**Espelho público da API via Cloudflare Worker + KV (grátis):**
- O kody **empurra** o snapshot (overview + termômetro + histórico) pro KV a cada 15min (um `curl` no fim do loop de coleta).
- Um Worker serve `/v1/market/*` público com cache e CORS, em `api.etradeai.eullerlolato.com` ou `workers.dev`.
- Resultado: termômetro ao vivo no site, widget embeddable e página `/mercado` públicos **sem nunca expor a VPS doméstica**, aguentando qualquer tráfego, de graça (100k req/dia no free tier). Se o kody cair, o público continua vendo o último snapshot.
- Isso destrava 3 itens do PLAN.md de uma vez (expor API, embed no site, widget) com segurança melhor que `tailscale funnel`.

### 2.4 Conteúdo fora do git (médio prazo, quando incomodar)
Hoje o robô commita edições e PNGs no repo (git como banco de dados). Funciona, mas foi a causa raiz dos conflitos de rebase e vai inflar o repo (~90MB/ano de PNG). Quando passar de ~100 assinantes: edições → Firestore/API + ISR na Vercel (blog atualiza sem rebuild nem push), artes → R2/servidas pela API. **Não fazer agora** — só saber que a saída existe.

### 2.5 Custo de IA (detalhe fino)
- **Prompt caching** nos system prompts longos da newsletter (roda 2×/dia — PT e EN) — corta custo e latência.
- **Batch API** (50% de desconto) serve perfeitamente pra newsletter: às 5h30 não há pressa de segundos. Ganho pequeno hoje, hábito certo pra quando escalar.

---

## 3. Cripto News — produto & crescimento

### 3.1 Vídeo diário 100% automático (a ideia que mata a maior fricção)
A ESTRATEGIA.md assume gravação manual do Short — é o único passo humano do pipeline, e é o que trava o canal nº 1 de descoberta. Dá pra **eliminar**:
- **Roteiro**: já existe (a edição do dia).
- **Voz**: TTS neural pt-BR — Google Cloud TTS (free tier de 1M chars/mês cobre ~30× o necessário) ou edge-tts.
- **Vídeo**: ffmpeg no kody — cards animados (mesma identidade das artes que já geramos), legendas queimadas, 45s vertical.
- **Publicação**: YouTube Data API (Short) + o mesmo arquivo como Reels via a API da Meta que você já vai configurar.
- Resultado: **1 vídeo/dia em 4 canais sem tocar em nada.** Consistência de 90 dias garantida por cron. Eu construo o pipeline inteiro; você só cria as credenciais (Meta + Google OAuth).

### 3.2 O personagem "Analista-Chefe"
A voz do TTS, o tom da newsletter e a assinatura das análises viram **um personagem nomeado e consistente** (avatar fixo, bordão de abertura/fechamento). Marca memorável custa zero e diferencia de todo agregador de notícia genérico.

### 3.3 Distribuição e retenção
- **`/hoje`** — permalink que redireciona pra edição do dia (perfeito pra bio, grupos, QR).
- **QR code no story** apontando pra `/hoje` (story via API não tem sticker de link; QR resolve).
- **Threads em texto**: o Threads é texto-first — postar a "leitura do dia" como texto (não só imagem) via a mesma API Meta. A análise já existe; é um POST a mais.
- **Web push** (OneSignal free) — "edição no ar" como canal de reativação além do e-mail.
- **Áudio da edição** no player da página (mesmo TTS do vídeo) — acessibilidade + tempo na página.
- **WhatsApp**: o `whats-automacao` já existe no kody. Lista de transmissão diária 6h (termômetro + 3 destaques + link) — taxa de abertura de WhatsApp no BR esmaga e-mail. Usar número dedicado (risco de ban existe em API não-oficial; número separado isola).
- **Reply-to engajamento**: "responda este e-mail com um ticker e o analista comenta amanhã" — loop de engajamento + fonte de pauta, custo zero.
- **Home mostrando a edição real de hoje** (não promessa genérica) — prova de qualidade antes de pedir o e-mail. + art do dia + contador de edições publicadas.

### 3.4 GEO (SEO de IA) — dobrar a aposta
Já tem llms.txt + JSON-LD (raro em PT-BR). Completar com RSS (item 1.5), Bing Webmaster, e o **backtest honesto como conteúdo**: "comprar no medo extremo NEM sempre funciona — 1 ano de dados" — o resultado "ruim" do backtest (F&G<25 → -0,2%/30d) é exatamente o tipo de conteúdo contra-intuitivo, datado e factual que IAs citam. Transforma um número que não servia pra marketing em ativo de credibilidade.

---

## 4. e-trade.ai — produto & monetização

### 4.1 Contexto ao vivo dentro da análise de print (diferencial real, 1 fetch)
Injetar no prompt do analyser os dados da própria API (termômetro, F&G, funding, preço atual do ativo detectado). Nenhum "ChatGPT que lê gráfico" tem isso. Vira o pitch: **"análise de print com contexto de mercado em tempo real"**.

### 4.2 Detector de print velho (guardrail que constrói confiança)
Se o ativo for detectado e o preço no print divergir >3% do preço ao vivo da API → aviso "esse gráfico parece desatualizado". Evita plano de trade sobre gráfico de semana passada — o tipo de detalhe que gera print elogioso no Twitter.

### 4.3 Loop viral: card de compartilhamento por análise
Cada análise gera um PNG bonito (viés, níveis, plano) com marca d'água + link — **reaproveitando o pipeline satori das artes sociais que já construímos**. Página pública opcional `/a/{id}` com OG image. Trader compartilha análise em grupo de WhatsApp/Twitter → aquisição orgânica. É a feature de crescimento mais barata possível dado o que já existe.

### 4.4 Demo sem login (matar a fricção de entrada)
Hoje tem gate de login em tudo. Permitir **1 análise anônima** (rate limit por IP + Turnstile), com resultado parcialmente borrado: viés visível, plano borrado → "crie a conta grátis pra ver completo". Com análise custando centavos no Haiku, o CAC disso é ridículo. Converte muito mais que login wall.

### 4.5 Placar público do analista (o fosso de dados)
Cron no kody confere cada análise vs preço 24/48h depois → taxa de acerto do viés, global e por usuário. Publicar semanalmente ("o Analista acertou 61% dos vieses em 30d"). Ninguém pequeno faz isso; os dados já são coletados. Também alimenta melhoria de prompt com o dataset análise→resultado.

### 4.6 Monetização em camadas de modelo
- Free/HashHedge → Haiku (atual).
- **"Modo profundo" por 2 créditos → Sonnet** — upsell honesto de qualidade, implementação = trocar a string do modelo por chamada.
- Assinatura mensal simples (ex: R$29, N análises/dia) pra quem não quer HashHedge — MRR previsível ao lado do funil de afiliado.

### 4.7 MCP como marketing (você já tem e não divulga)
O servidor MCP remoto em `/api/mcp` com API keys **já funciona** — "adicione o e-trade.ai no seu Claude" é pitch inédito em PT-BR. Listar nos diretórios MCP (Smithery, PulseMCP, mcp.so), post no blog do criptonews ensinando a conectar. Audiência dev/trader early-adopter de graça.

### 4.8 Alertas (retenção)
"Me avisa se BTC romper 66.174" — os snapshots de 15min já existem; é comparar e disparar (e-mail agora, WhatsApp premium depois — item 8 do PLAN). Alerta = motivo de voltar todo dia.

### 4.9 Landing
- GIF de 10s de uma análise acontecendo acima da dobra (ferramenta se vende vendo).
- "1 análise grátis, sem cartão" explícito.
- Termômetro ao vivo na home (via Worker do 2.3) + contador de análises feitas.

---

## 5. Moonshots (apostas maiores, quando o resto rodar)

1. **API pública de dados cripto BR** — free tier com key do Market Brain como produto de developer relations: backlinks, devs, imprensa. O termômetro vira "o índice de referência" citável.
2. **Histórico do termômetro como dataset** (CSV/API) pra quants e estudantes — pequeno, mas único.
3. **Fine-tuning/otimização do analista com o dataset análise→resultado** (4.5) — o produto melhora sozinho com uso; esse é o fosso de verdade.
4. **Mini-admin `/admin`** — assinantes (Resend API), análises/dia, créditos consumidos, cliques HashHedge, status do cron: seu centro de comando de 1 página, 3 KPIs por semana e nada mais.

---

## 6. Divisão de trabalho

**Eu executo sozinho (é só autorizar):** watchdog+alertas, concessões auto-aplicáveis, RSS, `/hoje`, `/bitcoin-hoje`, unsubscribe real, Worker+KV público, termômetro no site, página de venda do relatório semanal, card de compartilhamento, contexto ao vivo no analyser, detector de print velho, demo sem login, pipeline de vídeo TTS+ffmpeg, hardening do run-daily.sh, thread no Threads em texto.

**Só você pode:** app Meta + tokens (IG/FB/Threads), OAuth YouTube, postback no painel HashHedge + env na Vercel, rotação das duas credenciais, `pm2 startup`/cabo de rede no kody, avisar o Igor pra logar (ou deixar o item 1.2 resolver sozinho).

## 7. O que NÃO fazer agora (anti-backlog)
- Docker/Kubernetes, multi-cloud, migrar de Vercel — zero necessidade.
- API paga do X/Twitter (US$100/mês) — não no estágio atual.
- App mobile nativo — PWA/web resolve por muito tempo.
- Refatorar edições pra fora do git **já** — só quando doer (>100 subs).
- Mais idiomas além de PT/EN — EN já roda sozinho pro SEO, deixa quieto.
- 50 páginas programáticas de SEO — só BTC/ETH (qualidade > volume, senão o Google pune).

---

## Ordem que eu atacaria (se você disser "vai")

**Semana 1:** watchdog + hardening do cron → concessões auto-aplicáveis → RSS + Google News + `/hoje` → você: postback HashHedge + rotação de keys.
**Semana 2:** Worker público + termômetro no site + `/bitcoin-hoje` → página de venda do relatório semanal.
**Semana 3:** contexto ao vivo + detector de print velho + card de compartilhamento no e-trade.ai.
**Semana 4:** pipeline de vídeo automático (aí sim, com as credenciais Meta/Google na mão, liga tudo: feed, story, Reels, Short, Threads).

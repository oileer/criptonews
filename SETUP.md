# Setup na CPU (envio diário automático às 06h)

## 1. Clonar e instalar

```powershell
git clone https://github.com/oileer/criptonews C:\criptonews
cd C:\criptonews
npm install
```

## 2. Criar o .env.local na raiz

```
RESEND_API_KEY=re_...
RESEND_AUDIENCE_ID=e1e7c329-0033-497f-a68a-e37e8b393a5f
RESEND_AUDIENCE_ID_EN=b0478ab8-721f-4ffc-be3f-0f498ee43f6a
ANTHROPIC_API_KEY=sk-ant-...
```

## 3. Configurar o git (pro robô publicar no site)

O script dá `git push` das edições — o computador precisa estar autenticado no GitHub:

```powershell
git config --global user.name "oileer"
git config --global user.email "seu-email-do-github"
# se pedir login no primeiro push, usa o GitHub CLI:  winget install GitHub.cli ; gh auth login
```

## 4. Testar manualmente

```powershell
npm run send:dry   # gera PT + EN e mostra no console, não envia
npm run send       # envia de verdade e publica no site
```

## 5. Agendar às 06h (Agendador de Tarefas)

Roda esse comando **uma vez** no PowerShell como administrador:

```powershell
schtasks /Create /TN "CriptoNews Envio Diario" /TR "cmd /c cd /d C:\criptonews && npm run send >> C:\criptonews\send.log 2>&1" /SC DAILY /ST 06:00 /F
```

Pra conferir: `schtasks /Query /TN "CriptoNews Envio Diario"`
Pra testar agora: `schtasks /Run /TN "CriptoNews Envio Diario"` (e olha o `send.log`)

> Obs: o PC precisa estar **ligado** às 06h. Se quiser que acorde do sleep, marca
> "Acordar o computador para executar esta tarefa" nas propriedades da tarefa
> (Agendador de Tarefas → CriptoNews Envio Diario → Propriedades → Condições).

## Custo por dia (modelo atual: Haiku 4.5)

~US$ 0,05–0,08/dia (2 edições + até 10 buscas). Em produção, trocar pra
`claude-sonnet-5` no `scripts/send-newsletter.mjs` (escreve melhor, ~US$ 0,25/dia).

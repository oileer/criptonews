#!/bin/bash
# Robô diário da Cripto News — roda às 06h via cron (kody)
set -uo pipefail
export PATH=$HOME/opt/node/bin:$PATH
cd $HOME/apps/criptonews
LOG=$HOME/apps/criptonews/robo.log
STATUS_FILE=$HOME/apps/criptonews/robo.status

echo "=== run-daily $(date -Iseconds) ===" >> "$LOG"
: > "$STATUS_FILE"

etapa() {
  local nome="$1"; shift
  if "$@" >> "$LOG" 2>&1; then
    echo "OK    $nome" >> "$STATUS_FILE"
  else
    echo "FALHA $nome" >> "$STATUS_FILE"
    echo "[$nome] FALHOU $(date -Iseconds)" >> "$LOG"
  fi
}

etapa "git-pull" git pull --rebase --autostash origin main
etapa "newsletter" npm run send
etapa "artes-sociais" node --env-file=.env.local scripts/gen-social-art.mjs

if [ -f scripts/post-social.mjs ]; then
  etapa "post-social" node --env-file=.env.local scripts/post-social.mjs
fi

etapa "git-add" git add content/social/
etapa "git-commit" git commit -m "Artes sociais $(date +%F)"
etapa "git-push" git push origin main

grep -q FALHA "$STATUS_FILE" && echo "run-daily terminou com falhas: $(grep FALHA "$STATUS_FILE" | tr '\n' ' ')" >> "$LOG"

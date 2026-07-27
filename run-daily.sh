#!/bin/bash
# Robô diário da Cripto News — roda às 06h via cron (kody)
set -uo pipefail
export PATH=$HOME/opt/node/bin:$PATH
export FFMPEG_PATH=$HOME/opt/ffmpeg-current/ffmpeg
export FFPROBE_PATH=$HOME/opt/ffmpeg-current/ffprobe
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

# Vídeo diário (TTS + ffmpeg + Reels/YouTube) DESATIVADO no cron a partir de
# 27/07 — resultado visual reprovado (ver docs/STATUS-2026-07-24.md, seção
# 25/07). Fica só feed+story+Threads automáticos até o fluxo de vídeo ser
# reavaliado. Rodar manualmente pra testar: node --env-file=.env.local
# scripts/gen-video-diario.mjs
# if [ -f scripts/gen-video-diario.mjs ]; then
#   etapa "video-diario" node --env-file=.env.local scripts/gen-video-diario.mjs
# fi

etapa "git-add" git add content/social/ public/social/
etapa "git-commit" git commit -m "Artes sociais $(date +%F)"
etapa "git-push" git push origin main

# post-social depende da imagem já estar pública (Vercel rebuilda após o push
# acima) — roda por último e ele mesmo espera a URL ficar acessível. Sem
# vídeo do dia, pula o Reels sozinho (checa existsSync antes de tentar).
if [ -f scripts/post-social.mjs ]; then
  etapa "post-social" node --env-file=.env.local scripts/post-social.mjs
fi
# upload-youtube DESATIVADO junto com o vídeo — ver comentário acima.
# if [ -f scripts/upload-youtube.mjs ] && [ -f content/videos/$(date +%F).mp4 ]; then
#   etapa "upload-youtube" node --env-file=.env.local scripts/upload-youtube.mjs
# fi

grep -q FALHA "$STATUS_FILE" && echo "run-daily terminou com falhas: $(grep FALHA "$STATUS_FILE" | tr '\n' ' ')" >> "$LOG"

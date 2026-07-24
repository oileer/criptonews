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

# Vídeo diário (TTS + ffmpeg) depende da arte de story já existir — roda
# depois das artes-sociais. Falha aqui não trava o resto (post-social segue
# sem reels se o vídeo não existir).
if [ -f scripts/gen-video-diario.mjs ]; then
  etapa "video-diario" node --env-file=.env.local scripts/gen-video-diario.mjs
fi

etapa "git-add" git add content/social/ public/social/ content/videos/ public/videos/
etapa "git-commit" git commit -m "Artes e vídeo do dia $(date +%F)"
etapa "git-push" git push origin main

# post-social/upload-youtube dependem da mídia já estar pública (Vercel
# rebuilda após o push acima) — rodam por último, cada um espera a URL ficar
# acessível antes de publicar.
if [ -f scripts/post-social.mjs ]; then
  etapa "post-social" node --env-file=.env.local scripts/post-social.mjs
fi
if [ -f scripts/upload-youtube.mjs ] && [ -f content/videos/$(date +%F).mp4 ]; then
  etapa "upload-youtube" node --env-file=.env.local scripts/upload-youtube.mjs
fi

grep -q FALHA "$STATUS_FILE" && echo "run-daily terminou com falhas: $(grep FALHA "$STATUS_FILE" | tr '\n' ' ')" >> "$LOG"

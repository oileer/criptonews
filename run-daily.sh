#!/bin/bash
# Robô diário da Cripto News — roda às 06h via cron (kody)
export PATH=$HOME/opt/node/bin:$PATH
cd $HOME/apps/criptonews
LOG=$HOME/apps/criptonews/robo.log

git pull --rebase origin main >> $LOG 2>&1
npm run send >> $LOG 2>&1
node --env-file=.env.local scripts/gen-social-art.mjs >> $LOG 2>&1

if [ -f scripts/post-social.mjs ]; then
  node --env-file=.env.local scripts/post-social.mjs >> $LOG 2>&1
fi

git add content/social/ >> $LOG 2>&1
git commit -m "Artes sociais $(date +%F)" >> $LOG 2>&1
git push origin main >> $LOG 2>&1

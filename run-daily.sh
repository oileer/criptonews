#!/bin/bash
# Robô diário da Cripto News — roda às 06h via cron (kody)
export PATH=$HOME/opt/node/bin:$PATH
cd $HOME/apps/criptonews
git pull --rebase origin main >> $HOME/apps/criptonews/robo.log 2>&1
npm run send >> $HOME/apps/criptonews/robo.log 2>&1

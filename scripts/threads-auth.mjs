// Troca o `code` do OAuth do Threads por um token de longa duração (60 dias)
// e já grava THREADS_ACCESS_TOKEN + THREADS_USER_ID em .env.local (kody).
// Uso único, manual: node --env-file=.env.local scripts/threads-auth.mjs <code>
// O `code` expira em minutos — rodar assim que copiar da página de callback.
// Docs: https://developers.facebook.com/docs/threads/get-started
import { readFileSync, writeFileSync } from "node:fs";

const REDIRECT_URI = "https://noticias.eullerlolato.com/api/threads/callback";
const APP_ID = process.env.THREADS_APP_ID;
const APP_SECRET = process.env.THREADS_APP_SECRET;
const code = process.argv[2];

if (!APP_ID || !APP_SECRET) {
  console.error("faltam THREADS_APP_ID / THREADS_APP_SECRET no .env.local");
  process.exit(1);
}
if (!code) {
  console.error("uso: node --env-file=.env.local scripts/threads-auth.mjs <code>");
  process.exit(1);
}

// 1) code → token de curta duração
const form = new URLSearchParams({
  client_id: APP_ID,
  client_secret: APP_SECRET,
  grant_type: "authorization_code",
  redirect_uri: REDIRECT_URI,
  code,
});
const r1 = await fetch("https://graph.threads.net/oauth/access_token", { method: "POST", body: form });
const j1 = await r1.json();
if (!r1.ok || !j1.access_token) {
  console.error("falhou trocar code por token de curta duração:", JSON.stringify(j1));
  process.exit(1);
}
console.log(`token curto obtido, user_id=${j1.user_id}`);

// 2) curta → longa duração (60 dias)
const url2 = new URL("https://graph.threads.net/access_token");
url2.searchParams.set("grant_type", "th_exchange_token");
url2.searchParams.set("client_secret", APP_SECRET);
url2.searchParams.set("access_token", j1.access_token);
const r2 = await fetch(url2);
const j2 = await r2.json();
if (!r2.ok || !j2.access_token) {
  console.error("falhou trocar por token de longa duração:", JSON.stringify(j2));
  process.exit(1);
}
console.log(`token longo obtido, expira em ${Math.round(j2.expires_in / 86400)} dias`);

// grava no .env.local (idempotente: remove linhas antigas antes de adicionar)
const path = new URL("../.env.local", import.meta.url);
const atual = readFileSync(path, "utf8");
const limpo = atual
  .split("\n")
  .filter((l) => !l.startsWith("THREADS_ACCESS_TOKEN=") && !l.startsWith("THREADS_USER_ID="))
  .join("\n")
  .trimEnd();
writeFileSync(path, limpo + `\nTHREADS_ACCESS_TOKEN=${j2.access_token}\nTHREADS_USER_ID=${j1.user_id}\n`);

console.log("✓ THREADS_ACCESS_TOKEN e THREADS_USER_ID gravados em .env.local");
console.log("⚠️  token de longa duração expira em 60 dias — precisa de refresh automático (th_refresh_token) antes disso, senão o post-social.mjs para de funcionar.");

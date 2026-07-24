// Publica as artes do dia no Instagram (feed + story) e, se o token do
// Threads já estiver configurado, também um post em texto+imagem no Threads.
// Roda no fim do run-daily.sh, DEPOIS do git push (a imagem precisa estar
// publicamente acessível via Vercel antes da Graph API poder buscá-la).
//
// Env: IG_ACCESS_TOKEN, IG_USER_ID (obrigatórios)
//      THREADS_ACCESS_TOKEN, THREADS_USER_ID (opcionais — pula Threads sem eles)
import { readFileSync, writeFileSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const SITE_URL = "https://noticias.eullerlolato.com";
let IG_TOKEN = process.env.IG_ACCESS_TOKEN;
const IG_USER_ID = process.env.IG_USER_ID;
const THREADS_TOKEN = process.env.THREADS_ACCESS_TOKEN;
const THREADS_USER_ID = process.env.THREADS_USER_ID;

const hoje = new Date().toLocaleString("en-CA", { timeZone: "America/Sao_Paulo" }).slice(0, 10);

function legenda() {
  try {
    const edicao = JSON.parse(readFileSync(path.join("content", "edicoes", `${hoje}.json`), "utf8"));
    const desc = edicao.description?.trim() || "";
    return `${desc}\n\nLink na bio 👆 #bitcoin #cripto #criptomoedas`.slice(0, 2190); // teto da IG
  } catch {
    return "A edição de hoje da Cripto News já está no ar. Link na bio 👆 #bitcoin #cripto";
  }
}

// Vercel leva de dezenas de segundos a ~2min pra propagar após o push.
// Poll em vez de sleep fixo — evita tanto falso-negativo quanto espera desnecessária.
async function esperarUrlPublica(url, tentativas = 20, intervaloMs = 10000) {
  for (let i = 0; i < tentativas; i++) {
    try {
      const res = await fetch(url, { method: "HEAD", signal: AbortSignal.timeout(8000) });
      if (res.ok) return true;
    } catch {
      // segue tentando
    }
    await new Promise((r) => setTimeout(r, intervaloMs));
  }
  return false;
}

async function graphPost(url, body) {
  const res = await fetch(url, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) });
  const json = await res.json();
  if (!res.ok) throw new Error(`${url} -> ${res.status} ${JSON.stringify(json)}`);
  return json;
}

// A IG processa a imagem em background depois de criar o container — publicar
// direto sem esperar dá "Media ID is not available". Poll no status_code.
async function esperarContainerPronto(containerId, token, tentativas = 15, intervaloMs = 4000) {
  for (let i = 0; i < tentativas; i++) {
    const res = await fetch(`https://graph.instagram.com/v21.0/${containerId}?fields=status_code&access_token=${token}`);
    const json = await res.json();
    if (json.status_code === "FINISHED") return true;
    if (json.status_code === "ERROR") throw new Error(`container ${containerId} falhou no processamento da IG`);
    await new Promise((r) => setTimeout(r, intervaloMs));
  }
  return false;
}

async function publicarInstagram(caption) {
  const feedUrl = `${SITE_URL}/social/${hoje}-feed.png`;
  const storyUrl = `${SITE_URL}/social/${hoje}-story.png`;

  const feedOk = await esperarUrlPublica(feedUrl);
  if (!feedOk) throw new Error(`imagem de feed não ficou pública a tempo: ${feedUrl}`);

  // Feed
  const containerFeed = await graphPost(
    `https://graph.instagram.com/v21.0/${IG_USER_ID}/media?access_token=${IG_TOKEN}`,
    { image_url: feedUrl, caption }
  );
  if (!(await esperarContainerPronto(containerFeed.id, IG_TOKEN))) {
    throw new Error(`container do feed (${containerFeed.id}) não ficou pronto a tempo`);
  }
  await graphPost(`https://graph.instagram.com/v21.0/${IG_USER_ID}/media_publish?access_token=${IG_TOKEN}`, {
    creation_id: containerFeed.id,
  });
  console.log(`[ig] feed publicado (container ${containerFeed.id})`);

  // Story
  const containerStory = await graphPost(
    `https://graph.instagram.com/v21.0/${IG_USER_ID}/media?access_token=${IG_TOKEN}`,
    { image_url: storyUrl, media_type: "STORIES" }
  );
  if (!(await esperarContainerPronto(containerStory.id, IG_TOKEN))) {
    throw new Error(`container do story (${containerStory.id}) não ficou pronto a tempo`);
  }
  await graphPost(`https://graph.instagram.com/v21.0/${IG_USER_ID}/media_publish?access_token=${IG_TOKEN}`, {
    creation_id: containerStory.id,
  });
  console.log(`[ig] story publicado (container ${containerStory.id})`);
}

async function publicarThreads(caption) {
  const feedUrl = `${SITE_URL}/social/${hoje}-feed.png`;
  const container = await graphPost(
    `https://graph.threads.net/v1.0/${THREADS_USER_ID}/threads?access_token=${THREADS_TOKEN}`,
    { media_type: "IMAGE", image_url: feedUrl, text: caption }
  );
  await new Promise((r) => setTimeout(r, 8000)); // Threads não expõe status_code pra poll; espera fixa curta basta
  await graphPost(`https://graph.threads.net/v1.0/${THREADS_USER_ID}/threads_publish?access_token=${THREADS_TOKEN}`, {
    creation_id: container.id,
  });
  console.log(`[threads] publicado (container ${container.id})`);
}

// Token do IG dura 60 dias; renova sozinho a cada execução se já tiver >45 dias
// (a Graph API só deixa renovar depois de 24h de vida, então isso é seguro rodar diário).
async function renovarTokenIG() {
  const path_env = fileURLToPath(new URL("../.env.local", import.meta.url));
  let atual;
  try {
    atual = readFileSync(path_env, "utf8");
  } catch {
    return; // sem .env.local local (ex: rodando fora do kody) — não mexe
  }
  const m = atual.match(/^IG_TOKEN_REFRESHED_AT=(\d+)$/m);
  const ultimaRenovacao = m ? Number(m[1]) : 0;
  const diasDesde = (Date.now() - ultimaRenovacao) / 86400000;
  if (diasDesde < 45) return;

  try {
    const res = await fetch(
      `https://graph.instagram.com/refresh_access_token?grant_type=ig_refresh_token&access_token=${IG_TOKEN}`
    );
    const json = await res.json();
    if (!res.ok || !json.access_token) throw new Error(JSON.stringify(json));
    const limpo = atual
      .split("\n")
      .filter((l) => !l.startsWith("IG_ACCESS_TOKEN=") && !l.startsWith("IG_TOKEN_REFRESHED_AT="))
      .join("\n")
      .trimEnd();
    writeFileSync(path_env, limpo + `\nIG_ACCESS_TOKEN=${json.access_token}\nIG_TOKEN_REFRESHED_AT=${Date.now()}\n`);
    IG_TOKEN = json.access_token;
    console.log(`[ig] token renovado, expira em ${Math.round(json.expires_in / 86400)} dias`);
  } catch (e) {
    console.error(`[ig] falha ao renovar token: ${e.message} — token atual segue valendo até expirar`);
  }
}

async function main() {
  if (!IG_TOKEN || !IG_USER_ID) {
    console.error("[post-social] faltam IG_ACCESS_TOKEN/IG_USER_ID — nada a publicar");
    process.exit(1);
  }

  await renovarTokenIG();
  const caption = legenda();
  await publicarInstagram(caption);

  if (THREADS_TOKEN && THREADS_USER_ID) {
    await publicarThreads(caption);
  } else {
    console.log("[threads] token ainda não configurado — pulando (rodar scripts/threads-auth.mjs quando o OAuth destravar)");
  }
}

main().catch((e) => {
  console.error("[post-social] falhou:", e.message);
  process.exit(1);
});

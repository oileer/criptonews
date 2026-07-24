// Threads de notícia real — gera e publica 1 post no Threads por execução,
// a partir de manchetes reais (RSS) de fora ou do Brasil, sem repetir assunto.
// Roda 5x/dia via cron (--origem=br ou --origem=gringa, ver crontab do kody).
//
// Pipeline: RSS (grátis) → Ollama no kody filtra o candidato mais relevante que
// ainda não foi coberto (grátis, roda local) → Claude Haiku escreve o post em
// PT-BR (pago, ~5 chamadas/dia, centavos) → publica no Threads (texto puro).
//
// Env: THREADS_ACCESS_TOKEN, THREADS_USER_ID, ANTHROPIC_API_KEY, OLLAMA_URL (opcional)
import { readFileSync, writeFileSync, existsSync } from "node:fs";
import path from "node:path";
import Anthropic from "@anthropic-ai/sdk";

const OLLAMA_URL = process.env.OLLAMA_URL || "http://100.97.40.28:11434/api/generate";
const MODELO_OLLAMA = "qwen3:8b";
const THREADS_TOKEN = process.env.THREADS_ACCESS_TOKEN;
const THREADS_USER_ID = process.env.THREADS_USER_ID;
const JANELA_HORAS = 8; // manchetes recentes o bastante pra ainda serem notícia
const ESTADO_PATH = path.join("content", "threads-postados.json");
const RETENCAO_ESTADO_HORAS = 4 * 24; // 4 dias — suficiente pra não repetir tema

const FEEDS = {
  gringa: [
    "https://www.coindesk.com/arc/outboundfeeds/rss/",
    "https://cointelegraph.com/rss",
    "https://decrypt.co/feed",
    "https://cryptoslate.com/feed/",
    "https://www.theblock.co/rss.xml",
    "https://bitcoinmagazine.com/feed",
    "https://news.bitcoin.com/feed/",
  ],
  br: [
    "https://livecoins.com.br/feed/",
    "https://portaldobitcoin.uol.com.br/feed/",
    "https://www.criptofacil.com/feed/",
  ],
};

const origem = process.argv.find((a) => a.startsWith("--origem="))?.split("=")[1];
const dryRun = process.argv.includes("--dry-run");
if (origem !== "br" && origem !== "gringa") {
  console.error("uso: node scripts/threads-news.mjs --origem=br|gringa [--dry-run]");
  process.exit(1);
}

function decodeXmlEntities(s) {
  return s
    .replace(/<!\[CDATA\[(.*?)\]\]>/gs, "$1")
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .replace(/&#0?39;/g, "'")
    .trim();
}

function parseRss(xml) {
  const itens = [];
  for (const bloco of xml.matchAll(/<item>([\s\S]*?)<\/item>/g)) {
    const item = bloco[1];
    const titulo = item.match(/<title>([\s\S]*?)<\/title>/)?.[1];
    const link = item.match(/<link>([\s\S]*?)<\/link>/)?.[1];
    const pubDate = item.match(/<pubDate>([\s\S]*?)<\/pubDate>/)?.[1];
    if (!titulo || !pubDate) continue;
    const data = new Date(decodeXmlEntities(pubDate));
    if (isNaN(data.getTime())) continue;
    itens.push({ titulo: decodeXmlEntities(titulo), link: link?.trim(), data });
  }
  return itens;
}

async function buscarManchetes() {
  const desde = Date.now() - JANELA_HORAS * 60 * 60 * 1000;
  const resultados = await Promise.allSettled(
    FEEDS[origem].map((url) =>
      fetch(url, { headers: { "User-Agent": "Mozilla/5.0" }, signal: AbortSignal.timeout(10000) }).then((r) =>
        r.ok ? r.text() : Promise.reject(r.status)
      )
    )
  );
  const manchetes = [];
  for (const r of resultados) {
    if (r.status !== "fulfilled") continue;
    for (const item of parseRss(r.value)) {
      if (item.data.getTime() >= desde) manchetes.push(item);
    }
  }
  // dedupe por título e ordena mais recente primeiro
  const vistos = new Set();
  return manchetes
    .filter((m) => (vistos.has(m.titulo) ? false : (vistos.add(m.titulo), true)))
    .sort((a, b) => b.data - a.data)
    .slice(0, 40);
}

// ---------- estado (o que já foi postado, pra não repetir tema) ----------

function lerEstado() {
  if (!existsSync(ESTADO_PATH)) return [];
  try {
    const lista = JSON.parse(readFileSync(ESTADO_PATH, "utf8"));
    const corte = Date.now() - RETENCAO_ESTADO_HORAS * 60 * 60 * 1000;
    return lista.filter((e) => e.ts >= corte);
  } catch {
    return [];
  }
}

function salvarEstado(lista) {
  writeFileSync(ESTADO_PATH, JSON.stringify(lista, null, 2));
}

function destaquesDaEdicaoDeHoje() {
  const hoje = new Date().toLocaleString("en-CA", { timeZone: "America/Sao_Paulo" }).slice(0, 10);
  const arq = path.join("content", "edicoes", `${hoje}.json`);
  if (!existsSync(arq)) return [];
  const { html } = JSON.parse(readFileSync(arq, "utf8"));
  const depois = html.split(/DESTAQUES DO DIA<\/b>/i)[1] ?? "";
  return [...depois.matchAll(/<b>([^<]+)<\/b>/g)].map((m) => m[1].trim());
}

// ---------- Ollama escolhe o candidato ----------

async function escolherCandidato(manchetes, jaCoberto) {
  if (!manchetes.length) return null;

  const prompt = `Você cura o conteúdo de um perfil de notícias cripto no Threads (BR).
Das manchetes numeradas abaixo, escolha a ÚNICA mais relevante pra publicar agora —
prioriza impacto de mercado, relevância pro trader brasileiro, e algo que ainda NÃO
foi coberto nos assuntos já publicados hoje (lista abaixo). Se todas já foram
cobertas ou nenhuma é relevante o bastante, responda só "NENHUMA".

Assuntos já publicados hoje (evite repetir o mesmo tema, mesmo com título diferente):
${jaCoberto.length ? jaCoberto.map((t) => `- ${t}`).join("\n") : "(nenhum ainda)"}

Manchetes:
${manchetes.map((m, i) => `${i + 1}. ${m.titulo}`).join("\n")}

Responda SÓ com o número escolhido (ex: "7") ou "NENHUMA". Nada mais.`;

  const res = await fetch(OLLAMA_URL, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      model: MODELO_OLLAMA,
      prompt,
      stream: false,
      think: false,
      options: { num_predict: 20, temperature: 0.2 },
    }),
    signal: AbortSignal.timeout(60000),
  });
  if (!res.ok) throw new Error(`ollama ${res.status}`);
  const { response } = await res.json();
  const num = response?.match(/\d+/)?.[0];
  if (!num) return null;
  const idx = Number(num) - 1;
  return manchetes[idx] ?? null;
}

// ---------- Haiku escreve o post ----------

async function escreverPost(candidato) {
  const client = new Anthropic();
  const fonte = origem === "br" ? "veículo brasileiro" : "veículo internacional (traduza pro português)";
  const msg = await client.messages.create({
    model: "claude-haiku-4-5",
    max_tokens: 300,
    messages: [
      {
        role: "user",
        content: `Escreva um post pro Threads (rede social, texto curto) sobre esta notícia cripto, em português do Brasil, tom direto de analista (não é imprensa formal, é rede social — pode ser mais coloquial e opinativo, mas sem inventar dado).

Notícia (${fonte}): "${candidato.titulo}"

Regras:
- Máximo 420 caracteres (Threads corta em 500, deixa margem).
- Primeira linha é o gancho (o fato em si, direto).
- Pode ter 1 frase de contexto/porquê importa.
- Sem hashtag genérica tipo #crypto #bitcoin em excesso — no máximo 1-2, só se fizer sentido.
- Sem emoji em excesso — 0 a 1 no máximo.
- Não invente número/dado que não está no título — se precisar de contexto, use o que é de conhecimento geral do mercado, sem inventar cifra específica.
- Responda SÓ com o texto do post, nada de aspas, nada de explicação.`,
      },
    ],
  });
  const texto = msg.content[0]?.text?.trim() ?? "";
  return texto.length > 480 ? texto.slice(0, 477) + "..." : texto;
}

// ---------- publica no Threads ----------

async function graphPost(url, body) {
  const res = await fetch(url, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) });
  const json = await res.json();
  if (!res.ok) throw new Error(`${url} -> ${res.status} ${JSON.stringify(json)}`);
  return json;
}

async function publicarThreads(texto) {
  const container = await graphPost(`https://graph.threads.net/v1.0/${THREADS_USER_ID}/threads?access_token=${THREADS_TOKEN}`, {
    media_type: "TEXT",
    text: texto,
  });
  await new Promise((r) => setTimeout(r, 5000));
  const pub = await graphPost(`https://graph.threads.net/v1.0/${THREADS_USER_ID}/threads_publish?access_token=${THREADS_TOKEN}`, {
    creation_id: container.id,
  });
  return pub.id;
}

// ---------- main ----------

async function main() {
  if (!dryRun && (!THREADS_TOKEN || !THREADS_USER_ID)) {
    console.error("[threads-news] faltam THREADS_ACCESS_TOKEN/THREADS_USER_ID — nada a publicar");
    process.exit(1);
  }

  const manchetes = await buscarManchetes();
  const estado = lerEstado();
  const jaCoberto = [...estado.map((e) => e.titulo), ...destaquesDaEdicaoDeHoje()];

  const candidato = await escolherCandidato(manchetes, jaCoberto);
  if (!candidato) {
    console.log(`[threads-news] nada relevante/novo em "${origem}" agora — pulando sem postar`);
    return;
  }

  const texto = await escreverPost(candidato);
  if (!texto) throw new Error("Haiku devolveu texto vazio");

  if (dryRun) {
    console.log(`[threads-news] DRY-RUN (${origem}) — não publicou de verdade.\nManchete: ${candidato.titulo}\nLink: ${candidato.link}\n---\n${texto}\n---\n(${texto.length} chars)`);
    return;
  }

  const id = await publicarThreads(texto);
  console.log(`[threads-news] publicado (${origem}, container ${id}): "${candidato.titulo}"`);

  estado.push({ titulo: candidato.titulo, ts: Date.now() });
  salvarEstado(estado);
}

main().catch((e) => {
  console.error("[threads-news] falhou:", e.message);
  process.exit(1);
});

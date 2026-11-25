#!/usr/bin/env node
/**
 * Banco de conversaciones guiadas de la simulación (T4 de #323).
 *
 * Reproduce guiones de aprendiz contra la app REAL (renderer + Gemma local) vía
 * CDP y mide los criterios de éxito SC-001…SC-007 de `simulacion-productiva`.
 * No es una señal del gate: necesita el motor local con WebGPU, que CI no
 * tiene. Es paso obligatorio del skill `/release`.
 *
 * Uso:
 *   node scripts/eval-simulacion.mjs --launch                # levanta next dev + Electron con CDP
 *                                                            # sobre un store AISLADO (EMMA_DB_DIR temporal)
 *   node scripts/eval-simulacion.mjs                         # usa una app ya abierta en --port (¡ojo con
 *                                                            # su store: las escenas se guardan ahí!)
 *   opciones: --port 9333 · --only daily_standup:correct,coffee_break · --limit 4
 *             --label "línea base" · --out .eval · --strict (exit 1 si un SC no pasa)
 *             --reply-in-cloud (turno de práctica en la nube, #348)
 *
 * Lee la traza `__emmaTrace` (src/lib/ai/llm-trace.ts) para contar las llamadas
 * del camino crítico de cada turno. Todo queda en el equipo.
 */
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { spawn, spawnSync } from "node:child_process";
import { fileURLToPath } from "node:url";
import { SCRIPTS, PROFILES } from "./eval-simulacion-guiones.mjs";
import { summarize, toMarkdown } from "./eval-simulacion-metricas.mjs";

const REPO_ROOT = path.resolve(fileURLToPath(new URL("..", import.meta.url)));
const CRITICAL_TAGS = new Set(["observe", "grammar", "chat", "chat-retry", "chat-restate", "judge"]);

function arg(name, fallback) {
  const i = process.argv.indexOf(`--${name}`);
  if (i === -1) return fallback;
  const v = process.argv[i + 1];
  return v === undefined || v.startsWith("--") ? true : v;
}

const PORT = Number(arg("port", 9333));
const OUT = path.resolve(REPO_ROOT, String(arg("out", ".eval")));
const LABEL = String(arg("label", "corrida"));
const LIMIT = Number(arg("limit", 0));
const ONLY = arg("only", "");
const STRICT = Boolean(arg("strict", false));
const LAUNCH = Boolean(arg("launch", false));
/** #348: mide con «respuestas en la nube» (usa la llave guardada del proveedor). */
const REPLY_IN_CLOUD = Boolean(arg("reply-in-cloud", false));

const NO_THROTTLE = [
  "--disable-renderer-backgrounding",
  "--disable-background-timer-throttling",
  "--disable-backgrounding-occluded-windows",
];

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

async function reachable(url) {
  try {
    const res = await fetch(url, { signal: AbortSignal.timeout(2000) });
    return res.ok;
  } catch {
    return false;
  }
}

async function waitFor(check, timeoutMs, what) {
  const t0 = Date.now();
  while (Date.now() - t0 < timeoutMs) {
    if (await check()) return;
    await sleep(1000);
  }
  throw new Error(`timeout esperando ${what}`);
}

/**
 * Store AISLADO: el banco nunca escribe en el perfil real del usuario. Se
 * siembra sólo con el perfil y la configuración (sin sesiones, lecciones ni
 * progreso): así ninguna escena queda bloqueada por lecciones pendientes y la
 * corrida no suma XP ni conversaciones de prueba.
 */
const SEED_FILES = ["profiles.json", "setupChecks.json", "selfAssessment.json", "preferences.json", "chatSettings.json", "audioPrefs.json"];

function isolatedStore() {
  const realStore = path.join(os.homedir(), "Library", "Application Support", "emma-desktop", "emma", "store");
  const base = fs.mkdtempSync(path.join(os.tmpdir(), "emma-eval-"));
  fs.mkdirSync(path.join(base, "store"), { recursive: true });
  for (const f of SEED_FILES) {
    const from = path.join(String(arg("seed-store", realStore)), f);
    if (fs.existsSync(from)) fs.copyFileSync(from, path.join(base, "store", f));
  }
  return base;
}

const children = [];
async function launch() {
  if (!(await reachable("http://localhost:3000"))) {
    children.push(spawn("pnpm", ["next-dev"], { cwd: REPO_ROOT, stdio: "ignore", detached: true }));
    await waitFor(() => reachable("http://localhost:3000"), 180_000, "next dev en :3000");
  }
  spawnSync("pnpm", ["exec", "tsc", "-p", "tsconfig.electron.json"], { cwd: REPO_ROOT, stdio: "inherit" });
  children.push(
    // Sin estas banderas Chromium pausa requestAnimationFrame con la ventana
    // tapada: la narración de la escena nunca termina y el hilo no se dibuja.
    spawn("pnpm", ["exec", "electron", ".", `--remote-debugging-port=${PORT}`, ...NO_THROTTLE], {
      cwd: REPO_ROOT,
      stdio: "ignore",
      detached: true,
      env: { ...process.env, ELECTRON_RENDERER_URL: "http://localhost:3000", EMMA_DB_DIR: isolatedStore() },
    }),
  );
  await waitFor(() => reachable(`http://127.0.0.1:${PORT}/json/list`), 60_000, "CDP de Electron");
  await waitFor(async () => (await appPage()) !== undefined, 120_000, "la página de EMMA cargada");
}

function cleanup() {
  for (const c of children) {
    try {
      process.kill(-c.pid);
    } catch {
      /* ya terminó */
    }
  }
}

const APP_ORIGIN = "http://localhost:3000";

async function appPage() {
  try {
    const list = await (await fetch(`http://127.0.0.1:${PORT}/json/list`)).json();
    return list.find((t) => t.type === "page" && t.url.startsWith("http"));
  } catch {
    return undefined;
  }
}

/** Cliente CDP mínimo: evalúa JS en la página de EMMA (await permitido). */
async function connect() {
  const page = await appPage();
  if (!page) throw new Error("no encontré la página de EMMA en CDP");
  const ws = new WebSocket(page.webSocketDebuggerUrl);
  await new Promise((r, j) => {
    ws.addEventListener("open", r);
    ws.addEventListener("error", j);
  });
  let id = 0;
  const pending = new Map();
  ws.addEventListener("message", (m) => {
    const d = JSON.parse(m.data);
    if (pending.has(d.id)) {
      pending.get(d.id)(d);
      pending.delete(d.id);
    }
  });
  const evaluate = (body) =>
    new Promise((resolve, reject) => {
      id += 1;
      pending.set(id, (d) => {
        if (d.result?.exceptionDetails) reject(new Error(d.result.exceptionDetails.exception?.description ?? "error en la página"));
        else resolve(d.result?.result?.value);
      });
      ws.send(
        JSON.stringify({
          id,
          method: "Runtime.evaluate",
          params: { expression: `(async()=>{${body}})()`, awaitPromise: true, returnByValue: true, timeout: 600_000 },
        }),
      );
    });
  return { evaluate, close: () => ws.close() };
}

/** Funciones auxiliares inyectadas en cada evaluate. */
const HELPERS = `
const sleep=(ms)=>new Promise(r=>setTimeout(r,ms));
const btn=(re)=>[...document.querySelectorAll("button")].find(b=>re.test(b.innerText||"") && !b.disabled);
const emma=()=>[...document.querySelectorAll('[data-testid="emma-bubble"]')];
`;

async function openScene(page, scenario) {
  // Sólo en el store aislado: las lecciones de la escena anterior bloquean la
  // siguiente («Finish your pending lessons…»). Nunca toca un store real.
  if (LAUNCH) await page.evaluate(`await window.emmaAPI.storeSet("lessonTodos", {}); return 1;`);
  // Como un aprendiz real: pasa por el mapa (donde se precalcula la escena
  // recomendada) y desde ahí abre la escena.
  await page.evaluate(`location.href="${APP_ORIGIN}/"; return 1;`);
  await sleep(4000);
  await page.evaluate(`location.href="${APP_ORIGIN}/chat/?scenario=${scenario}"; return 1;`);
  await sleep(5000);
  return page.evaluate(`${HELPERS}
    const fresh=btn(/^New chat$/); if(fresh){ fresh.click(); await sleep(1500); }
    const t0=performance.now();
    while(performance.now()-t0<180000){ const intro=btn(/^Skip intro$/); if(intro) intro.click(); const b=btn(/ready, let/i); if(b){ const ms=performance.now()-t0; b.click();
      const t1=performance.now(); while(performance.now()-t1<120000){ if(emma().length>=1) return {sceneReadyMs:ms, opening:emma().at(-1).dataset.text}; const i2=btn(/^Skip intro$/); if(i2) i2.click(); await sleep(200);} return {sceneReadyMs:ms, opening:null}; }
      await sleep(200); }
    return {sceneReadyMs:null, opening:null};`);
}

async function sendTurn(page, text) {
  return page.evaluate(`${HELPERS}
    // El composer tarda en quedar usable (kickoff, voz, turno hablado): se
    // espera a que el textarea se habilite, saltando el turno hablado si aparece.
    let ta=null; const w0=performance.now();
    while(performance.now()-w0<90000){
      const intro=btn(/^Skip intro$/); if(intro){ intro.click(); await sleep(300); }
      const skip=btn(/can.t speak/i); if(skip){ skip.click(); await sleep(500); continue; }
      const t=document.querySelector("textarea"); if(t && !t.disabled){ ta=t; break; }
      await sleep(250);
    }
    if(!ta) return {ended:true};
    const before=emma().length;
    Object.getOwnPropertyDescriptor(HTMLTextAreaElement.prototype,"value").set.call(ta, ${JSON.stringify(text)});
    ta.dispatchEvent(new Event("input",{bubbles:true}));
    await sleep(150);
    const sentAt=Date.now(); const t0=performance.now();
    ta.dispatchEvent(new KeyboardEvent("keydown",{key:"Enter",code:"Enter",bubbles:true}));
    let firstVisibleMs=null;
    while(performance.now()-t0<180000){
      if(firstVisibleMs===null && document.querySelector('[data-testid="emma-streaming"]')) firstVisibleMs=performance.now()-t0;
      if(emma().length>before){ const doneMs=performance.now()-t0; return {sentAt, doneAt:Date.now(), doneMs, firstVisibleMs: firstVisibleMs ?? doneMs, reply: emma().at(-1).dataset.text}; }
      await sleep(50);
    }
    return {sentAt, doneAt:Date.now(), doneMs:null, firstVisibleMs, reply:""};`);
}

/** Llamadas del camino crítico del turno, con su vista previa (diagnóstico de rechazos). */
async function turnCalls(page, sentAt, doneAt) {
  const records = await page.evaluate(`return (globalThis.__emmaTrace?.records?.() ?? []);`);
  return records
    .filter((r) => CRITICAL_TAGS.has(r.tag) && r.startedAt >= sentAt - 50 && r.startedAt <= doneAt)
    .map((r) => ({ tag: r.tag, ms: r.ms, ok: r.ok, preview: r.preview }));
}

function plan() {
  const filters = String(ONLY || "")
    .split(",")
    .map((s) => s.trim())
    .filter(Boolean);
  const all = Object.keys(SCRIPTS).flatMap((scenario) => PROFILES.map((profile) => ({ scenario, profile })));
  const chosen = filters.length
    ? all.filter(({ scenario, profile }) => filters.some((f) => f === scenario || f === `${scenario}:${profile}`))
    : all;
  return LIMIT > 0 ? chosen.slice(0, LIMIT) : chosen;
}

async function main() {
  if (LAUNCH) await launch();
  if (!(await reachable(`http://127.0.0.1:${PORT}/json/list`))) {
    throw new Error(`no hay app con CDP en :${PORT}. Usá --launch o abrí Electron con --remote-debugging-port=${PORT}.`);
  }
  const page = await connect();
  // El ajuste vive en el localStorage del renderer: se fija explícito en cada
  // corrida para que la medición diga qué se midió.
  await page.evaluate(`
    const k = "ai_remote_settings";
    const cur = JSON.parse(localStorage.getItem(k) || "{}");
    localStorage.setItem(k, JSON.stringify({ ...cur, replyInCloud: ${REPLY_IN_CLOUD} }));
    return 1;`);
  const conversations = [];
  for (const { scenario, profile } of plan()) {
    process.stdout.write(`▶ ${scenario}:${profile} … `);
    const scene = await openScene(page, scenario);
    const earlier = scene.opening ? [scene.opening] : [];
    const turns = [];
    for (const learner of SCRIPTS[scenario][profile]) {
      const r = await sendTurn(page, learner);
      if (r.ended) break;
      turns.push({
        learner,
        reply: r.reply,
        firstVisibleMs: r.firstVisibleMs,
        doneMs: r.doneMs,
        calls: await turnCalls(page, r.sentAt, r.doneAt),
        earlierQuestions: [...earlier],
      });
      turns[turns.length - 1].criticalCalls = turns[turns.length - 1].calls.length;
      earlier.push(r.reply);
    }
    conversations.push({ scenario, profile, sceneReadyMs: scene.sceneReadyMs, opening: scene.opening, turns });
    console.log(`${turns.length} turnos`);
  }
  page.close();
  const summary = summarize(conversations);
  const date = new Date().toISOString();
  const md = toMarkdown(summary, { label: LABEL, date: date.slice(0, 16).replace("T", " "), engine: REPLY_IN_CLOUD ? "turno en la nube + resto local (dev)" : "Gemma local (dev)" });
  fs.mkdirSync(OUT, { recursive: true });
  const stamp = date.replace(/[:.]/g, "-");
  fs.writeFileSync(path.join(OUT, `simulacion-${stamp}.json`), JSON.stringify({ label: LABEL, date, summary, conversations }, null, 2));
  fs.writeFileSync(path.join(OUT, `simulacion-${stamp}.md`), md);
  console.log(`\n${md}\nReporte: ${path.relative(REPO_ROOT, path.join(OUT, `simulacion-${stamp}.md`))}`);
  if (STRICT && Object.values(summary.pass).some((p) => !p)) process.exitCode = 1;
}

main()
  .catch((err) => {
    console.error(`eval-simulacion: ${err.message}`);
    process.exitCode = 1;
  })
  .finally(cleanup);

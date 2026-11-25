/**
 * Métricas puras del banco de conversaciones guiadas (T4 de #323).
 *
 * El driver (`eval-simulacion.mjs`) mide cada turno en la app real y este
 * módulo lo convierte en los criterios de éxito SC-001…SC-007 de la feature
 * `simulacion-productiva`. Heurísticas deliberadamente simples y estables: lo
 * que importa es comparar corridas, no juzgar inglés.
 */

/** Umbrales de los criterios de éxito (spec de #323). */
export const THRESHOLDS = {
  sc001FirstVisibleP95Ms: 2000,
  sc002DoneP95Ms: 4000,
  sc003MaxCriticalCalls: 2,
  sc004MaxRecoveries: 0,
  sc005MaxReaskRate: 0.05,
  sc006MinAnsweredRate: 0.9,
  sc007SceneReadyP95Ms: 10000,
};

const RECOVERY = /put it another way|lost my train of thought|where were we\??|let me rephrase that/i;

export function isRecovery(reply) {
  return RECOVERY.test(reply);
}

const STOP = new Set(["the", "a", "an", "you", "your", "so", "okay", "ok", "and", "to", "of", "on", "for", "is", "are", "do", "did", "what", "how"]);

function questionsOf(text) {
  return (text.match(/[^.!?]*\?/g) ?? []).map((q) => q.trim()).filter(Boolean);
}

function words(text) {
  return new Set(
    text
      .toLowerCase()
      .replace(/[^a-z0-9\s']/g, " ")
      .split(/\s+/)
      .filter(Boolean),
  );
}

function similarity(a, b) {
  const wa = words(a);
  const wb = words(b);
  if (!wa.size || !wb.size) return 0;
  let common = 0;
  for (const w of wa) if (wb.has(w)) common += 1;
  return common / Math.min(wa.size, wb.size);
}

/** La persona vuelve a hacer una pregunta suya anterior (ya contestada). */
export function isReask(reply, earlierAssistantLines) {
  const asked = questionsOf(reply);
  if (!asked.length) return false;
  const earlier = earlierAssistantLines.flatMap(questionsOf);
  return asked.some((q) =>
    earlier.some((e) => {
      const content = [...words(q)].filter((w) => !STOP.has(w));
      return content.length > 0 && similarity(q, e) >= 0.8;
    }),
  );
}

/**
 * Si el aprendiz preguntó, ¿la respuesta contesta antes de preguntar? null si
 * el aprendiz no hizo una pregunta (no aplica).
 */
export function answersLearnerQuestion(learner, reply) {
  if (!learner.includes("?")) return null;
  const first = (reply.match(/[^.!?]+[.!?]?/) ?? [""])[0].trim();
  return !first.endsWith("?");
}

export function percentile(values, p) {
  if (!values.length) return null;
  const sorted = [...values].sort((a, b) => a - b);
  const index = Math.min(sorted.length - 1, Math.ceil((p / 100) * sorted.length) - 1);
  return sorted[Math.max(0, index)];
}

/** Resume conversaciones medidas en los SC y marca cuáles pasan el umbral. */
export function summarize(conversations) {
  const turns = conversations.flatMap((c) => c.turns);
  const first = turns.map((t) => t.firstVisibleMs).filter((v) => typeof v === "number");
  const done = turns.map((t) => t.doneMs).filter((v) => typeof v === "number");
  const calls = turns.map((t) => t.criticalCalls).filter((v) => typeof v === "number");
  const recoveries = turns.filter((t) => isRecovery(t.reply)).length;
  const reasks = turns.filter((t) => isReask(t.reply, t.earlierQuestions ?? [])).length;
  const asked = turns.map((t) => answersLearnerQuestion(t.learner, t.reply)).filter((v) => v !== null);
  const ready = conversations.map((c) => c.sceneReadyMs).filter((v) => typeof v === "number");

  const s = {
    conversations: conversations.length,
    turns: turns.length,
    sc001: { p50: percentile(first, 50), p95: percentile(first, 95) },
    sc002: { p50: percentile(done, 50), p95: percentile(done, 95) },
    sc003: { max: calls.length ? Math.max(...calls) : null, p95: percentile(calls, 95) },
    sc004: { count: recoveries },
    sc005: { count: reasks, rate: turns.length ? reasks / turns.length : 0 },
    sc006: {
      asked: asked.length,
      answered: asked.filter(Boolean).length,
      rate: asked.length ? asked.filter(Boolean).length / asked.length : 1,
    },
    sc007: { p50: percentile(ready, 50), p95: percentile(ready, 95) },
  };
  const T = THRESHOLDS;
  return { ...s, pass: passOf(s, T) };
}

function passOf(s, T) {
  return {
    sc001: s.sc001.p95 !== null && s.sc001.p95 <= T.sc001FirstVisibleP95Ms,
    sc002: s.sc002.p95 !== null && s.sc002.p95 <= T.sc002DoneP95Ms,
    sc003: s.sc003.max !== null && s.sc003.max <= T.sc003MaxCriticalCalls,
    sc004: s.sc004.count <= T.sc004MaxRecoveries,
    sc005: s.sc005.rate <= T.sc005MaxReaskRate,
    sc006: s.sc006.rate >= T.sc006MinAnsweredRate,
    sc007: s.sc007.p95 !== null && s.sc007.p95 <= T.sc007SceneReadyP95Ms,
  };
}

/** Reporte Markdown para la issue / las notas del release. */
export function toMarkdown(summary, meta) {
  const ok = (b) => (b ? "✅" : "❌");
  const ms = (v) => (v === null ? "—" : `${(v / 1000).toFixed(1)} s`);
  return [
    `## Banco de simulación — ${meta.label}`,
    "",
    `${summary.conversations} conversaciones · ${summary.turns} turnos · ${meta.date} · ${meta.engine}`,
    "",
    "| Criterio | Medido | Meta | |",
    "|---|---|---|---|",
    `| SC-001 primera palabra visible (p95) | ${ms(summary.sc001.p95)} (p50 ${ms(summary.sc001.p50)}) | ≤ 2 s | ${ok(summary.pass.sc001)} |`,
    `| SC-002 respuesta completa (p95) | ${ms(summary.sc002.p95)} (p50 ${ms(summary.sc002.p50)}) | ≤ 4 s | ${ok(summary.pass.sc002)} |`,
    `| SC-003 llamadas en el camino crítico (máx) | ${summary.sc003.max ?? "—"} | ≤ 2 | ${ok(summary.pass.sc003)} |`,
    `| SC-004 frases de recuperación | ${summary.sc004.count} | 0 | ${ok(summary.pass.sc004)} |`,
    `| SC-005 re-preguntas | ${(summary.sc005.rate * 100).toFixed(0)} % (${summary.sc005.count}) | ≤ 5 % | ${ok(summary.pass.sc005)} |`,
    `| SC-006 preguntas del aprendiz contestadas | ${(summary.sc006.rate * 100).toFixed(0)} % (${summary.sc006.answered}/${summary.sc006.asked}) | ≥ 90 % | ${ok(summary.pass.sc006)} |`,
    `| SC-007 escena lista (p95) | ${ms(summary.sc007.p95)} | ≤ 10 s | ${ok(summary.pass.sc007)} |`,
    "",
  ].join("\n");
}

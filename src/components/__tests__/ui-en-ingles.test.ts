/**
 * Freno del Artículo 9 (v1.6.0): la UI habla INGLÉS; el único andamiaje en
 * español son los tooltips (`title="…"` y `<TooltipContent>`). Comentarios y
 * descripciones de tests siguen en español por convención del repo.
 *
 * Escanea el fuente como texto: quita comentarios y tooltips y, si queda un
 * carácter propio del español (áéíóúñ¿¡) en cualquier otra línea, falla y lista
 * archivo:línea. Es heurístico —no detecta español sin tildes— pero muerde en
 * el caso común y no deja pasar copy arrastrado.
 */

import { describe, it, expect } from "vitest";
import fs from "node:fs";
import path from "node:path";

const RAIZ = process.cwd();

/** Superficies de UI: todo .tsx que no sea prueba. */
const CARPETAS_UI = ["src/components", "src/app", "src/interface"];

/**
 * Módulos de dominio/aplicación cuyos textos la UI muestra tal cual (plan del
 * día, lecciones anotadas, informe de sesión…). El contenido pedagógico de
 * `src/lib/*-data` es material de estudio para hispanohablantes y NO entra.
 */
const MODULOS_DE_PRODUCTO = [
  "src/domain/curriculum/study-plan.ts",
  "src/domain/curriculum/personal-study-plan.ts",
  "src/domain/curriculum/self-assessment.ts",
  "src/domain/curriculum/method-rules.ts",
  "src/domain/curriculum/seven-step-cycle.ts",
  "src/domain/curriculum/challenge-readiness.ts",
  "src/domain/srs/srs-card.ts",
  "src/domain/practice/practice-today.ts",
  "src/domain/tutor/practice-recommender.ts",
  "src/domain/lessons/lesson-todo-drafts.ts",
  "src/domain/srs/recall-check.ts",
  "src/domain/exercises/drill-options.ts",
  "src/domain/progression/progress-metrics.ts",
  "src/domain/onboarding/diagnosis-summary.ts",
  "src/domain/feedback/report-text.ts",
  "src/domain/feedback/session-summary.ts",
  "src/domain/feedback/lesson-tips.ts",
  "src/domain/chat/voice-requirement.ts",
  "src/lib/theme.ts",
];

const ESPANOL = /[áéíóúñ¿¡ÁÉÍÓÚÑ]/;

function listarTsx(dir: string): string[] {
  const abs = path.join(RAIZ, dir);
  if (!fs.existsSync(abs)) return [];
  const out: string[] = [];
  for (const entry of fs.readdirSync(abs, { withFileTypes: true })) {
    const rel = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      if (entry.name === "__tests__") continue;
      out.push(...listarTsx(rel));
    } else if (/\.tsx?$/.test(entry.name) && !/\.test\.tsx?$/.test(entry.name)) {
      out.push(rel);
    }
  }
  return out;
}

/** Quita comentarios (bloque y línea) y tooltips, conservando los saltos de línea. */
function sinComentariosNiTooltips(src: string): string {
  const conservarLineas = (s: string) => s.replace(/[^\n]/g, " ");
  return (
    src
      // comentarios de bloque: /* … */ (incluye {/* … */} de JSX)
      .replace(/\/\*[\s\S]*?\*\//g, conservarLineas)
      // comentarios de línea: `//` al inicio o tras espacio (no `://` de URLs)
      .replace(/(^|\s)\/\/[^\n]*/g, (m) => conservarLineas(m))
      // <TooltipContent …>…</TooltipContent>
      .replace(/<TooltipContent[\s\S]*?<\/TooltipContent>/g, conservarLineas)
      // title="…" | title='…' | title={`…`} | title={"…"} | title={cond ? "…" : "…"} (una línea)
      .replace(/\btitle=(?:"[^"]*"|'[^']*'|\{[^}\n]*\})/g, (m) => conservarLineas(m))
      // title={ … } multilínea con template o ternario
      .replace(/\btitle=\{[\s\S]*?\}\s*\n/g, conservarLineas)
  );
}

function lineasEnEspanol(rel: string): string[] {
  const src = fs.readFileSync(path.join(RAIZ, rel), "utf8");
  return sinComentariosNiTooltips(src)
    .split("\n")
    .map((linea, i) => (ESPANOL.test(linea) ? `${rel}:${i + 1}: ${linea.trim()}` : null))
    .filter((x): x is string => x !== null);
}

describe("la UI habla inglés; sólo los tooltips van en español (Artículo 9)", () => {
  it("ningún componente, página ni módulo de producto tiene copy en español fuera de tooltips", () => {
    const archivos = [...CARPETAS_UI.flatMap(listarTsx), ...MODULOS_DE_PRODUCTO];
    const hallazgos = archivos.flatMap(lineasEnEspanol);
    expect(hallazgos, `copy en español fuera de tooltips:\n${hallazgos.join("\n")}`).toEqual([]);
  });

  it("el escáner ignora comentarios y tooltips pero ve el copy", () => {
    const muestra = [
      "// comentario en español con ñ",
      "{/* otro comentario: ¿por qué? */}",
      '<Button title="Explicación en español">Save</Button>',
      "<TooltipContent>",
      "  Traducir este mensaje al español",
      "</TooltipContent>",
      '<p>Explicación</p>',
    ].join("\n");
    const restante = sinComentariosNiTooltips(muestra)
      .split("\n")
      .filter((l) => ESPANOL.test(l));
    expect(restante).toEqual(["<p>Explicación</p>"]);
  });
});

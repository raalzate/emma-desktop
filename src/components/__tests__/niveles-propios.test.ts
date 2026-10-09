/**
 * Freno de «niveles propios» (FR-006, feature #206): la app muestra «Level 1…5»
 * y NUNCA un código CEFR (A1…C2) ni la palabra CEFR en texto visible. Por dentro
 * la escala CEFR sigue existiendo (tipos, reglas, prompts al LLM): este freno
 * solo mira lo que se pinta.
 *
 * Escanea el fuente como texto (mismo estilo que ui-en-ingles.test.ts): quita
 * comentarios, tooltips (van en español y pueden decir «Nivel N»), imports y
 * líneas de tipos; luego busca el código/palabra dentro de literales de cadena
 * y de texto JSX. Un literal que ES exactamente un código ("A1") es un valor
 * interno (comparación, clave, dato), no texto visible, y no se marca.
 * Los valores dinámicos ({level}) no se ven aquí: los cubren los tests de render.
 */

import { describe, it, expect } from "vitest";
import fs from "node:fs";
import path from "node:path";

const RAIZ = process.cwd();

/** Superficies de UI: todo .ts/.tsx que no sea prueba. */
const CARPETAS_UI = ["src/components", "src/app", "src/interface"];

/** Módulos de dominio/aplicación cuyos textos la UI muestra tal cual. */
const MODULOS_DE_PRODUCTO = [
  "src/domain/curriculum/study-plan.ts",
  "src/domain/curriculum/personal-study-plan.ts",
  "src/domain/curriculum/method-rules.ts",
  "src/domain/curriculum/seven-step-cycle.ts",
  "src/domain/curriculum/challenge-readiness.ts",
  "src/domain/practice/practice-today.ts",
  "src/domain/tutor/practice-recommender.ts",
  "src/domain/lessons/lesson-todo-drafts.ts",
  "src/domain/progression/progress-metrics.ts",
  "src/domain/onboarding/diagnosis-summary.ts",
  "src/domain/feedback/report-text.ts",
  "src/domain/feedback/session-summary.ts",
  "src/domain/feedback/lesson-tips.ts",
];

/**
 * Lista blanca explícita: `archivo:fragmento` de casos legítimos NO visibles
 * que el heurístico marcaría. Vacía a propósito; cada alta exige justificación.
 */
const LISTA_BLANCA: readonly string[] = [];

const CODIGO = /\b(?:A1|A2|B1|B2|C1|C2|CEFR)\b/;
const CODIGO_EXACTO = /^(?:A1|A2|B1|B2|C1|C2)$/;

function listar(dir: string): string[] {
  const abs = path.join(RAIZ, dir);
  if (!fs.existsSync(abs)) return [];
  const out: string[] = [];
  for (const entry of fs.readdirSync(abs, { withFileTypes: true })) {
    const rel = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      if (entry.name === "__tests__") continue;
      out.push(...listar(rel));
    } else if (/\.tsx?$/.test(entry.name) && !/\.test\.tsx?$/.test(entry.name)) {
      out.push(rel);
    }
  }
  return out;
}

/** Quita comentarios, tooltips, imports y declaraciones de tipo, conservando saltos de línea. */
export function limpiar(src: string): string {
  const blanco = (s: string) => s.replace(/[^\n]/g, " ");
  return src
    .replace(/\/\*[\s\S]*?\*\//g, blanco)
    .replace(/(^|\s)\/\/[^\n]*/g, blanco)
    .replace(/<TooltipContent[\s\S]*?<\/TooltipContent>/g, blanco)
    .replace(/\btitle=(?:"[^"]*"|'[^']*'|\{[^}\n]*\})/g, blanco)
    .replace(/\btitle=\{[\s\S]*?\}\s*\n/g, blanco)
    .replace(/^\s*import[\s\S]*?from\s+["'][^"']+["'];?/gm, blanco)
    .replace(/^\s*(?:export\s+)?type\s+\w+[^=\n]*=[^;]*;/gm, blanco);
}

const LITERAL = /(["'`])((?:\\.|(?!\1)[^\\\n])*)\1/g;

/** Hallazgos de una línea ya limpia: literales con código y texto JSX con código. */
export function hallazgosDeLinea(linea: string): string[] {
  const out: string[] = [];
  for (const m of linea.matchAll(LITERAL)) {
    const contenido = m[2];
    if (CODIGO_EXACTO.test(contenido)) continue;
    if (CODIGO.test(contenido)) out.push(contenido);
  }
  const sinLiterales = linea.replace(LITERAL, (s) => " ".repeat(s.length));
  for (const m of sinLiterales.matchAll(/>([^<>{}]*)</g)) {
    if (CODIGO.test(m[1])) out.push(m[1].trim());
  }
  // Texto JSX suelto en su propia línea (sin sintaxis de código).
  // Se descartan las claves de objeto (`C1: null,`), que son datos internos.
  const esClave = /^\s*\w+\s*:/.test(sinLiterales);
  if (!esClave && !/[{}();=<>]/.test(sinLiterales) && CODIGO.test(sinLiterales)) {
    out.push(sinLiterales.trim());
  }
  return out;
}

function hallazgosDe(rel: string): string[] {
  const src = fs.readFileSync(path.join(RAIZ, rel), "utf8");
  return limpiar(src)
    .split("\n")
    .flatMap((linea, i) =>
      hallazgosDeLinea(linea)
        .map((h) => `${rel}:${i + 1}: ${h}`)
        .filter((h) => !LISTA_BLANCA.some((permitido) => h.startsWith(permitido))),
    );
}

describe("niveles propios: la UI nunca muestra códigos CEFR (FR-006)", () => {
  it("ningún componente, página ni módulo de producto escribe un código CEFR o «CEFR» en texto visible", () => {
    const archivos = [...CARPETAS_UI.flatMap(listar), ...MODULOS_DE_PRODUCTO];
    const hallazgos = archivos.flatMap(hallazgosDe);
    expect(hallazgos, `código CEFR en texto visible (usa levelLabel):\n${hallazgos.join("\n")}`).toEqual([]);
  });

  it("el escáner marca texto con código pero no valores internos, comentarios ni tooltips", () => {
    const muestra = [
      "// Your CEFR journey (comentario)",
      'const nivel = "A1";',
      'if (level === "B2") return;',
      '<p>Your CEFR journey from A1 to C1</p>',
      '<span aria-label="CEFR ladder" />',
      'const t = `You are at B1`;',
      '<Button title="Nivel A1">Go</Button>',
      "<TooltipContent>Tu nivel CEFR</TooltipContent>",
    ];
    const marcados = limpiar(muestra.join("\n")).split("\n").flatMap(hallazgosDeLinea);
    expect(marcados).toEqual(["Your CEFR journey from A1 to C1", "CEFR ladder", "You are at B1"]);
  });
});

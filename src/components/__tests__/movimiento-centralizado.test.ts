/**
 * Freno de movimiento (#212): los componentes de práctica (y la lista de
 * lecciones) animan SOLO a través de `@/components/motion`, nunca importando
 * `motion/react` directo; así reduced motion y los presets viven en un solo
 * sitio. Escanea el fuente como texto.
 */

import { describe, it, expect } from "vitest";
import fs from "node:fs";
import path from "node:path";

const RAIZ = process.cwd();
const ANIMADOS = [
  "src/components/practice/exercise-drill.tsx",
  "src/components/practice/srs-review.tsx",
  "src/components/practice/minimal-pair-lab.tsx",
  "src/components/practice/challenge-view.tsx",
  "src/components/practice/study-plan-view.tsx",
  "src/components/practice/practice-today.tsx",
  "src/components/practice/practice-route-shell.tsx",
  "src/components/lessons/lesson-todo-list.tsx",
];

function leer(rel: string): string {
  return fs.readFileSync(path.join(RAIZ, rel), "utf8");
}

describe("movimiento centralizado", () => {
  it.each(ANIMADOS)("%s importa de @/components/motion y no de motion/react", (rel) => {
    const src = leer(rel);
    expect(src).toContain('from "@/components/motion"');
    expect(src).not.toMatch(/from ["']motion\/react["']/);
    expect(src).not.toMatch(/from ["']framer-motion["']/);
  });

  it("la raíz del renderer envuelve todo en MotionProvider (reducedMotion=user)", () => {
    expect(leer("src/interface/app-providers.tsx")).toContain("<MotionProvider>");
    expect(leer("src/components/motion/index.tsx")).toContain('reducedMotion="user"');
  });
});

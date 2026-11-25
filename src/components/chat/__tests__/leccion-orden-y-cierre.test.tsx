/**
 * Lección de cierre (#357, T7): la lección de Emma va primero y suena sola al
 * abrirse por primera vez; las correcciones van debajo. Al final, «Done»; si
 * se reabre desde el historial, «Back».
 */
import { describe, expect, it } from "vitest";
import fs from "node:fs";
import { shouldAutoplayLesson } from "@/components/chat/lesson-dialog";

const src = fs.readFileSync("src/components/chat/lesson-dialog.tsx", "utf8");

describe("shouldAutoplayLesson", () => {
  const base = { open: true, lesson: "Use contractions. Say I'm working on it.", stored: false, alreadyPlayed: false };
  it("suena sola al abrir una lección nueva", () => {
    expect(shouldAutoplayLesson(base)).toBe(true);
  });
  it("no suena al reabrirla desde el historial, ni dos veces, ni cerrada, ni sin texto", () => {
    expect(shouldAutoplayLesson({ ...base, stored: true })).toBe(false);
    expect(shouldAutoplayLesson({ ...base, alreadyPlayed: true })).toBe(false);
    expect(shouldAutoplayLesson({ ...base, open: false })).toBe(false);
    expect(shouldAutoplayLesson({ ...base, lesson: "" })).toBe(false);
  });
});

describe("orden y cierre", () => {
  it("la lección de Emma va antes que las correcciones", () => {
    expect(src.indexOf("<LessonKaraoke")).toBeGreaterThan(-1);
    expect(src.indexOf("<LessonKaraoke")).toBeLessThan(src.indexOf("<Markdown>{reportParts.before}</Markdown>"));
  });

  it("al final ofrece Done (lección nueva) o Back (reabierta), con tooltip", () => {
    expect(src).toMatch(/view\.stored \?/);
    expect(src).toMatch(/title="[^"]+"[\s\S]{0,160}<ArrowLeft[^>]*\/>\s*Back/);
    expect(src).toMatch(/title="[^"]+"[\s\S]{0,160}<Check[^>]*\/>\s*Done/);
  });
});

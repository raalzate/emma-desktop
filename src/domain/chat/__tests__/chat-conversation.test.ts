import { describe, expect, it } from "vitest";
import { deriveTitle, readStoredLesson, stripForStorage } from "../chat-conversation";

const leccion = {
  report: "## Lección",
  lesson: null,
  verdict: "Sigue practicando.",
  decision: { promoted: false, newLevel: "B1", passed: false },
  at: 1_700_000_000_000,
};

describe("readStoredLesson", () => {
  it("devuelve la lección guardada cuando es válida", () => {
    expect(readStoredLesson({ lesson: leccion })).toEqual(leccion);
  });

  it("devuelve null si la conversación no tiene lección", () => {
    expect(readStoredLesson({})).toBeNull();
    expect(readStoredLesson(null)).toBeNull();
  });

  it("descarta una lección corrupta del almacén en vez de propagarla", () => {
    expect(readStoredLesson({ lesson: { report: "" } })).toBeNull();
    expect(readStoredLesson({ lesson: "texto suelto" })).toBeNull();
  });
});

describe("deriveTitle", () => {
  it("usa el primer mensaje del aprendiz", () => {
    expect(deriveTitle("Daily Standup", [{ role: "user", content: "I finished the API" }])).toBe(
      "I finished the API",
    );
  });

  it("cae al título del escenario si el aprendiz aún no habló", () => {
    expect(deriveTitle("Daily Standup", [{ role: "assistant", content: "Morning!" }])).toBe(
      "Daily Standup",
    );
  });
});

describe("stripForStorage", () => {
  it("descarta el audio de sesión y conserva la transcripción", () => {
    const guardado = stripForStorage([
      { role: "user", content: "hi", at: 1, audioUrl: "blob:x" },
    ]);
    expect(guardado).toEqual([{ role: "user", content: "hi", at: 1 }]);
  });
});

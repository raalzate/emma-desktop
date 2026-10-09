import { describe, expect, it } from "vitest";
import {
  archiveForLevelUp, deriveTitle, groupArchivedByLevel, readArchived, readStoredLesson,
  sanitizeConversation, stripForStorage, type ChatConversation,
} from "../chat-conversation";

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

describe("archivado por subida de nivel (FR-008)", () => {
  const base = {
    title: "t", scenarioType: "daily_standup", messages: [], turnCount: 0,
    createdAt: 1, updatedAt: 1,
  };
  const conv = (id: string, level: string, extra: object = {}): ChatConversation => ({
    ...base, id, level, ...extra,
  });
  const NOW = "2026-10-09T10:00:00.000Z";

  it("archiva las conversaciones del nivel anterior y de niveles previos", () => {
    const out = archiveForLevelUp([conv("a", "A1"), conv("b", "A2"), conv("c", "B1")], "A2", NOW);
    expect(out.find((c) => c.id === "a")?.archived).toEqual({ level: "A1", at: NOW });
    expect(out.find((c) => c.id === "b")?.archived).toEqual({ level: "A2", at: NOW });
    expect(out.find((c) => c.id === "c")?.archived).toBeUndefined();
  });

  it("no toca las ya archivadas (conserva su fecha)", () => {
    const ya = { level: "A1" as const, at: "2026-01-01T00:00:00.000Z" };
    const original = conv("a", "A1", { archived: ya });
    const out = archiveForLevelUp([original], "A1", NOW);
    expect(out[0]).toBe(original);
  });

  it("ignora conversaciones con nivel desconocido", () => {
    const out = archiveForLevelUp([conv("x", "ZZ")], "B1", NOW);
    expect(out[0].archived).toBeUndefined();
  });

  it("readArchived valida: ignora lo mal formado", () => {
    expect(readArchived({ archived: { level: "A1", at: NOW } })).toEqual({ level: "A1", at: NOW });
    expect(readArchived({ archived: { level: "Z9", at: NOW } })).toBeNull();
    expect(readArchived({ archived: { level: "A1" } })).toBeNull();
    expect(readArchived({ archived: "sí" })).toBeNull();
    expect(readArchived({})).toBeNull();
  });

  it("sanitizeConversation descarta un archived corrupto y conserva el válido", () => {
    const mala = sanitizeConversation({ ...conv("a", "A1"), archived: { level: 3 } } as unknown as ChatConversation);
    expect("archived" in mala).toBe(false);
    const buena = sanitizeConversation(conv("a", "A1", { archived: { level: "A1", at: NOW } }));
    expect(buena.archived).toEqual({ level: "A1", at: NOW });
  });

  it("groupArchivedByLevel agrupa por nivel en orden del escalafón", () => {
    const arch = (id: string, level: "A1" | "B1") => conv(id, level, { archived: { level, at: NOW } });
    const g = groupArchivedByLevel([arch("a", "B1"), arch("b", "A1"), arch("c", "A1"), conv("d", "A1")]);
    expect(g.map((x) => x.level)).toEqual(["A1", "B1"]);
    expect(g[0].conversations.map((x) => x.id)).toEqual(["b", "c"]);
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

import { describe, expect, it } from "vitest";
import {
  clipsInGroup, formatClipDate, formatDuration, formatMb, groupByConversation, groupKey, originLabel, parseCapMb,
} from "@/components/settings/audio-storage-model";
import type { AudioClipMeta } from "@/domain/audio/audio-clip";

const clip = (id: string, conversationId: string | undefined, bytes: number): AudioClipMeta => ({
  id, origin: "learner", text: "hi", conversationId, durationMs: 1000, bytes, createdAt: 1,
});

describe("formatMb", () => {
  it("muestra megas con un decimal", () => {
    expect(formatMb(0)).toBe("0.0 MB");
    expect(formatMb(1.5 * 1024 * 1024)).toBe("1.5 MB");
  });
});

describe("parseCapMb", () => {
  it("convierte megas a bytes", () => {
    expect(parseCapMb("500")).toEqual({ ok: true, bytes: 500 * 1024 * 1024 });
  });
  it("rechaza menos de 50 MB, vacío o basura", () => {
    expect(parseCapMb("49")).toMatchObject({ ok: false });
    expect(parseCapMb("")).toMatchObject({ ok: false });
    expect(parseCapMb("abc")).toMatchObject({ ok: false });
  });
  it("acepta exactamente el mínimo", () => {
    expect(parseCapMb("50")).toMatchObject({ ok: true });
  });
});

describe("groupByConversation", () => {
  it("agrupa por conversación con conteo y bytes, mayores primero; sin dueño va aparte", () => {
    const groups = groupByConversation([clip("a", "c1", 10), clip("b", "c1", 5), clip("c", "c2", 100), clip("d", undefined, 1)]);
    expect(groups.map((g) => [g.conversationId, g.count, g.bytes])).toEqual([
      ["c2", 1, 100], ["c1", 2, 15], [null, 1, 1],
    ]);
  });
});

describe("clips de un grupo", () => {
  const c = (id: string, conv: string | undefined, createdAt: number): AudioClipMeta => ({
    id, origin: "learner", text: "hi", conversationId: conv, durationMs: 1000, bytes: 10, createdAt,
  });
  it("filtra por conversación y deja los más nuevos primero", () => {
    const all = [c("a", "c1", 1), c("b", "c2", 5), c("d", "c1", 9)];
    expect(clipsInGroup(all, "c1").map((x) => x.id)).toEqual(["d", "a"]);
  });
  it("null agrupa los intentos sin conversación", () => {
    expect(clipsInGroup([c("a", "c1", 1), c("b", undefined, 2)], null).map((x) => x.id)).toEqual(["b"]);
  });
  it("groupKey usa 'other' para null", () => {
    expect(groupKey(null)).toBe("other");
    expect(groupKey("c1")).toBe("c1");
  });
});

describe("etiquetas de clip", () => {
  it("origen en inglés", () => {
    expect(originLabel("learner")).toBe("Your voice");
    expect(originLabel("emma")).toBe("EMMA");
    expect(originLabel("attempt")).toBe("Attempt");
  });
  it("duración m:ss", () => {
    expect(formatDuration(7400)).toBe("0:07");
    expect(formatDuration(65000)).toBe("1:05");
  });
  it("fecha ISO yyyy-mm-dd", () => {
    expect(formatClipDate(Date.UTC(2026, 10, 10, 12))).toBe("2026-11-10");
  });
});

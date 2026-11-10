import { describe, expect, it } from "vitest";
import { formatMb, groupByConversation, parseCapMb } from "@/components/settings/audio-storage-model";
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

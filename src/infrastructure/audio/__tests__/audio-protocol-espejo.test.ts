import { describe, expect, it } from "vitest";
import { audioClipMetaSchema } from "../ipc-audio-store";
import { CLIP_ID_PATTERN, CLIP_MIME, MAX_CLIP_BYTES, MAX_CLIP_SECONDS } from "@/domain/audio/audio-clip";
import {
  clipMetaSchema as mainMetaSchema,
  MAX_CLIP_BYTES as MAIN_MAX_BYTES,
  MAX_CLIP_MS,
  parseClipId,
  parseSaveArgs,
} from "../../../../main/services/audio-protocol";

// Contrato espejo: `main` no puede importar `@/`, así que el esquema del renderer
// es una copia. Estos casos fijos garantizan que no divergan (FR-005, FR-036).

const valid = {
  id: "emma-hello-0123456789abcdef",
  origin: "emma",
  text: "How can I help you?",
  voice: "bf_emma",
  conversationId: "conv-1",
  durationMs: 2000,
  bytes: 30_000,
  createdAt: 1_700_000_000_000,
};

const with_ = (over: Record<string, unknown>) => ({ ...valid, ...over });

const casos: Array<[string, unknown]> = [
  ["meta válida", valid],
  ["id con ../", with_({ id: "../etc/passwd" })],
  ["id con barra", with_({ id: "a/b" })],
  ["id con mayúsculas", with_({ id: "ABC" })],
  ["id vacío", with_({ id: "" })],
  ["id de 96 caracteres", with_({ id: "a".repeat(96) })],
  ["id de 97 caracteres", with_({ id: "a".repeat(97) })],
  ["origen ajeno", with_({ origin: "robot" })],
  ["texto vacío", with_({ text: "" })],
  ["texto de 2000", with_({ text: "x".repeat(2000) })],
  ["texto de 2001", with_({ text: "x".repeat(2001) })],
  ["duración exactamente 60 s", with_({ durationMs: 60_000 })],
  ["duración > 60 s", with_({ durationMs: 60_001 })],
  ["duración 0", with_({ durationMs: 0 })],
  ["duración fraccionaria", with_({ durationMs: 10.5 })],
  ["bytes exactamente 1,5 MB", with_({ bytes: 1_500_000 })],
  ["bytes > 1,5 MB", with_({ bytes: 1_500_001 })],
  ["bytes 0", with_({ bytes: 0 })],
  ["voz con ruta", with_({ voice: "../x" })],
  ["conversationId con punto", with_({ conversationId: "a.b" })],
  ["cardId de 200", with_({ cardId: "c".repeat(200) })],
  ["cardId de 201", with_({ cardId: "c".repeat(201) })],
  ["createdAt negativo", with_({ createdAt: -1 })],
  ["campo extra", with_({ extra: true })],
  ["sin id", (({ id: _id, ...rest }) => rest)(valid)],
  ["no es objeto", "texto"],
];

describe("esquema del renderer espeja el de main (audio-protocol)", () => {
  for (const [nombre, caso] of casos) {
    it(`meta: ${nombre} se acepta o rechaza igual`, () => {
      expect(audioClipMetaSchema.safeParse(caso).success).toBe(mainMetaSchema.safeParse(caso).success);
    });
  }

  it("ids: el mismo patrón acepta/rechaza igual que parseClipId", () => {
    for (const id of ["ok-1", "../x", "a\\b", "a:b", "-x", "a".repeat(96), "a".repeat(97), ""]) {
      const main = (() => { try { parseClipId(id); return true; } catch { return false; } })();
      expect(CLIP_ID_PATTERN.test(id)).toBe(main);
    }
  });

  it("las constantes compartidas coinciden (60 s, 1,5 MB, patrón de id)", () => {
    expect(MAX_CLIP_SECONDS * 1000).toBe(MAX_CLIP_MS);
    expect(MAX_CLIP_BYTES).toBe(MAIN_MAX_BYTES);
  });

  describe("mime: el que manda el renderer lo acepta main y uno ajeno no", () => {
    const data = new Uint8Array([0x1a, 0x45, 0xdf, 0xa3, 1, 2]);
    const meta = with_({ bytes: data.byteLength });
    it("CLIP_MIME pasa", () => {
      expect(() => parseSaveArgs({ meta, mime: CLIP_MIME, data })).not.toThrow();
    });
    it("audio/wav y text/html se rechazan", () => {
      expect(() => parseSaveArgs({ meta, mime: "audio/wav", data })).toThrow();
      expect(() => parseSaveArgs({ meta, mime: "text/html", data })).toThrow();
    });
  });
});

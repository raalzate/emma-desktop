import { describe, it, expect } from "vitest";
import { sanitizeReply, hasNonLatinScript } from "../sanitize-reply";

describe("sanitizeReply — escrituras no latinas (BUG-001)", () => {
  it("elimina texto tailandés (patología vista en producción)", () => {
    const raw = "If you want me to help. ถ้าคุณต้องการให้ฉันช่วยในฐานะผู้ช่วย (to give a clear answer)";
    const clean = sanitizeReply(raw);
    expect(clean).not.toMatch(/[฀-๿]/);
    expect(clean).toContain("If you want me to help.");
  });

  it("elimina árabe, cirílico y devanagari", () => {
    expect(sanitizeReply("Hello مرحبا world")).not.toMatch(/[؀-ۿ]/);
    expect(sanitizeReply("Hello привет world")).not.toMatch(/[Ѐ-ӿ]/);
    expect(sanitizeReply("Hello नमस्ते world")).not.toMatch(/[ऀ-ॿ]/);
  });

  it("conserva acentos latinos (español) intactos", () => {
    expect(sanitizeReply("¿Qué pasó ayer, Sofía? El despliegue falló.")).toBe(
      "¿Qué pasó ayer, Sofía? El despliegue falló.",
    );
  });
});

describe("hasNonLatinScript — señal para la compuerta de streaming", () => {
  it("detecta tailandés y hangul", () => {
    expect(hasNonLatinScript("ถ้าคุณต้องการ")).toBe(true);
    expect(hasNonLatinScript("**[다음]**")).toBe(true);
  });

  it("no marca inglés ni español", () => {
    expect(hasNonLatinScript("What did you finish yesterday?")).toBe(false);
    expect(hasNonLatinScript("¿Qué hiciste ayer?")).toBe(false);
  });
});

describe("sanitizeReply — paréntesis vacíos (BUG-001)", () => {
  it("elimina paréntesis sin contenido tipo '( .)' o '()'", () => {
    expect(sanitizeReply('So, what exactly is the "next step" you are referring to?  ( .)')).toBe(
      'So, what exactly is the "next step" you are referring to?',
    );
    expect(sanitizeReply("Sounds good () let's move on.")).toBe("Sounds good let's move on.");
  });
});

describe("sanitizeReply — vietnamita y oraciones extranjeras (BUG-001)", () => {
  it("elimina oraciones en vietnamita (latín con diacríticos, visto en producción)", () => {
    const clean = sanitizeReply("'' bạn đang nói về dữ liệu (data) thì sao?");
    expect(clean).not.toMatch(/[ạảãđữệềồơư]/);
  });

  it("conserva las oraciones en inglés alrededor de la oración extranjera", () => {
    const clean = sanitizeReply("Sounds good. bạn đang nói về dữ liệu thì sao? Let's continue.");
    expect(clean).toContain("Sounds good.");
    expect(clean).toContain("Let's continue.");
    expect(clean).not.toMatch(/[ạữđ]/);
  });

  it("elimina comillas huérfanas al inicio de la respuesta", () => {
    expect(sanitizeReply("'' Great, tell me more.")).toBe("Great, tell me more.");
  });

  it("sigue conservando el español legítimo (Latin-1)", () => {
    expect(sanitizeReply("¿Qué pasó ayer, Sofía?")).toBe("¿Qué pasó ayer, Sofía?");
  });
});

describe("sanitizeReply — etiqueta de hablante (BUG-001)", () => {
  it("elimina el prefijo 'You:'/'Sofía:' cuando el modelo copia el formato del transcript", () => {
    expect(sanitizeReply("You: Nice, what's next for today?")).toBe(
      "Nice, what's next for today?",
    );
    expect(sanitizeReply("Sofía Torres: No blockers then?")).toBe("No blockers then?");
  });

  it("no toca oraciones legítimas con dos puntos internos", () => {
    expect(sanitizeReply("Quick reminder: demo at 3 PM.")).toBe("Quick reminder: demo at 3 PM.");
  });
});

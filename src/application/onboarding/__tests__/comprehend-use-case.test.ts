import { describe, it, expect } from "vitest";
import type { LlmGenerate } from "@/domain/ai/llm-port";
import { comprehendStep, validateCefrCode } from "../comprehend-use-case";

const llmReturning =
  (text: string): LlmGenerate =>
  async () =>
    text;

describe("comprehend-use-case — comprehendStep (skip)", () => {
  it("marca como omitido un paso no crítico ante 'skip'", async () => {
    const res = await comprehendStep({ llm: llmReturning("x"), step: "age", rawAnswer: "skip" });
    expect(res).toEqual({ value: "skipped", skipped: true });
  });

  it("acepta 'SKIP' sin distinguir mayúsculas", async () => {
    const res = await comprehendStep({ llm: llmReturning("x"), step: "role", rawAnswer: "  SKIP " });
    expect(res.skipped).toBe(true);
  });

  it("no permite saltar el paso crítico name (devuelve vacío para re-preguntar)", async () => {
    const res = await comprehendStep({ llm: llmReturning("x"), step: "name", rawAnswer: "skip" });
    expect(res).toEqual({ value: "", skipped: false });
  });
});

describe("comprehend-use-case — comprehendStep (extracción)", () => {
  it("devuelve vacío ante una respuesta en blanco sin llamar al LLM", async () => {
    let called = false;
    const llm: LlmGenerate = async () => {
      called = true;
      return "x";
    };
    const res = await comprehendStep({ llm, step: "role", rawAnswer: "   " });
    expect(res).toEqual({ value: "", skipped: false });
    expect(called).toBe(false);
  });

  it("normaliza el valor de texto con la salida del LLM", async () => {
    const res = await comprehendStep({
      llm: llmReturning("Backend Developer"),
      step: "role",
      rawAnswer: "well I do backend stuff",
    });
    expect(res).toEqual({ value: "Backend Developer", skipped: false });
  });

  it("extrae un entero positivo para pasos numéricos", async () => {
    const res = await comprehendStep({ llm: llmReturning("29"), step: "age", rawAnswer: "I'm 29" });
    expect(res.value).toBe(29);
  });

  it("cae al texto crudo cuando el LLM devuelve un entero inválido para age", async () => {
    const res = await comprehendStep({ llm: llmReturning("abc"), step: "age", rawAnswer: "twenty nine" });
    expect(res.value).toBe("twenty nine");
  });

  it("cae al texto crudo cuando el LLM lanza una excepción", async () => {
    const failing: LlmGenerate = async () => {
      throw new Error("boom");
    };
    const res = await comprehendStep({ llm: failing, step: "role", rawAnswer: "backend dev" });
    expect(res).toEqual({ value: "backend dev", skipped: false });
  });

  it("rechaza cero y negativos para pasos numéricos (cae a crudo)", async () => {
    const res = await comprehendStep({ llm: llmReturning("0"), step: "years_in_role", rawAnswer: "none" });
    expect(res.value).toBe("none");
  });
});

describe("comprehend-use-case — validateCefrCode", () => {
  it("devuelve el nivel cuando aparece exactamente uno", () => {
    expect(validateCefrCode("I think it's b2")).toBe("B2");
    expect(validateCefrCode("A1 A1 A1")).toBe("A1"); // mismo código repetido → único distinto
  });

  it("devuelve null cuando no hay código", () => {
    expect(validateCefrCode("no idea")).toBeNull();
  });

  it("devuelve null cuando hay más de un código distinto (ambiguo)", () => {
    expect(validateCefrCode("maybe A2 or B1")).toBeNull();
  });
});

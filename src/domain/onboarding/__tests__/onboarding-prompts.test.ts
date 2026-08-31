import { describe, it, expect } from "vitest";
import { getQuestion, buildSummary } from "../onboarding-prompts";

describe("onboarding-prompts — getQuestion", () => {
  it("devuelve la pregunta principal (attempt 0) del paso name", () => {
    expect(getQuestion("name", {}, 0)).toMatch(/what's your name/);
  });

  it("devuelve el reintento más suave (attempt 1)", () => {
    expect(getQuestion("name", {}, 1)).toMatch(/Just your first name/);
  });

  it("usa 0 como attempt por defecto", () => {
    expect(getQuestion("name", {})).toBe(getQuestion("name", {}, 0));
  });

  it("personaliza con el contexto ya recogido", () => {
    expect(getQuestion("age", { name: "Ada" }, 0)).toMatch(/Great to meet you, Ada/);
  });

  it("admite el paso especial 'resume' como saludo al retomar", () => {
    expect(getQuestion("resume", { name: "Ada" }, 0)).toMatch(/Welcome back, Ada/);
  });

  it("lanza error ante un paso desconocido", () => {
    expect(() => getQuestion("english_level", {}, 0)).toThrow(/Unknown step/);
  });

  it("lanza error ante un attempt inválido", () => {
    expect(() => getQuestion("name", {}, 2)).toThrow(/Invalid attempt/);
  });
});

describe("onboarding-prompts — buildSummary", () => {
  it("usa fallbacks cuando falta información", () => {
    const s = buildSummary({});
    expect(s).toMatch(/all set, there!/);
    expect(s).toMatch(/Role: tech professional/);
    expect(s).toMatch(/Stack: your stack/);
    expect(s).toMatch(/some experience/);
  });

  it("incluye nombre, rol, años y stack cuando están presentes", () => {
    const s = buildSummary({ name: "Ada", role: "Backend Dev", years_in_role: 4, tech_stack: "Go" });
    expect(s).toMatch(/all set, Ada!/);
    expect(s).toMatch(/Role: Backend Dev with 4 year\(s\) of experience/);
    expect(s).toMatch(/Stack: Go/);
  });

  it("no muestra la nota de error cuando errorCount es 0", () => {
    expect(buildSummary({ name: "Ada" }, 0)).not.toMatch(/work on together/);
  });

  it("muestra la nota de error cuando hay errores", () => {
    expect(buildSummary({ name: "Ada" }, 3)).toMatch(/work on together/);
  });
});

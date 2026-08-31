import { describe, it, expect } from "vitest";
import {
  REQUIRED_FIELDS,
  INSTANT_GREETING,
  missingFields,
  isContextComplete,
  capturedCount,
  buildTurnPrompt,
  parseContext,
  parseTurn,
  mergeContext,
  normalizeContext,
  buildClosingSummary,
  type OnboardingContext,
} from "../agentic-onboarding";

const complete: OnboardingContext = {
  name: "Ada",
  role: "Backend Developer",
  techStack: "Python, Go",
  skills: "meetings, interviews",
};

describe("agentic-onboarding — missingFields / isContextComplete", () => {
  it("lista los campos requeridos faltantes en un contexto vacío", () => {
    expect(missingFields({})).toEqual([...REQUIRED_FIELDS]);
  });

  it("no exige yearsInRole (no es un campo requerido)", () => {
    expect(REQUIRED_FIELDS).not.toContain("yearsInRole");
    expect(isContextComplete(complete)).toBe(true);
  });

  it("trata como faltante un campo con solo espacios en blanco", () => {
    expect(missingFields({ ...complete, name: "   " })).toEqual(["name"]);
  });

  it("marca el contexto incompleto si falta cualquier requerido", () => {
    expect(isContextComplete({ name: "Ada" })).toBe(false);
  });
});

describe("agentic-onboarding — capturedCount", () => {
  it("cuenta 0 en un contexto vacío", () => {
    expect(capturedCount({})).toBe(0);
  });

  it("cuenta los requeridos capturados (ignora yearsInRole)", () => {
    expect(capturedCount({ name: "Ada", role: "Dev", yearsInRole: 3 })).toBe(2);
  });
});

describe("agentic-onboarding — INSTANT_GREETING", () => {
  it("es un saludo fijo en inglés que pide el nombre", () => {
    expect(INSTANT_GREETING).toMatch(/Emma/);
    expect(INSTANT_GREETING).toMatch(/name/i);
  });
});

describe("agentic-onboarding — buildTurnPrompt", () => {
  it("en el primer turno indica que no hay intercambio previo", () => {
    const { system, user } = buildTurnPrompt({}, "", "");
    expect(system).toMatch(/Emma/);
    expect(system).toMatch(/DATA:/);
    expect(system).toMatch(/NEVER reveal you are an AI/);
    expect(user).toMatch(/very first turn/);
  });

  it("apunta a UN solo campo faltante (el primero), no a la lista completa", () => {
    const { user } = buildTurnPrompt({ name: "Ada" }, "Hi! What's your name?", "Ada");
    expect(user).toMatch(/their job role \/ title/);
    expect(user).not.toMatch(/the learner's first name/);
    // Los demás faltantes NO se mencionan: una sola pregunta por turno.
    expect(user).not.toMatch(/technologies \/ stack/);
    expect(user).not.toMatch(/skills or topics/);
    expect(user).toMatch(/- name: Ada/);
  });

  it("el system exige una sola pregunta de perfil y prohíbe dobles preguntas", () => {
    const { system } = buildTurnPrompt({ name: "Ada" }, "hi", "hello");
    expect(system).toMatch(/exactly ONE/);
    expect(system).toMatch(/never ask about two/i);
    expect(system).not.toMatch(/more than one missing thing/);
  });

  it("el system ordena responder primero las preguntas del usuario (como persona)", () => {
    const { system } = buildTurnPrompt({}, "What's your name?", "My name is Raul and you?");
    expect(system).toMatch(/answer (it|them) first/i);
  });

  it("incluye SOLO el último intercambio, no toda la conversación", () => {
    const { user } = buildTurnPrompt({ name: "Ada" }, "What's your role?", "I'm a backend dev");
    expect(user).toMatch(/Emma: What's your role\?/);
    expect(user).toMatch(/User: I'm a backend dev/);
  });

  it("cuando ya no falta nada pide cerrar cálidamente", () => {
    const { user } = buildTurnPrompt(complete, "ok", "sure");
    expect(user).toMatch(/You now know everything you need/);
  });
});

describe("agentic-onboarding — parseContext", () => {
  it("devuelve vacío cuando no hay JSON en el texto", () => {
    expect(parseContext("no json here")).toEqual({});
  });

  it("extrae y recorta los campos de texto conocidos", () => {
    const ctx = parseContext('{"name": "  Ada  ", "role": "Dev", "skills": "x", "techStack": "Go"}');
    expect(ctx).toEqual({ name: "Ada", role: "Dev", skills: "x", techStack: "Go" });
  });

  it("ignora claves con tipo incorrecto (name numérico)", () => {
    expect(parseContext('{"name": 42}').name).toBeUndefined();
  });
});

describe("agentic-onboarding — parseTurn", () => {
  it("separa el mensaje visible de la línea DATA final", () => {
    const raw = 'That sounds great! What do you work with?\nDATA: {"name":"Ada"}';
    const { message, extracted } = parseTurn(raw);
    expect(message).toBe("That sounds great! What do you work with?");
    expect(extracted).toEqual({ name: "Ada" });
  });

  it("si no hay línea DATA, el mensaje es el texto completo y extracted queda vacío", () => {
    const { message, extracted } = parseTurn("Just a friendly message, no data here.");
    expect(message).toBe("Just a friendly message, no data here.");
    expect(extracted).toEqual({});
  });

  it("nunca deja restos de JSON en el mensaje visible", () => {
    const { message } = parseTurn('Nice! DATA: {"role":"Dev"}');
    expect(message).not.toMatch(/[{}]/);
  });

  it("un JSON malformado en la línea DATA no rompe el parseo (extracted vacío)", () => {
    const { message, extracted } = parseTurn("Cool!\nDATA: { role: unquoted }");
    expect(message).toBe("Cool!");
    expect(extracted).toEqual({});
  });
});

describe("agentic-onboarding — mergeContext", () => {
  it("fusiona campos nuevos sobre los previos", () => {
    expect(mergeContext({ name: "Ada" }, { role: "Dev" })).toEqual({ name: "Ada", role: "Dev" });
  });

  it("no pisa un valor previo con uno vacío, en blanco o de una sola letra", () => {
    expect(mergeContext({ name: "Ada" }, { name: "   " })).toEqual({ name: "Ada" });
    expect(mergeContext({ name: "Ada" }, { name: "" })).toEqual({ name: "Ada" });
    expect(mergeContext({ name: "Ada" }, { name: "A" })).toEqual({ name: "Ada" });
  });

  it("sobrescribe con un valor nuevo de 2+ caracteres", () => {
    expect(mergeContext({ role: "Dev" }, { role: "Architect" }).role).toBe("Architect");
  });

  it("conserva yearsInRole=0 como valor válido al fusionar", () => {
    expect(mergeContext({}, { yearsInRole: 0 }).yearsInRole).toBe(0);
  });
});

describe("agentic-onboarding — normalizeContext", () => {
  it("capitaliza name y role tipo título", () => {
    expect(normalizeContext({ name: "ada  lovelace", role: "backend developer" })).toEqual({
      name: "Ada Lovelace",
      role: "Backend Developer",
    });
  });

  it("respeta siglas ya en mayúsculas como QA", () => {
    expect(normalizeContext({ role: "QA engineer" }).role).toBe("QA Engineer");
  });

  it("normaliza techStack coloquial a una lista canónica separada por comas", () => {
    const ctx = normalizeContext({ techStack: "pues trabajo con python y esas cosas, tambien aws" });
    expect(ctx.techStack).toBe("Python, AWS");
  });

  it("aplica alias conocidos de stack (node, js, ts)", () => {
    expect(normalizeContext({ techStack: "nodejs, js, ts" }).techStack).toBe("Node.js, JavaScript, TypeScript");
  });

  it("descarta valores vacíos o de solo relleno", () => {
    expect(normalizeContext({ name: "   ", techStack: "" })).toEqual({});
  });

  it("conserva yearsInRole entero no negativo", () => {
    expect(normalizeContext({ yearsInRole: 3 }).yearsInRole).toBe(3);
  });
});

describe("agentic-onboarding — buildClosingSummary", () => {
  it("sintetiza rol, experiencia, stack y foco de práctica sin ser un eco literal", () => {
    const summary = buildClosingSummary(complete);
    expect(summary).toMatch(/Ada/);
    expect(summary).toMatch(/Backend Developer/);
    expect(summary).toMatch(/Python, Go/);
    expect(summary).toMatch(/meetings, interviews/);
    expect(summary).toMatch(/first real workplace scenario/i);
  });

  it("funciona con contexto parcial sin lanzar", () => {
    expect(() => buildClosingSummary({})).not.toThrow();
    expect(buildClosingSummary({})).toMatch(/first real workplace scenario/i);
  });
});

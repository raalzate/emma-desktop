import { describe, it, expect } from "vitest";
import type { LlmGenerate } from "@/domain/ai/llm-port";
import type { OnboardingIo, OnboardingRepository } from "@/domain/onboarding/i-onboarding-repository";
import { emptyProfile, type UserProfile } from "@/domain/profile/user-profile";
import { OnboardingStateEngine } from "../onboarding-state-engine-use-case";

/** LLM falso que devuelve la respuesta cruda incrustada en el prompt de comprehend. */
const echoLlm: LlmGenerate = async ({ prompt }) => {
  const m = prompt.match(/Response: ([\s\S]*)\nOutput only/);
  return m ? m[1] : "";
};

function makeRepo(initial: UserProfile | null) {
  const state = { created: false, completed: false };
  let profile = initial;
  const saved: Array<{ step: string; value: string | number }> = [];
  const repo: OnboardingRepository = {
    getStatus: async () => profile,
    createEmpty: async () => {
      profile = emptyProfile("local");
      state.created = true;
      return profile;
    },
    saveStep: async (step, value) => {
      saved.push({ step, value });
    },
    markCompleted: async () => {
      state.completed = true;
      if (profile) profile = { ...profile, onboardingState: "completed" };
    },
  };
  return { repo, saved, state };
}

function makeIo(answers: string[]) {
  const asked: string[] = [];
  const notified: string[] = [];
  let i = 0;
  const io: OnboardingIo = {
    ask: async (prompt) => {
      asked.push(prompt);
      return answers[i++] ?? "";
    },
    notify: (m) => {
      notified.push(m);
    },
  };
  return { io, asked, notified };
}

describe("OnboardingStateEngine — perfil ya completado", () => {
  it("retorna de inmediato sin volver a preguntar", async () => {
    const completed = { ...emptyProfile("local"), name: "Ada", onboardingState: "completed" as const };
    const { repo, saved } = makeRepo(completed);
    const { io, asked } = makeIo([]);
    const res = await new OnboardingStateEngine({ repo }).run(io);
    expect(res.completed).toBe(true);
    expect(asked).toEqual([]);
    expect(saved).toEqual([]);
    expect(res.collected.name).toBe("Ada");
  });
});

describe("OnboardingStateEngine — recorrido completo", () => {
  it("recolecta todos los pasos, los persiste y marca completado", async () => {
    const { repo, saved, state } = makeRepo(null);
    const { io } = makeIo(["Ada", "29", "Backend Dev", "3", "Go, Python", "meetings"]);
    const res = await new OnboardingStateEngine({ repo, llm: echoLlm }).run(io);

    expect(state.created).toBe(true); // no había perfil → createEmpty
    expect(state.completed).toBe(true);
    expect(res.completed).toBe(true);
    expect(saved).toEqual([
      { step: "name", value: "Ada" },
      { step: "age", value: 29 }, // coaccionado a entero
      { step: "role", value: "Backend Dev" },
      { step: "years_in_role", value: 3 },
      { step: "tech_stack", value: "Go, Python" },
      { step: "skills", value: "meetings" },
    ]);
    expect(res.collected.name).toBe("Ada");
  });

  it("pregunta el resumen al final del recorrido", async () => {
    const { repo } = makeRepo(null);
    const { io, asked } = makeIo(["Ada", "29", "Backend Dev", "3", "Go", "meetings"]);
    await new OnboardingStateEngine({ repo, llm: echoLlm }).run(io);
    expect(asked[asked.length - 1]).toMatch(/all set, Ada!/);
  });
});

describe("OnboardingStateEngine — retomar (resume)", () => {
  it("saluda con el mensaje de resume cuando el perfil está en progreso con nombre", async () => {
    const inProgress = {
      ...emptyProfile("local"),
      name: "Ada",
      onboardingState: "in_progress" as const,
      onboardingStepLastCompleted: "name",
    };
    const { repo } = makeRepo(inProgress);
    // sin llm → la recolección se detiene enseguida; solo verificamos el saludo
    const { io, notified } = makeIo([]);
    await new OnboardingStateEngine({ repo }).run(io);
    expect(notified.some((m) => /Welcome back, Ada/.test(m))).toBe(true);
  });
});

describe("OnboardingStateEngine — sin LLM (documenta comportamiento actual)", () => {
  it("no recolecta ningún paso cuando no se inyecta un LLM", async () => {
    const { repo, saved } = makeRepo(null);
    const { io } = makeIo(["Ada", "29"]);
    const res = await new OnboardingStateEngine({ repo }).run(io);
    // BUG: la doc dice que sin LLM se usa el texto crudo, pero comprehend
    // devuelve "" siempre → coerce falla → no se persiste nada.
    expect(saved).toEqual([]);
    expect(res.collected.name).toBeUndefined();
    expect(res.completed).toBe(true);
  });
});

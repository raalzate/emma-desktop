/**
 * Provider de promptfoo: un turno de escena de EMMA para un aprendiz A1.
 *
 * Arma el system con `buildSimulationPrompt` (nivel A1) y corre el caso de uso
 * real `runChatTurn` — limpieza, guardias y reintentos incluidos — con un
 * `LlmGenerate` inyectado que habla con cualquier endpoint compatible con la
 * API de chat de OpenAI (Ollama, OpenAI, Gemini, LM Studio).
 *
 * Variables de entorno:
 *   EMMA_EVAL_BASE_URL  (def. http://localhost:11434/v1 — Ollama)
 *   EMMA_EVAL_MODEL     (def. gemma3n:e4b)
 *   EMMA_EVAL_API_KEY   (opcional; Ollama no la pide)
 * Con EMMA_EVAL_BASE_URL=anthropic usa Claude con el SDK oficial (lee
 * ANTHROPIC_API_KEY; modelo por defecto claude-opus-5).
 * Con EMMA_EVAL_BASE_URL=fixture el "modelo" devuelve `vars.fixture`: sirve
 * para probar el cableado y las aserciones sin red.
 */

import Anthropic from "@anthropic-ai/sdk";

import {
  buildSimulationPrompt,
  checkA1Reply,
  DEFAULT_CHAT_SETTINGS,
  emptyProfile,
  getScenario,
  kickoffCue,
  runChatTurn,
} from "./.build/emma-lib.mjs";

const LEVEL = "A1";
const LEARNER = { name: "Laura", role: "Junior developer", techStack: "Java, Spring" };

function config() {
  const baseUrl = process.env.EMMA_EVAL_BASE_URL ?? "http://localhost:11434/v1";
  const defaultModel = baseUrl === "anthropic" ? "claude-opus-5" : "gemma3n:e4b";
  return {
    baseUrl,
    model: process.env.EMMA_EVAL_MODEL ?? defaultModel,
    apiKey: process.env.EMMA_EVAL_API_KEY ?? "",
  };
}

function learnerProfile() {
  return { ...emptyProfile("eval"), ...LEARNER, englishLevel: LEVEL, onboardingState: "completed" };
}

/** Adaptador del puerto LlmGenerate sobre /chat/completions. */
function httpLlm({ baseUrl, model, apiKey }) {
  return async ({ prompt, system, maxTokens }) => {
    const res = await fetch(`${baseUrl.replace(/\/$/, "")}/chat/completions`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        ...(apiKey ? { Authorization: `Bearer ${apiKey}` } : {}),
      },
      body: JSON.stringify({
        model,
        max_tokens: maxTokens,
        messages: [
          ...(system ? [{ role: "system", content: system }] : []),
          { role: "user", content: prompt },
        ],
      }),
    });
    if (!res.ok) throw new Error(`LLM ${res.status}: ${(await res.text()).slice(0, 300)}`);
    const data = await res.json();
    return data.choices?.[0]?.message?.content ?? "";
  };
}

/**
 * Adaptador del puerto LlmGenerate sobre la API de Messages de Anthropic.
 * El pensamiento adaptativo consume del mismo max_tokens: se da holgura y se
 * baja el effort (una línea de diálogo no necesita razonar). Haiku 4.5 no
 * acepta effort.
 */
function anthropicLlm({ model }) {
  const client = new Anthropic();
  return async ({ prompt, system }) => {
    const response = await client.messages.create({
      model,
      max_tokens: 16000,
      ...(model.includes("haiku") ? {} : { output_config: { effort: "low" } }),
      ...(system ? { system } : {}),
      messages: [{ role: "user", content: prompt }],
    });
    if (response.stop_reason === "refusal") throw new Error("Claude rechazó el turno (refusal)");
    return response.content
      .filter((block) => block.type === "text")
      .map((block) => block.text)
      .join("");
  };
}

function llmFor(cfg, vars) {
  if (cfg.baseUrl === "fixture") return fixtureLlm(vars);
  if (cfg.baseUrl === "anthropic") return anthropicLlm(cfg);
  return httpLlm(cfg);
}

function fixtureLlm(vars) {
  return async () => String(vars.fixture ?? "");
}

export default class EmmaA1Provider {
  id() {
    const { baseUrl, model } = config();
    return baseUrl === "fixture" ? "emma-a1:fixture" : `emma-a1:${model}`;
  }

  async callApi(prompt, context) {
    const vars = context?.vars ?? {};
    const scenario = getScenario(String(vars.scenario ?? "daily_standup"));
    if (!scenario) return { error: `escenario desconocido: ${vars.scenario}` };
    const cfg = config();
    const llm = llmFor(cfg, vars);
    const system = buildSimulationPrompt({
      scenario,
      settings: DEFAULT_CHAT_SETTINGS,
      profile: learnerProfile(),
      level: LEVEL,
    });
    const history = Array.isArray(vars.history) ? vars.history : [];
    // Sin historial el turno es la apertura: el aprendiz no habla, la escena arranca.
    const userMessage = history.length === 0 && !prompt.trim() ? kickoffCue(LEARNER.name) : prompt;
    try {
      const output = await runChatTurn({ llm, system, history, userMessage });
      return { output, metadata: { a1: checkA1Reply(output) } };
    } catch (err) {
      return { error: String(err?.message ?? err) };
    }
  }
}

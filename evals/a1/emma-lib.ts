/**
 * Superficie del código de EMMA que usan los evals de promptfoo. Se empaqueta
 * con Vite (`vite.config.mjs`) a `.build/emma-lib.mjs` para que el provider y
 * las aserciones (JS plano) ejecuten el prompt y el caso de uso REALES, sin
 * copiar reglas al eval.
 */

export { runChatTurn } from "@/application/chat/run-chat-turn-use-case";
export { buildSimulationPrompt } from "@/domain/chat/simulation-prompt";
export { kickoffCue } from "@/domain/chat/simulation-prompt-text";
export { getScenario } from "@/domain/scenarios/scenario-catalog";
export { DEFAULT_CHAT_SETTINGS } from "@/domain/chat-settings/chat-settings";
export { emptyProfile } from "@/domain/profile/user-profile";
export { checkA1Reply } from "@/domain/cefr/a1-reply-check";

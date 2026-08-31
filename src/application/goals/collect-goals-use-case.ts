/** CollectGoalsUseCase — recolecta, valida y persiste las metas de aprendizaje. */

import { GOAL_CATALOG, validateGoals } from "@/domain/goals/goal-catalog";
import { GoalContextBuilder, type GoalContext } from "@/domain/goals/goal-context";
import type { IGoalRepository } from "@/domain/goals/i-goal-repository";
import { createUserGoal, type UserGoal } from "@/domain/goals/user-goal";

// Puertos de I/O inyectados: preguntan al usuario y envían mensajes (Chainlit-like).
export type AskUserFunc = (args: { content: string }) => Promise<{ output: string }>;
export type MessageFunc = (args: { content: string }) => { send: () => Promise<void> };

/** String numerado listando todas las metas del catálogo. */
function numberedCatalog(): string {
  return Object.keys(GOAL_CATALOG)
    .map((name, i) => `${i + 1}. ${name}`)
    .join("\n");
}

/** Convierte números o nombres separados por coma en una lista de tokens crudos. */
function parseSelection(raw: string): string[] {
  const catalogKeys = Object.keys(GOAL_CATALOG);
  const tokens: string[] = [];
  for (const rawPart of raw.split(",")) {
    const part = rawPart.trim();
    if (/^\d+$/.test(part)) {
      const idx = parseInt(part, 10) - 1;
      if (idx >= 0 && idx < catalogKeys.length) tokens.push(catalogKeys[idx]);
    } else if (part) {
      tokens.push(part);
    }
  }
  return tokens;
}

/** Timestamp ISO-8601 UTC sin milisegundos ni sufijo, como strftime del original. */
function nowIso(): string {
  return new Date().toISOString().slice(0, 19);
}

/** Pide, valida, persiste y confirma las metas de aprendizaje del usuario. */
export class CollectGoalsUseCase {
  private readonly builder: GoalContextBuilder;

  constructor(
    private readonly repo: IGoalRepository,
    contextBuilder?: GoalContextBuilder,
  ) {
    this.builder = contextBuilder ?? new GoalContextBuilder();
  }

  async execute(
    userId: number,
    askUserFunc: AskUserFunc,
    messageFunc: MessageFunc,
  ): Promise<GoalContext> {
    const existing = this.repo.getGoals(userId);
    const response = await askUserFunc({ content: this.buildPrompt(existing) });
    const rawInput = response.output.trim();
    if (!rawInput && existing.length > 0) {
      return this.builder.build(userId, existing);
    }
    const goals = await this.collectValidGoals(userId, rawInput, askUserFunc);
    this.repo.replaceGoals(userId, goals);
    await CollectGoalsUseCase.sendConfirmation(goals, messageFunc);
    return this.builder.build(userId, goals);
  }

  private static async sendConfirmation(
    goals: UserGoal[],
    messageFunc: MessageFunc,
  ): Promise<void> {
    const body =
      "Got it! Your learning goals are:\n" + goals.map((g) => `• ${g.goalName}`).join("\n");
    await messageFunc({ content: body }).send();
  }

  /** Re-pregunta hasta que se dé al menos una meta válida. */
  private async collectValidGoals(
    userId: number,
    initialRaw: string,
    askUserFunc: AskUserFunc,
  ): Promise<UserGoal[]> {
    let raw = initialRaw;
    for (;;) {
      const tokens = parseSelection(raw);
      const [valid] = validateGoals(tokens);
      if (valid.length > 0) return this.makeGoals(userId, valid);
      const hint =
        `None of those matched the catalog. Please choose from:\n${numberedCatalog()}\n` +
        "Enter numbers or names (comma-separated):";
      const response = await askUserFunc({ content: hint });
      raw = response.output.trim();
    }
  }

  /** Construye instancias UserGoal para los nombres canónicos dados. */
  private makeGoals(userId: number, validNames: string[]): UserGoal[] {
    const now = nowIso();
    return validNames.map((name) =>
      createUserGoal(userId, name, GOAL_CATALOG[name], now),
    );
  }

  /** Construye el prompt inicial, pre-cargando las metas existentes si las hay. */
  private buildPrompt(existing: UserGoal[]): string {
    const catalogStr = numberedCatalog();
    if (existing.length > 0) {
      const current = existing.map((g) => g.goalName).join(", ");
      return (
        `Your current goals: ${current}. ` +
        `Enter a new selection or press Enter to keep.\n${catalogStr}\n` +
        "Choose by number or name (comma-separated):"
      );
    }
    return (
      `Please select your learning goals:\n${catalogStr}\n` +
      "Choose by number or name (comma-separated):"
    );
  }
}

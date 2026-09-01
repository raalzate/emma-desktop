/**
 * Fachada de runtime de EMMA (raíz de composición). Inyecta el puerto LlmGenerate
 * (Gemma local / nube) y los repositorios en los casos de uso, y expone métodos de
 * alto nivel para la UI. La UI no conoce motores ni almacenamiento: sólo esta API.
 */

import type { LlmGenerate } from "@/domain/ai/llm-port";
import type { PersonaTuning } from "@/domain/personas/persona-tuning";
import type { CefrLevel } from "@/domain/cefr/cefr-ladder";
import type { ChatSettings } from "@/domain/chat-settings/chat-settings";
import type { UserProfile } from "@/domain/profile/user-profile";
import type { Scenario } from "@/domain/scenarios/scenario";
import type { SituationVariant } from "@/domain/situations/situation-variant";
import type { SessionMetric } from "@/domain/progression/session-metric";
import { isActionableCorrection, type SilentError } from "@/domain/chat/silent-error";
import type { ChatTurn } from "@/domain/chat/simulation-session";
import { buildSimulationPrompt } from "@/domain/chat/simulation-prompt";
import { buildLanguageFocus, buildTutorAwareness } from "@/domain/chat/language-focus";
import { unitForSession } from "@/domain/curriculum/unit-catalog";
import {
  getTutorContext,
  type GetTutorContextResult,
} from "@/application/tutor/get-tutor-context-use-case";
import type { PracticeRecommendation } from "@/domain/tutor/practice-recommender";
import { isCefrLevel } from "@/domain/cefr/cefr-ladder";
import { runChatTurn } from "@/application/chat/run-chat-turn-use-case";
import { runKickoff } from "@/application/chat/simulation-kickoff-use-case";
import { teach, type TeachArgs } from "@/application/english-teacher/teach-use-case";
import { suggestReplies } from "@/application/coaching/suggest-replies-use-case";
import { completePartialReply } from "@/application/coaching/complete-partial-reply-use-case";
import { translate } from "@/application/translation/translate-use-case";
import { buildWelcome } from "@/application/welcome/welcome-use-case";
import { checkGrammar } from "@/application/grammar/check-grammar-use-case";
import { EvaluateProgressionUseCase } from "@/application/progression/evaluate-progression-use-case";
import { RecordSessionErrorsUseCase } from "@/application/progression/record-session-errors-use-case";
import { BuildPathwayUseCase } from "@/application/pathway/build-pathway-use-case";
import { BuildRoadmapUseCase } from "@/application/pathway/build-roadmap-use-case";
import { MarkScenarioPassedUseCase } from "@/application/pathway/mark-scenario-passed-use-case";
import { RecommendNextScenarioUseCase } from "@/application/pathway/recommend-next-scenario-use-case";
import { buildLesson } from "@/application/feedback/build-lesson-use-case";
import { composeSessionSummary } from "@/domain/feedback/session-summary";
import { captureSessionErrors } from "@/application/srs/capture-session-errors-use-case";
import { trackSessionMetrics, getMetricsTrend } from "@/application/metrics/track-session-metrics-use-case";
import { createSessionMetricsRepository } from "@/infrastructure/persistence/session-metrics-repository";
import {
  createSceneContract,
  type SceneContract,
} from "@/application/scene/create-scene-contract-use-case";
import { OnboardingStateEngine } from "@/application/onboarding/onboarding-state-engine-use-case";
import { runAgenticOnboarding } from "@/application/onboarding/agentic-onboarding-use-case";
import type { OnboardingIo } from "@/domain/onboarding/i-onboarding-repository";
import { createLlmGenerate } from "@/lib/ai/llm-adapter";
import { createRepositories, USER_ID, type Repositories } from "./di/repositories";

export interface EmmaRuntime {
  llm: LlmGenerate;
  repos: Repositories;
  buildSystemPrompt(a: {
    scenario: Scenario;
    situation?: SituationVariant | null;
    settings: ChatSettings;
    profile: UserProfile;
    level: CefrLevel;
    goals?: string[];
    personaTuning?: PersonaTuning;
    sceneFacts?: string;
    /** Categorías de error débiles del aprendiz (ver tutorContext): activa TUTOR AWARENESS. */
    weakErrorCategories?: string[];
  }): string;
  chatTurn(a: { system: string; history: ChatTurn[]; userMessage: string; sessionId?: string; characterAnchor?: string; sceneCue?: string; validateReply?: (reply: string) => boolean; onToken?: (c: string) => void }): Promise<string>;
  kickoff(system: string, sessionId?: string, learnerName?: string): Promise<string>;
  /**
   * Contrato de escena: hechos fijos EN (guardrail del system) + narrativa ES
   * para la antesala. Prerequisito del kickoff: el botón de comenzar lo espera.
   */
  sceneContract(a: { scenario: Scenario; situation: SituationVariant; techStack?: string }): Promise<SceneContract>;
  teach(a: Omit<TeachArgs, "llm">): ReturnType<typeof teach>;
  suggest(
    context: string,
    level: CefrLevel,
    draft?: string,
    scenarioType?: string,
    /** Última línea del agente para el filtro anti-eco (ver suggestReplies). */
    agentLine?: string,
  ): ReturnType<typeof suggestReplies>;
  complete(context: string, partial: string): Promise<string>;
  translate(text: string, targetLang: string): ReturnType<typeof translate>;
  welcome(profile: UserProfile): Promise<string>;
  checkGrammar(text: string, turn: number): Promise<SilentError[]>;
  finishSession(a: {
    scenario: Scenario;
    metric: SessionMetric;
    errors: SilentError[];
    level: CefrLevel;
    situation?: SituationVariant | null;
    situationTitle?: string;
    /**
     * Historial de la sesión, para calcular las métricas de progreso (0.6 del
     * libro). Obligatorio a propósito: si fuera opcional, un caller que lo
     * olvidara registraría métricas en cero sin que nada avisara.
     */
    messages: ChatTurn[];
  }): Promise<{ report: string; lesson: string | null; recommendations: PracticeRecommendation[] }>;
  evaluateProgression(level: string, metric: SessionMetric): ReturnType<EvaluateProgressionUseCase["execute"]>;
  /** Últimas métricas de progreso de sesión (latencia, monólogo, densidad de error) y su promedio. */
  metricsTrend(last?: number): ReturnType<typeof getMetricsTrend>;
  roadmap(level: string): ReturnType<BuildRoadmapUseCase["execute"]>;
  pathway(level: string): ReturnType<BuildPathwayUseCase["execute"]>;
  markPassed(level: string, scenarioType: string): ReturnType<MarkScenarioPassedUseCase["execute"]>;
  recommendNext(level: string): ReturnType<RecommendNextScenarioUseCase["execute"]>;
  /**
   * Estado consolidado del aprendiz (semana, unidad, SRS, errores débiles,
   * recomendaciones) + briefing en español. `scenarioType` ancla la unidad
   * activa si no hay una explícita. EMMA lo usa para redirigir en bienvenida,
   * inmersión y feedback.
   */
  tutorContext(scenarioType?: string): Promise<GetTutorContextResult>;
  onboardingEngine(): OnboardingStateEngine;
  runOnboarding(io: OnboardingIo): ReturnType<OnboardingStateEngine["run"]>;
  /** Onboarding inteligente ReAct: la IA conversa hasta capturar el contexto. */
  runAgenticOnboarding(
    io: OnboardingIo,
    onProgress?: (captured: number, total: number) => void,
  ): ReturnType<typeof runAgenticOnboarding>;
}

/** Construye el runtime (hidrata repos). Llamar una vez por sesión de UI. */
export async function createEmmaRuntime(): Promise<EmmaRuntime> {
  const llm = createLlmGenerate();
  const repos = await createRepositories();

  const evaluate = new EvaluateProgressionUseCase(repos.progression);
  const record = new RecordSessionErrorsUseCase(repos.errorStats);
  const buildPathway = new BuildPathwayUseCase(repos.pathway);
  const roadmap = new BuildRoadmapUseCase(buildPathway);
  const markPassed = new MarkScenarioPassedUseCase(repos.pathway);
  const recommend = new RecommendNextScenarioUseCase(repos.pathway, repos.goals, repos.errorStats);
  const sessionMetricsRepo = createSessionMetricsRepository();

  const MS_PER_DAY = 86_400_000;
  const todayAsDays = () => Math.floor(Date.now() / MS_PER_DAY);

  // Nivel del perfil, o "A1" si aún no existe (mismo respaldo que emptyProfile).
  async function resolveTutorContext(scenarioType?: string): Promise<GetTutorContextResult> {
    const profile = await repos.profile.getStatus();
    const level = profile && isCefrLevel(profile.englishLevel) ? profile.englishLevel : "A1";
    return getTutorContext({
      srsRepo: repos.srs,
      selfAssessmentRepo: repos.selfAssessment,
      errorStatsRepo: repos.errorStats,
      level,
      today: todayAsDays(),
      userId: USER_ID,
      activeScenarioType: scenarioType,
    });
  }

  return {
    llm,
    repos,
    buildSystemPrompt: (a) => {
      // La unidad del libro que corresponde a este escenario+nivel ancla la
      // sesión: sus chunks son objetivos, sus trampas la vigilancia silenciosa.
      const unit = unitForSession(a.scenario.scenarioType, a.level);
      const languageFocus = unit ? buildLanguageFocus(unit) : undefined;
      const system = buildSimulationPrompt({ ...a, languageFocus });
      // Consciencia de tutor: sugerida por el llamador (weakErrorCategories),
      // tolerante a que venga vacía o ausente.
      const awareness = buildTutorAwareness(a.weakErrorCategories ?? []);
      return awareness ? `${system}\n\n${awareness}` : system;
    },
    chatTurn: (a) => runChatTurn({ llm, ...a }),
    kickoff: (system, sessionId, learnerName) =>
      runKickoff({ llm, system, sessionId, learnerName }),
    sceneContract: (a) => createSceneContract({ llm, ...a }),
    teach: (a) => teach({ llm, ...a }),
    suggest: (context, level, draft, scenarioType, agentLine) =>
      suggestReplies({ llm, context, level, draft, scenarioType, agentLine }),
    complete: (context, partial) => completePartialReply({ llm, context, partial }),
    translate: (text, targetLang) => translate({ llm, text, targetLang }),
    async welcome(profile) {
      // El briefing del plan es andamiaje opcional: si falla, el saludo sigue sin él.
      const tutorBriefingEs = await resolveTutorContext()
        .then((r) => r.briefingEs)
        .catch(() => undefined);
      return buildWelcome({ llm, profile, tutorBriefingEs });
    },
    checkGrammar: (text, turn) => checkGrammar({ llm, text, turn }),
    async finishSession(a) {
      await record.execute(USER_ID, a.errors);
      // Solo errores accionables (defensa: el búfer ya filtra en la fuente).
      const errors = a.errors.filter(isActionableCorrection);
      // La lección REAL de Emma (LLM, en inglés hablado con audio en la UI);
      // null ⇒ el resumen usa el respaldo determinista.
      const lesson = await buildLesson({
        llm,
        errors,
        level: a.level,
        scenarioType: a.scenario.scenarioType,
      });
      const report = composeSessionSummary({
        scenarioTitle: a.scenario.title,
        situationTitle: a.situationTitle ?? a.situation?.title,
        level: a.level,
        turns: a.metric.turns,
        errors,
        lesson,
      });
      // Tarjetas SRS a partir de los errores de la sesión; un fallo del repo
      // (disco, IPC) no debe impedir el cierre de la sesión.
      try {
        const today = todayAsDays();
        await captureSessionErrors({
          repo: repos.srs,
          errors,
          today,
          idPrefix: `session-${Date.now()}`,
        });
      } catch (err) {
        console.error("No se pudieron guardar las tarjetas SRS de la sesión", err);
      }
      // Métricas de progreso de la sesión (0.6 del libro: latencia, monólogo,
      // densidad de error); un fallo del repo no debe impedir cerrar la sesión.
      try {
        await trackSessionMetrics({
          repo: sessionMetricsRepo,
          messages: a.messages,
          errors,
          at: Date.now(),
        });
      } catch (err) {
        console.error("No se pudieron guardar las métricas de progreso de la sesión", err);
      }
      // Recomendaciones de práctica ("próximos pasos"), con el escenario recién
      // jugado como unidad activa; un fallo no debe impedir cerrar la sesión.
      const recommendations: PracticeRecommendation[] = await resolveTutorContext(
        a.scenario.scenarioType,
      )
        .then((r) => r.context.recommendations)
        .catch(() => []);
      return { report, lesson, recommendations };
    },
    evaluateProgression: (level, metric) => evaluate.execute(USER_ID, level, metric),
    metricsTrend: (last = 5) => getMetricsTrend({ repo: sessionMetricsRepo, last }),
    tutorContext: (scenarioType) => resolveTutorContext(scenarioType),
    roadmap: (level) => roadmap.execute(USER_ID, level),
    pathway: (level) => buildPathway.execute(USER_ID, level),
    markPassed: (level, scenarioType) => markPassed.execute(USER_ID, level, scenarioType),
    recommendNext: async (level) => {
      // La semana actual del plan da prioridad a sus escenarios; si falla, se
      // recomienda sin ese boost (retrocompatible).
      const currentWeek = await resolveTutorContext()
        .then((r) => r.context.currentWeek)
        .catch(() => undefined);
      return recommend.execute(USER_ID, level, currentWeek);
    },
    onboardingEngine: () => new OnboardingStateEngine({ repo: repos.profile, llm }),
    runOnboarding: (io) => new OnboardingStateEngine({ repo: repos.profile, llm }).run(io),
    runAgenticOnboarding: (io, onProgress) =>
      runAgenticOnboarding({ llm, io, repo: repos.profile, onProgress }),
  };
}

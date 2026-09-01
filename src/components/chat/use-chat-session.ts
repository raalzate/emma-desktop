"use client";

/**
 * Orquesta una sesión de simulación con Emma para UN escenario dado (lo elige el
 * padre). Si recibe `restore` con mensajes, reanuda esa conversación sin kickoff;
 * si no, abre con `kickoff`. Turno estricto (Emma habla → usuario responde). Los
 * errores gramaticales se chequean en SILENCIO y sólo se muestran al terminar.
 * `onSnapshot` emite el estado tras cada cambio para que el padre lo persista.
 */

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import type { EmmaRuntime } from "@/interface/emma-runtime";
import type { UserProfile } from "@/domain/profile/user-profile";
import type { ChatSettings } from "@/domain/chat-settings/chat-settings";
import { loadPersonaTuning } from "@/infrastructure/persistence/persona-tuning-repository";
import { selectSituation } from "@/domain/situations/situation-selector";
import type { Scenario } from "@/domain/scenarios/scenario";
import type { SituationVariant } from "@/domain/situations/situation-variant";
import { maxTurnsFor, turnsToGradeFor } from "@/domain/chat/simulation-session";
import { personaAnchor } from "@/domain/chat/simulation-prompt";
import {
  advanceScene,
  coverItem,
  createSceneState,
  deepeningTarget,
  isReaskingCovered,
  isSceneComplete,
  sceneProgress,
  type SceneState,
} from "@/domain/chat/scene-state";
import { resolveSceneClose, shouldWrapUp } from "@/domain/chat/scene-closing";
import { buildRecastCue } from "@/domain/chat/recast";
import { buildTurnDirective } from "@/domain/chat/turn-directive";
import { buildSuggestionContext } from "@/domain/coaching/suggestion-context";
import { personaFor } from "@/domain/personas/protopersona";
import type { ChatTurn, SilentError } from "@/domain/chat/simulation-session";
import { isActionableCorrection } from "@/domain/chat/silent-error";
import type { ChatConversation } from "@/domain/chat/chat-conversation";
import { readStoredLesson } from "@/domain/chat/chat-conversation";
import type { SessionLesson } from "@/domain/feedback/session-lesson";

export interface SessionSnapshot {
  scenarioType: string;
  situationTitle?: string;
  level: string;
  messages: ChatTurn[];
  turnCount: number;
  /** La escena se completó (persiste para bloquear la sesión al reabrirla). */
  completed: boolean;
  /** Lección de cierre ya entregada: viaja al histórico para no regenerarla. */
  lesson?: SessionLesson;
}

interface Deps {
  runtime: EmmaRuntime;
  profile: UserProfile;
  settings: ChatSettings;
  scenario: Scenario;
  restore?: ChatConversation | null;
  onSnapshot?: (s: SessionSnapshot) => void;
}

import type { SceneContract } from "@/application/scene/create-scene-contract-use-case";

// Abre el escenario con la MISMA situación mostrada en la antesala (nunca se
// re-selecciona: el contrato y lo que el usuario leyó deben coincidir), aplica
// el tuning de la protopersona, construye el prompt (hechos del contrato como
// guardrail) y pide el turno de apertura.
// Categorías de error débiles del aprendiz (tutorContext): tolerante a fallo —
// nunca bloquea la escena si el repo/IO falla.
async function weakCategoriesFor(rt: EmmaRuntime, scenarioType: string): Promise<string[]> {
  return rt
    .tutorContext(scenarioType)
    .then((r) => r.context.weakErrorCategories)
    .catch(() => []);
}

async function openScenario(
  rt: EmmaRuntime,
  d: Deps,
  scenario: Scenario,
  sessionId: string,
  situation: SituationVariant | null,
  sceneFacts?: string,
) {
  const level = d.profile.englishLevel;
  const personaTuning = await loadPersonaTuning(scenario.scenarioType).catch(() => undefined);
  const weakErrorCategories = await weakCategoriesFor(rt, scenario.scenarioType);
  const system = rt.buildSystemPrompt({
    scenario, situation, settings: d.settings, profile: d.profile, level, personaTuning, sceneFacts,
    weakErrorCategories,
  });
  const opening = await rt.kickoff(system, sessionId, d.profile.name);
  return { system, opening };
}

// Rotación de situaciones (BUG-001): el selector es determinista (primera
// compatible) y siempre salía la misma variante. Se recuerdan las últimas
// jugadas por escenario para excluirlas y VARIAR el caso.
const RECENT_SITUATIONS_KEY = (scenarioType: string) => `emma_recent_situations_${scenarioType}`;
const RECENT_SITUATIONS_MAX = 3;

function recentSituations(scenarioType: string): string[] {
  try {
    return JSON.parse(localStorage.getItem(RECENT_SITUATIONS_KEY(scenarioType)) ?? "[]");
  } catch {
    return [];
  }
}

function rememberSituation(scenarioType: string, id: string): void {
  try {
    const ring = [id, ...recentSituations(scenarioType).filter((x) => x !== id)];
    localStorage.setItem(
      RECENT_SITUATIONS_KEY(scenarioType),
      JSON.stringify(ring.slice(0, RECENT_SITUATIONS_MAX)),
    );
  } catch {
    /* almacenamiento no disponible: sin rotación */
  }
}

export function useChatSession(d: Deps) {
  const { runtime, profile, scenario, restore } = d;
  const level = profile.englishLevel;
  const [situation, setSituation] = useState<SituationVariant | null>(null);
  const [messages, setMessages] = useState<ChatTurn[]>([]);
  const [streaming, setStreaming] = useState("");
  const [busy, setBusy] = useState(false);
  const [turnCount, setTurnCount] = useState(restore?.turnCount ?? 0);
  const [errors, setErrors] = useState<SilentError[]>([]);
  // "intro" = presentar la escena antes del kickoff; "live" = conversación activa.
  // Un chat nuevo NUNCA arranca solo: el usuario lee la escena y pulsa comenzar.
  const [phase, setPhase] = useState<"intro" | "live">(restore?.messages?.length ? "live" : "intro");
  const system = useRef("");
  // Identidad de la conversación viva en el motor local (memoria por KV-cache).
  const llmSessionId = useRef(`llm-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`);
  // Estado agéntico de la escena (checklist Observe→Decide→Verify); al
  // reanudar se reconstruye reproduciendo los mensajes del aprendiz.
  const sceneState = useRef<SceneState | null>(null);
  // Contrato de escena: PREREQUISITO del kickoff (hechos EN + narrativa ES).
  const [contract, setContract] = useState<SceneContract | null>(null);
  // El agente decidió terminar: checklist completo + cierre entregado, o
  // presupuesto de turnos agotado. Dispara el feedback de Emma automáticamente.
  const [sceneComplete, setSceneComplete] = useState(false);
  // Turnos extra concedidos porque la persona dejó una pregunta sin responder.
  const graceTurns = useRef(0);
  // Cuánto se espera al corrector para poder hacer recast en el mismo turno;
  // pasado el presupuesto la escena sigue sin él (nunca bloquea la respuesta).
  const RECAST_BUDGET_MS = 1200;
  // Ítem para el que ya se pidió un detalle (no se insiste dos veces).
  const elaborationAskedFor = useRef<string | null>(null);
  // Objetivos cubiertos de la escena, para que la UI muestre el avance.
  const [sceneGoals, setSceneGoals] = useState<{ done: number; total: number } | null>(null);
  // Lección de cierre ya entregada (guardada con la conversación). Al reabrir
  // una sesión terminada se revisa esta, no una generación nueva.
  const [lesson, setLesson] = useState<SessionLesson | null>(() => readStoredLesson(restore));

  // Monta la sesión: reanuda `restore` (sin kickoff) o prepara la escena nueva.
  useEffect(() => {
    if (restore?.messages?.length) {
      // Reanudar: rehidrata el system prompt en silencio y restaura los mensajes.
      const situationR = selectSituation({
        scenarioType: scenario.scenarioType,
        level,
        stack: profile.techStack,
      });
      setSituation(situationR);
      system.current = runtime.buildSystemPrompt({
        scenario, situation: situationR, settings: d.settings, profile, level,
      });
      // El tuning y las categorías débiles llegan async: re-construyen el
      // prompt en cuanto están disponibles.
      void Promise.all([
        loadPersonaTuning(scenario.scenarioType).catch(() => undefined),
        weakCategoriesFor(runtime, scenario.scenarioType),
      ])
        .then(([personaTuning, weakErrorCategories]) => {
          system.current = runtime.buildSystemPrompt({
            scenario, situation: situationR, settings: d.settings, profile, level, personaTuning,
            weakErrorCategories,
          });
        })
        .catch(() => {});
      setMessages(restore.messages);
      setTurnCount(restore.turnCount);
      if (restore.completed) setSceneComplete(true);
      let replayed = createSceneState(scenario.scenarioType);
      if (replayed) {
        // La pregunta que ancla cada respuesta es la línea previa de la persona.
        let pregunta = "";
        for (const m of restore.messages) {
          if (m.role === "assistant") pregunta = m.content;
          else replayed = advanceScene(replayed!, m.content, { lastAgentLine: pregunta });
        }
      }
      sceneState.current = replayed;
      setSceneGoals(sceneProgress(replayed));
      // Reanudación: el contrato determinista es el framing (sin esperar LLM).
      setContract({ facts: situationR?.framingDescription ?? "", narrative: null });
      return;
    }
    sceneState.current = createSceneState(scenario.scenarioType);
    setSceneGoals(sceneProgress(sceneState.current));
    // Escena nueva: se selecciona la situación y se genera el CONTRATO de
    // escena antes del kickoff (hechos EN como guardrail + narrativa ES para
    // la antesala). Con timeout: si el LLM se cuelga, el framing es el
    // contrato determinista y el botón nunca queda bloqueado.
    setMessages([]);
    setErrors([]);
    setTurnCount(0);
    // Variar el caso: excluye las últimas situaciones jugadas de este
    // escenario; si el pool queda vacío, reintenta sin exclusión.
    const sit =
      selectSituation({
        scenarioType: scenario.scenarioType,
        level,
        stack: profile.techStack,
        exclude: recentSituations(scenario.scenarioType),
      }) ??
      selectSituation({
        scenarioType: scenario.scenarioType,
        level,
        stack: profile.techStack,
      });
    setSituation(sit);
    if (sit) rememberSituation(scenario.scenarioType, sit.id);
    if (!sit) {
      setContract({ facts: "", narrative: null });
      return;
    }
    let alive = true;
    const fallback: SceneContract = { facts: sit.framingDescription, narrative: null };
    const timeout = new Promise<SceneContract>((resolve) => {
      setTimeout(() => resolve(fallback), 25_000);
    });
    void Promise.race([
      runtime.sceneContract({ scenario, situation: sit, techStack: profile.techStack }),
      timeout,
    ])
      .then((c) => {
        if (alive) setContract(c);
      })
      .catch(() => {
        if (alive) setContract(fallback);
      });
    return () => {
      alive = false;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // El usuario leyó la escena y quiere entrar: ahora sí, kickoff de Emma.
  // El contrato de escena es PREREQUISITO: sus hechos se inyectan al system.
  const begin = useCallback(async () => {
    if (phase === "live" || busy || !contract) return;
    setPhase("live");
    setBusy(true);
    const r = await openScenario(
      runtime, d, scenario, llmSessionId.current, situation, contract.facts || undefined,
    );
    system.current = r.system;
    setMessages([{ role: "assistant", content: r.opening, at: Date.now() }]);
    setBusy(false);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [phase, busy, runtime, scenario, contract, situation]);

  // Chequeo gramatical en silencio: buffer only, jamás interrumpe el chat.
  // Solo entran correcciones REALES (el checker a veces responde meta-notas).
  // Devuelve las correcciones para que el turno pueda hacer recast en caliente.
  const bufferGrammar = useCallback(
    (text: string, turn: number): Promise<SilentError[]> =>
      runtime
        .checkGrammar(text, turn)
        .then((errs) => {
          const actionable = errs.filter(isActionableCorrection);
          setErrors((prev) => [...prev, ...actionable]);
          return actionable;
        })
        .catch(() => []),
    [runtime],
  );

  // Envía un turno del aprendiz (texto o nota de voz). `audioUrl` adjunta el
  // audio grabado (WhatsApp): la IA procesa la transcripción `text`.
  const send = useCallback(
    async (text: string, audioUrl?: string) => {
      const clean = text.trim();
      if (!clean || busy || sceneComplete) return;
      const prior = messages;
      const turn = turnCount + 1;
      setMessages([...prior, { role: "user", content: clean, at: Date.now(), audioUrl }]);
      setTurnCount(turn);
      setBusy(true);
      const lastAgentLine =
        [...prior].reverse().find((m) => m.role === "assistant")?.content ?? "";
      // Observe — el JUEZ del turno: una clasificación corta del LLM etiqueta el
      // mensaje (qué tema contesta, si es negación, si es meta, cuánta sustancia
      // trae) y el código decide con eso. Los jueces regex quedaron como red
      // dentro del caso de uso: entender inglés con listas de palabras fue la
      // causa raíz de cuatro incidentes seguidos («No, I am fine today.» se
      // perdía por no tener la palabra exacta en la lista).
      // El juez corre ANTES de encolar el chequeo gramatical: el motor local
      // procesa UNA generación a la vez, y con la gramática (360 tokens) por
      // delante el juez vencía su tope de 4s y caía a la red en todos los
      // turnos — la arquitectura instalada sin correr nunca, y en silencio.
      const observation = await runtime.observeTurn({
        state: sceneState.current,
        lastAgentLine,
        message: clean,
        level,
      });
      if (observation.source === "heuristics" && process.env.NODE_ENV !== "production") {
        // Visible en la consola de dev: si esto aparece en cada turno, el juez
        // no está corriendo y hay que mirar la cola del motor.
        console.warn("[escena] turno etiquetado por la red determinista", observation);
      }
      const grammarCheck = bufferGrammar(clean, turn);
      const intent = observation.intent;
      const contributes = intent === "in-scene";
      // Elaboración: sólo sobre una respuesta que contesta con POCO (juicio del
      // modelo, no conteo de palabras), nunca sobre una negación, una vez por
      // ítem. Y siempre DESPUÉS de registrar: pedir detalle no borra lo dicho.
      const answered = observation.answersItem ?? "free";
      const askElaboration =
        contributes &&
        observation.substance === "thin" &&
        !observation.negative &&
        elaborationAskedFor.current !== answered;
      if (askElaboration) elaborationAskedFor.current = answered;
      if (sceneState.current && contributes && observation.answersItem) {
        sceneState.current = coverItem(sceneState.current, observation.answersItem, clean, {
          negative: observation.negative,
        });
        setSceneGoals(sceneProgress(sceneState.current));
      }
      // Si el checklist quedó completo, la respuesta que viene es el CIERRE de
      // la persona (la directiva ordena resumir y despedirse).
      const closingTurn = isSceneComplete(sceneState.current);
      // Al borde del presupuesto se pide cierre en personaje: así la escena
      // termina por decisión narrativa y no dejando una pregunta sin respuesta.
      const maxTurns = maxTurnsFor(scenario.scenarioType);
      // Checklist cubierto demasiado pronto: profundizar en vez de cerrar, o la
      // sesión termina sin los turnos que exige la nota de progresión.
      // Turnos que ESTA escena necesita para calificarse: con el presupuesto ya
      // derivado del guion, cubrir el checklist casi siempre alcanza y `deepen`
      // deja de ser la vía normal (era donde se improvisaban los turnos vacíos).
      const minTurns = turnsToGradeFor(scenario.scenarioType);
      const deepen = closingTurn && turn < minTurns && turn < maxTurns;
      // Recast en caliente: si el chequeo gramatical llega a tiempo, la persona
      // devuelve la forma correcta en su propia línea (feedback inmediato).
      const fresh = await Promise.race([
        grammarCheck,
        new Promise<SilentError[]>((r) => setTimeout(() => r([]), RECAST_BUDGET_MS)),
      ]);
      // UNA sola orden de contenido por turno (ver domain/chat/turn-directive):
      // apilarlas producía instrucciones contradictorias y respuestas vacías.
      const directive = buildTurnDirective({
        state: sceneState.current,
        intent,
        elaborate: askElaboration,
        deepen,
        wrapUp: shouldWrapUp(turn, maxTurns) && !deepen,
        recastCue: buildRecastCue(fresh),
      });
      const reply = await runtime.chatTurn({
        system: system.current,
        history: prior,
        userMessage: clean,
        sessionId: llmSessionId.current,
        characterAnchor: personaAnchor(scenario),
        // Decide: directiva exacta (qué ya se sabe / qué preguntar ahora / cerrar).
        sceneCue: directive || undefined,
        // Verify: veta re-preguntas de ítems ya cubiertos (dispara el reintento).
        // Recibe lo que Decide ordenó: al profundizar, la pregunta sobre ESE
        // ítem cubierto es la orden, no una re-pregunta. Sin este dato el veto
        // tumbaba las dos generaciones y la escena caía en la recuperación.
        validateReply: (r) =>
          !isReaskingCovered(r, sceneState.current, {
            deepeningOn: deepen ? deepeningTarget(sceneState.current)?.id : undefined,
          }),
        onToken: (c) => setStreaming((s) => s + c),
      });
      setMessages((m) => [...m, { role: "assistant", content: reply, at: Date.now() }]);
      setStreaming("");
      setBusy(false);
      // Decide terminar: cierre tras completar el checklist, o presupuesto
      // agotado — salvo que la persona haya dejado una pregunta abierta, que
      // gana turnos de gracia para no expulsar al aprendiz a media frase.
      const decision = resolveSceneClose({
        checklistComplete: closingTurn,
        turn,
        maxTurns,
        lastReply: reply,
        graceTurnsUsed: graceTurns.current,
        minTurns,
      });
      if (decision.grantGrace) graceTurns.current += 1;
      if (decision.close) setSceneComplete(true);
    },
    [busy, messages, turnCount, runtime, bufferGrammar, sceneComplete, scenario.scenarioType],
  );

  // Emite el snapshot al padre tras cada cambio con contenido (para persistir).
  useEffect(() => {
    if (!d.onSnapshot || messages.length === 0) return;
    d.onSnapshot({
      scenarioType: scenario.scenarioType,
      situationTitle: situation?.title,
      level,
      messages,
      turnCount,
      completed: sceneComplete,
      lesson: lesson ?? undefined,
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [messages, turnCount, sceneComplete, lesson]);

  // Guardar la lección cierra la sesión: se entregó el feedback, no se sigue
  // conversando. Así el banner y el bloqueo del composer valen también cuando
  // el aprendiz cerró a mano antes de completar el checklist.
  const saveLesson = useCallback((entregada: SessionLesson) => {
    setLesson(entregada);
    setSceneComplete(true);
  }, []);

  const maxTurns = maxTurnsFor(scenario.scenarioType);
  const lastEmma = useMemo(
    () => [...messages].reverse().find((m) => m.role === "assistant")?.content ?? "",
    [messages],
  );
  // Contexto de escena para las sugerencias del composer: con quién habla, en
  // qué situación, qué tema está pidiendo la persona y qué ya contó el
  // aprendiz. Con sólo `lastEmma` las 3 sugerencias salían genéricas.
  const suggestionContext = useMemo(() => {
    const persona = personaFor(scenario.scenarioType, scenario.emmaRole);
    return buildSuggestionContext({
      lastAgentLine: lastEmma,
      personaName: persona.name,
      personaRole: persona.role,
      situationTitle: situation?.title,
      saidSoFar: messages.filter((m) => m.role === "user").map((m) => m.content),
      pendingAsk: sceneState.current?.pending[0]?.ask,
    });
    // `sceneState` es una ref: el avance del checklist se refleja al cambiar
    // `messages`, que es lo que dispara este cálculo.
  }, [lastEmma, messages, situation?.title, scenario.scenarioType, scenario.emmaRole]);
  return {
    situation, level, phase, begin,
    // Contrato de escena: la antesala muestra la narrativa y el botón espera.
    narrative: contract?.narrative ?? null,
    sceneReady: contract !== null,
    // El agente decidió cerrar la escena (dispara el feedback automático).
    sceneComplete,
    // Sesión reabierta que YA terminó: solo lectura, sin re-disparar la lección.
    restoredComplete: !!restore?.completed,
    // Lección de cierre guardada (null hasta que Emma la entrega).
    lesson, saveLesson,
    // Objetivos de la escena cubiertos/total (null si el escenario es libre).
    sceneGoals,
    messages, streaming, busy, turnCount, maxTurns, errors, send, lastEmma, suggestionContext,
  };
}

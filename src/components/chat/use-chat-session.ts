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
import { detectTimeDrift } from "@/domain/chat/scene-fidelity";
import { learnerQuestionOf } from "@/domain/chat/learner-question";
import { readStoredScene } from "@/domain/chat/chat-conversation";
import { situationsFor } from "@/domain/situations/situations-catalog";
import type { SceneFacts } from "@/application/scene/create-scene-contract-use-case";
import { takePrefetchedScene } from "./scene-prefetch";
import { chooseSituation, rememberSituation } from "./situation-rotation";
import { requiresVoice } from "@/domain/chat/voice-requirement";
import { buildTurnDirective } from "@/domain/chat/turn-directive";
import { buildSuggestionContext } from "@/domain/coaching/suggestion-context";
import { personaFor } from "@/domain/personas/protopersona";
import type { ChatTurn, SilentError } from "@/domain/chat/simulation-session";
import { reportableCorrections } from "@/domain/chat/silent-error";
import type { ChatConversation } from "@/domain/chat/chat-conversation";
import { readStoredLesson } from "@/domain/chat/chat-conversation";
import type { SessionLesson } from "@/domain/feedback/session-lesson";
import { attachAudioId, clipsByTurn, saveVoiceTurn, type VoiceClip } from "./voice-turn";

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
  /** El aprendiz usó la salida de emergencia de los turnos hablados (#169). */
  voiceOptOut?: boolean;
  /** Hechos de escena y situación jugada: la reanudación vuelve al mismo caso (T15 de #323). */
  sceneFacts?: string;
  situationId?: string;
}

interface Deps {
  runtime: EmmaRuntime;
  profile: UserProfile;
  settings: ChatSettings;
  scenario: Scenario;
  /** Dueña de los clips de audio del aprendiz (borrado en cascada). */
  conversationId: string;
  /** Un clip se guardó con éxito (dispara el aviso de privacidad de una sola vez). */
  onClipSaved?: () => void;
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

/**
 * Hechos contra los que juzga el juez de escena: sólo los GENERADOS. El
 * framing es la meta del aprendiz en segunda persona («Lead the standup…») y
 * el juez, leído así, marcaba wrong-role toda línea de la persona. Si el
 * contrato cayó al framing (timeout o reanudación) se devuelve "" y el juez
 * queda fail-open.
 */
function judgeFacts(contract: SceneContract | null, situation: SituationVariant | null): string {
  const facts = contract?.facts?.trim() ?? "";
  if (!facts || facts === situation?.framingDescription?.trim()) return "";
  return facts;
}

export function useChatSession(d: Deps) {
  const { runtime, profile, scenario, restore } = d;
  const level = profile.englishLevel;
  const [situation, setSituation] = useState<SituationVariant | null>(null);
  const [messages, setMessages] = useState<ChatTurn[]>([]);
  const [streaming, setStreaming] = useState("");
  const [busy, setBusy] = useState(false);
  const [turnCount, setTurnCount] = useState(restore?.turnCount ?? 0);
  // Turnos hablados (#169): último turno con nota de voz, si la directiva del
  // turno siguiente pide desarrollar, y la salida de emergencia ya usada.
  const [lastVoiceTurn, setLastVoiceTurn] = useState<number | null>(null);
  const [expectsElaboration, setExpectsElaboration] = useState(false);
  const [voiceOptOut, setVoiceOptOut] = useState(restore?.voiceOptOut ?? false);
  const [errors, setErrors] = useState<SilentError[]>([]);
  // "intro" = presentar la escena antes del kickoff; "live" = conversación activa.
  // Un chat nuevo NUNCA arranca solo: el usuario lee la escena y pulsa comenzar.
  const [phase, setPhase] = useState<"intro" | "live">(restore?.messages?.length ? "live" : "intro");
  const system = useRef("");
  // Turno → clip guardado: el cierre lo usa para que el error de ese turno
  // lleve su audio al repaso (FR-011). Mutable y estable: se lee al cerrar.
  const clipOfTurn = useRef<Record<number, string>>(clipsByTurn(restore?.messages ?? []));
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
  // Correcciones del turno ANTERIOR, listas para el recast del siguiente (T9 de
  // #323): la gramática ya no corre ni se espera antes de la respuesta.
  const pendingRecast = useRef<SilentError[]>([]);
  // Ítem para el que ya se pidió un detalle (no se insiste dos veces).
  const elaborationAskedFor = useRef<string | null>(null);
  // H3/FR-004: si el turno anterior ya pidió aclaración ("unclear"), el
  // siguiente veredicto unclear se degrada a clear — no dos turnos seguidos.
  const previousWasClarifying = useRef(false);
  // Objetivos cubiertos de la escena, para que la UI muestre el avance.
  const [sceneGoals, setSceneGoals] = useState<{ done: number; total: number } | null>(null);
  // Lección de cierre ya entregada (guardada con la conversación). Al reabrir
  // una sesión terminada se revisa esta, no una generación nueva.
  const [lesson, setLesson] = useState<SessionLesson | null>(() => readStoredLesson(restore));

  // Monta la sesión: reanuda `restore` (sin kickoff) o prepara la escena nueva.
  useEffect(() => {
    if (restore?.messages?.length) {
      // Reanudar: rehidrata el system prompt en silencio y restaura los mensajes.
      // T15 de #323: el MISMO caso que se jugó (situación y hechos guardados);
      // antes se tomaba la primera situación compatible y su framing.
      const stored = readStoredScene(restore);
      const situationR =
        situationsFor(scenario.scenarioType).find((v) => v.id === stored.situationId) ??
        selectSituation({
          scenarioType: scenario.scenarioType,
          level,
          stack: profile.techStack,
        });
      setSituation(situationR);
      system.current = runtime.buildSystemPrompt({
        scenario, situation: situationR, settings: d.settings, profile, level,
        sceneFacts: stored.sceneFacts ?? undefined,
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
            weakErrorCategories, sceneFacts: stored.sceneFacts ?? undefined,
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
      // Reanudación: los hechos guardados; sin ellos, el framing (sin esperar LLM).
      setContract({ facts: stored.sceneFacts ?? situationR?.framingDescription ?? "", narrative: null });
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
    // T14 de #323: el mapa pudo precalcular la situación y sus hechos; si no,
    // se elige ahora (rotación compartida con el precálculo).
    const pre = takePrefetchedScene(scenario.scenarioType);
    const sit = pre?.situation ?? chooseSituation(scenario.scenarioType, level, profile.techStack);
    setSituation(sit);
    if (sit) rememberSituation(scenario.scenarioType, sit.id);
    if (!sit) {
      setContract({ facts: "", narrative: null });
      return;
    }
    let alive = true;
    const fallback: SceneFacts = { facts: sit.framingDescription, generated: false };
    const timeout = new Promise<SceneFacts>((resolve) => {
      setTimeout(() => resolve(fallback), 25_000);
    });
    const facts = (pre ? pre.facts : Promise.resolve(null)).then(
      (f) => f ?? runtime.sceneFacts({ scenario, situation: sit, techStack: profile.techStack }),
    );
    // El botón espera SÓLO los hechos; la narrativa llega después, en segundo
    // plano (el kickoff la interrumpe si el aprendiz ya empezó).
    void Promise.race([facts, timeout])
      .then((f) => {
        if (!alive) return;
        setContract({ facts: f.facts, narrative: null });
        if (!f.generated) return;
        void runtime
          .sceneNarrative({ scenario, situation: sit, techStack: profile.techStack, facts: f.facts })
          .then((narrative) => {
            if (alive && narrative) setContract((c) => (c ? { ...c, narrative } : c));
          })
          .catch(() => {});
      })
      .catch(() => {
        if (alive) setContract({ facts: fallback.facts, narrative: null });
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
  // Este es EL borde donde se decide qué cuenta como error de la sesión: reales
  // (el checker a veces responde meta-notas) y enseñables (una mayúscula o un
  // punto final no son lección, #170).
  // Devuelve las correcciones para que el turno pueda hacer recast en caliente.
  const bufferGrammar = useCallback(
    (text: string, turn: number): Promise<SilentError[]> =>
      runtime
        .checkGrammar(text, turn)
        .then((errs) => {
          const reportable = reportableCorrections(errs);
          setErrors((prev) => [...prev, ...reportable]);
          return reportable;
        })
        .catch(() => []),
    [runtime],
  );

  // Envía un turno del aprendiz (texto o nota de voz). `audioUrl` adjunta el
  // audio grabado (WhatsApp): la IA procesa la transcripción `text`.
  const send = useCallback(
    async (text: string, audioUrl?: string, clip?: VoiceClip) => {
      const clean = text.trim();
      if (!clean || busy || sceneComplete) return;
      const prior = messages;
      const turn = turnCount + 1;
      const userTurn: ChatTurn = { role: "user", content: clean, at: Date.now(), audioUrl };
      setMessages([...prior, userTurn]);
      // Turno aceptado: el clip se guarda en segundo plano, sin frenar a Emma.
      void saveVoiceTurn({
        audio: runtime.audio, conversationId: d.conversationId, turn, transcript: clean, clip,
        onError: (e) => console.warn("[audio] no se pudo guardar la nota de voz", e),
      }).then((id) => {
        if (!id) return;
        clipOfTurn.current[turn] = id;
        d.onClipSaved?.();
        setMessages((m) => attachAudioId(m, userTurn, id));
      });
      setTurnCount(turn);
      if (audioUrl) setLastVoiceTurn(turn);
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
        previousWasClarifying: previousWasClarifying.current,
      });
      previousWasClarifying.current = observation.coherence === "unclear";
      if (observation.source === "heuristics" && process.env.NODE_ENV !== "production") {
        // Visible en la consola de dev: si esto aparece en cada turno, el juez
        // no está corriendo y hay que mirar la cola del motor.
        console.warn("[escena] turno etiquetado por la red determinista", observation);
      }
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
      // Recast diferido: la corrección del turno anterior (la gramática corre
      // DESPUÉS de cada respuesta para no ocupar el motor antes de ella).
      const recast = pendingRecast.current;
      pendingRecast.current = [];
      // UNA sola orden de contenido por turno (ver domain/chat/turn-directive):
      // apilarlas producía instrucciones contradictorias y respuestas vacías.
      // Si EMMA va a pedir que desarrolle, el próximo turno del aprendiz se habla.
      setExpectsElaboration(askElaboration || deepen);
      const directive = buildTurnDirective({
        state: sceneState.current,
        intent,
        coherence: observation.coherence,
        elaborate: askElaboration,
        deepen,
        wrapUp: shouldWrapUp(turn, maxTurns) && !deepen,
        recastCue: buildRecastCue(recast, { deferred: true }),
        learnerQuestion: learnerQuestionOf(clean),
        turn,
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
        // Más el chequeo determinista de horas contra los hechos generados (el
        // juez LLM se retiró en T6 de #323: rechazaba líneas correctas).
        validateReply: (r) =>
          !isReaskingCovered(r, sceneState.current, {
            deepeningOn: deepen ? deepeningTarget(sceneState.current)?.id : undefined,
          }) && !detectTimeDrift(r, judgeFacts(contract, situation)),
        // Reparación: la orden es decir lo mismo más simple, así que los
        // guardias anti-repetición no pueden vetar la respuesta (si lo hacen,
        // el turno cae en la recuperación y la escena parece amnésica).
        allowRestate: intent === "meta",
        onToken: (c) => setStreaming((s) => s + c),
      });
      setMessages((m) => [...m, { role: "assistant", content: reply, at: Date.now() }]);
      setStreaming("");
      setBusy(false);
      // Gramática DESPUÉS de la respuesta (T9 de #323): registra los errores de
      // la sesión y deja el recast listo para el turno siguiente.
      void bufferGrammar(clean, turn).then((errs) => {
        pendingRecast.current = errs;
      });
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
    [busy, messages, turnCount, runtime, bufferGrammar, sceneComplete, scenario.scenarioType, contract, situation],
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
      voiceOptOut,
      sceneFacts: contract?.facts || undefined,
      situationId: situation?.id,
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [messages, turnCount, sceneComplete, lesson, voiceOptOut]);

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
    messages, streaming, busy, turnCount, maxTurns, errors, clipOfTurn: clipOfTurn.current, send, lastEmma, suggestionContext,
    // ¿Este turno se habla? La regla es del dominio; el composer sólo obedece.
    voiceRequirement: requiresVoice({
      turn: turnCount + 1,
      maxTurns,
      lastVoiceTurn,
      expectsElaboration,
      idleThreshold: d.settings.voiceIdleTurns,
      voiceUnavailable: voiceOptOut,
    }),
    // Salida de emergencia: sin micrófono o sin permiso, un turno obligatorio
    // dejaría la sesión bloqueada. Queda registrada en el snapshot.
    declareVoiceUnavailable: () => setVoiceOptOut(true),
    voiceOptOut,
  };
}

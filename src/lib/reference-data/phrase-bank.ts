/**
 * Apéndice G — Banco de frases por situación (G.1–G.7).
 * Transcripción fiel del libro fuente (documento del proyecto).
 * Incluye los temas seguros y prohibidos de small talk (nota de G.7).
 */
import type { PhraseBankEntry } from "@/domain/reference/reference";

export const PHRASE_BANK: PhraseBankEntry[] = [
  // G.1 · Stand-up (30 segundos)
  { situation: "standup", functionEs: "Ayer", phrase: "Yesterday I finished / wrapped up / got through…" },
  { situation: "standup", functionEs: "Ayer", phrase: "I picked up X." },
  { situation: "standup", functionEs: "Ayer", phrase: "I spent most of yesterday on…" },
  { situation: "standup", functionEs: "Hoy", phrase: "Today I'm carrying on with…" },
  { situation: "standup", functionEs: "Hoy", phrase: "I'm going to look at…" },
  { situation: "standup", functionEs: "Hoy", phrase: "I should have a PR up by…" },
  { situation: "standup", functionEs: "Bloqueos", phrase: "No blockers." },
  { situation: "standup", functionEs: "Bloqueos", phrase: "I'm blocked on X." },
  { situation: "standup", functionEs: "Bloqueos", phrase: "I'm waiting on a review." },
  { situation: "standup", functionEs: "Bloqueos", phrase: "I'll need access to Y." },
  { situation: "standup", functionEs: "Sin progreso", phrase: "Not much progress on X, to be honest — I got pulled into the incident." },
  { situation: "standup", functionEs: "Cerrar", phrase: "That's me." },
  { situation: "standup", functionEs: "Cerrar", phrase: "That's it from me." },

  // G.2 · Code review
  { situation: "code_review", functionEs: "Dar feedback", phrase: "nit: could be a const." },
  { situation: "code_review", functionEs: "Dar feedback", phrase: "question: is this reachable?" },
  { situation: "code_review", functionEs: "Dar feedback", phrase: "suggestion: extracting this might read better." },
  { situation: "code_review", functionEs: "Dar feedback", phrase: "Have you considered…?" },
  { situation: "code_review", functionEs: "Dar feedback", phrase: "I might be missing something, but…" },
  { situation: "code_review", functionEs: "Dar feedback", phrase: "blocking: this will break for existing tenants." },
  { situation: "code_review", functionEs: "Dar feedback", phrase: "praise: really clean solution." },
  { situation: "code_review", functionEs: "Recibir feedback", phrase: "Good catch, thanks." },
  { situation: "code_review", functionEs: "Recibir feedback", phrase: "Fair point — I'll change it." },
  { situation: "code_review", functionEs: "Recibir feedback", phrase: "I went with X because Y — happy to change it though." },
  { situation: "code_review", functionEs: "Recibir feedback", phrase: "Let me push back gently on that one." },
  { situation: "code_review", functionEs: "Recibir feedback", phrase: "You're right, I hadn't thought of that case." },
  { situation: "code_review", functionEs: "Recibir feedback", phrase: "I'll fix that before merging." },
  { situation: "code_review", functionEs: "Recibir feedback", phrase: "Thanks for the thorough review." },

  // G.3 · Incidente en vivo
  { situation: "incident", functionEs: "Declarar", phrase: "I'm declaring an incident. I'll take incident command." },
  { situation: "incident", functionEs: "Estado", phrase: "Current status: error rate at 8%, climbing since 02:14." },
  { situation: "incident", functionEs: "Pedir", phrase: "Can someone check the pool metrics?" },
  { situation: "incident", functionEs: "Hipótesis", phrase: "My working theory is a connection leak. Not confirmed." },
  { situation: "incident", functionEs: "Decisión", phrase: "I'm calling it — we roll back. Objections?" },
  { situation: "incident", functionEs: "Coordinar", phrase: "Tom, you own the rollback. Maya, you own comms." },
  { situation: "incident", functionEs: "Comunicar", phrase: "We're aware of the issue and actively working on it." },
  { situation: "incident", functionEs: "Cerrar", phrase: "Error rate is back to baseline. Standing down. Postmortem on Thursday." },

  // G.4 · Reunión (rescate rápido)
  { situation: "meeting", functionEs: "No has entendido", phrase: "Sorry, could you say that again?" },
  { situation: "meeting", functionEs: "No has entendido", phrase: "You've lost me — could you back up a bit?" },
  { situation: "meeting", functionEs: "Ganar tiempo", phrase: "Let me think about that for a second." },
  { situation: "meeting", functionEs: "Intervenir", phrase: "Can I jump in here?" },
  { situation: "meeting", functionEs: "Intervenir", phrase: "Sorry to interrupt, but…" },
  { situation: "meeting", functionEs: "Discrepar", phrase: "I see it a bit differently." },
  { situation: "meeting", functionEs: "Discrepar", phrase: "I'd push back on that." },
  { situation: "meeting", functionEs: "Estar de acuerdo", phrase: "Exactly." },
  { situation: "meeting", functionEs: "Estar de acuerdo", phrase: "That's my read too." },
  { situation: "meeting", functionEs: "Concretar", phrase: "So what's the actual decision here?" },
  { situation: "meeting", functionEs: "Cerrar", phrase: "Shall we take this offline?" },
  { situation: "meeting", functionEs: "Cerrar", phrase: "Are we agreed on X?" },
  { situation: "meeting", functionEs: "Confirmar", phrase: "Just to summarise: X is decided, Y is still open, Z is yours." },

  // G.5 · Entrevista
  { situation: "interview", functionEs: "Abrir STAR", phrase: "Sure — for context, …" },
  { situation: "interview", functionEs: "Tu acción", phrase: "So what I did was…" },
  { situation: "interview", functionEs: "Resultado", phrase: "The outcome was that…" },
  { situation: "interview", functionEs: "Resultado", phrase: "What I took away from it is…" },
  { situation: "interview", functionEs: "Clarificar", phrase: "Before I start, can I clarify a couple of things?" },
  { situation: "interview", functionEs: "Atascado", phrase: "Let me think out loud for a second." },
  { situation: "interview", functionEs: "No lo sabes", phrase: "I don't know — my guess would be X, but I'd want to check." },
  { situation: "interview", functionEs: "Preguntar", phrase: "How do changes get from a laptop to production?" },
  { situation: "interview", functionEs: "Cerrar", phrase: "What are the next steps, and what's the timeline?" },

  // G.6 · 1:1
  { situation: "one_on_one", functionEs: "Abrir", phrase: "How's the week been, honestly?" },
  { situation: "one_on_one", functionEs: "Obstáculos", phrase: "What's slowing you down that I could remove?" },
  { situation: "one_on_one", functionEs: "Feedback", phrase: "There's something I want to raise. Is now a good time?" },
  { situation: "one_on_one", functionEs: "Coaching", phrase: "What have you tried so far?" },
  { situation: "one_on_one", functionEs: "Coaching", phrase: "And what else?" },
  { situation: "one_on_one", functionEs: "Sobre ti", phrase: "What should I be doing differently?" },
  { situation: "one_on_one", functionEs: "Cerrar", phrase: "What do you need from me before the next one?" },

  // G.7 · Small talk (los cinco minutos previos)
  { situation: "small_talk", functionEs: "Abrir", phrase: "How's your week going?" },
  { situation: "small_talk", functionEs: "Abrir", phrase: "How was the weekend?" },
  { situation: "small_talk", functionEs: "Responder", phrase: "Not bad, thanks — busy but good." },
  { situation: "small_talk", functionEs: "Devolver", phrase: "How about you?" },
  { situation: "small_talk", functionEs: "Rellenar", phrase: "Any plans for the weekend?" },
  { situation: "small_talk", functionEs: "Rellenar", phrase: "Where are you based again?" },
  { situation: "small_talk", functionEs: "Cerrar", phrase: "Anyway — shall we get started?" },
  { situation: "small_talk", functionEs: "Meteorología (siempre funciona [UK])", phrase: "Miserable out there today, isn't it?" },
];

/** Temas seguros para el small talk anglosajón (nota de G.7). */
export const SMALL_TALK_SAFE_TOPICS: string[] = [
  "tiempo",
  "viajes",
  "deporte",
  "comida",
  "series",
  "el commute",
  "la calidad del café de la oficina",
];

/** Temas a evitar en el small talk anglosajón (nota de G.7). */
export const SMALL_TALK_FORBIDDEN_TOPICS: string[] = [
  "sueldo",
  "edad",
  "política",
  "religión",
  "estado civil",
  "peso",
  "salud",
];

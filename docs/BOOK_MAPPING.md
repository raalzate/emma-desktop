# Mapeo del libro «English for Software Engineers» → dinámicas EMMA

Matriz de trazabilidad: cada sección del libro fuente
(`English-for-Software-Engineers-fuente.md`) mapeada a una dinámica de la
aplicación. Estado: `✅ mapeado` · `🔶 en implementación` · `❌ pendiente`.

Principio de mapeo: el libro enseña con el ciclo Scenario→Input→Notice→Sound→
Chunks→Practice→Challenge. En EMMA ese ciclo se encarna así:

| Paso del libro | Dinámica EMMA |
|---|---|
| 1 Scenario | Antesala de escena (`scene-intro` + briefing IA en español) |
| 2 Input | Kickoff de simulación (EMMA habla primero, en rol) + TTS/karaoke |
| 3 Notice | «Teach me» (gramática explicada en español) + lección post-sesión |
| 4 Sound | TTS + tabla de pronunciación + drills fonéticos (datos Parte 1) |
| 5 Chunks | Chips de sugerencia + autocompletado + chunks de la unidad |
| 6 Practice | Conversación con corrección gramatical silenciosa + drills |
| 7 Challenge | Retos con criterios contables en cierre de sesión / progresión |

## Parte 0 — El método

| Sección | Contenido | Dinámica en la app | Estado |
|---|---|---|---|
| 0.1–0.2 | Seis pilares metodológicos | Encarnados en el diseño: TBLT = role-play con misión (SCENE GOAL); output forzado = simulación; contrastivo = trampas ES→EN en corrector. Constantes en `domain/curriculum/method-rules.ts` | ✅ |
| 0.3 | Ciclo de 7 pasos (40 min) | `domain/curriculum/seven-step-cycle.ts` + tabla de encarnación de arriba | ✅ |
| 0.4 | Plan de 24 semanas + semana tipo | `domain/curriculum/study-plan.ts` (`STUDY_PLAN_24_WEEKS`, `weekForUnit`) | ✅ |
| 0.5 | Repaso espaciado (Anki/Leitner, 5 tipos de tarjeta) + bucle de feedback sin profesor | `domain/srs/leitner.ts` + `srs-card.ts` (tarjetas desde errores de sesión) + `application/srs/review-session-use-case.ts` + repo SQLite; bucle grabar→transcribir→comparar = voz ASR + corrección silenciosa + lección | ✅ |
| 0.6 | Cinco métricas con umbrales A1–B2 | `domain/progression/progress-metrics.ts`; densidad de error operativa en `promotion-policy.ts` (errores/turno por nivel) | ✅ |
| 0.7 | Diez reglas del método | `method-rules.ts` → guía en vista de práctica | ✅ |
| 0.8 | Cinco errores de método | `method-rules.ts` (anti-patrones) | ✅ |

## Parte 1 — Sistema de sonidos

Datos en `src/lib/phonetics-data.ts` + tipos en `src/domain/phonetics/`;
dinámica: drills de pronunciación sobre TTS (EdgeTTS) y ASR (Whisper) ya
existentes; tabla de pronunciación del «Teach me».

| Sección | Contenido | Dinámica en la app | Estado |
|---|---|---|---|
| 1.1–1.2 | Atlas de vocales (16 vs 5) | `SOUND_CONTRASTS` (atlas + diptongos) | ✅ |
| 1.3 | 11 contrastes de pares mínimos técnicos | `SOUND_CONTRASTS` + protocolo perceptivo (leer→grabar→verificar) sobre ASR | ✅ |
| 1.4 | Grupos consonánticos finales | `FINAL_CLUSTERS` | ✅ |
| 1.5–1.6 | -ed y -s (3 pronunciaciones c/u) | `ED_ENDINGS`, `S_ENDINGS`; ligado a unidades 2 y 6 (soundFocus) | ✅ |
| 1.7 | Word stress (cognados, engañosas, 4 reglas) | `WORD_STRESS_RULES` | ✅ |
| 1.8 | Schwa /ə/ y formas débiles | `SCHWA_WEAK_FORMS` | ✅ |
| 1.9 | Habla conectada (linking, flapping, elisión, asimilación) | `CONNECTED_SPEECH` | ✅ |
| 1.10 | Entonación (patrones, discrepancia cortés, sentence stress) | `INTONATION_PATTERNS` | ✅ |
| 1.11 | Shadowing 10 min (6 fases) | `SHADOWING_PROTOCOL`; se ejecuta con TTS + karaoke + grabación ASR | ✅ |
| 1.12 | Retos A/B/C | `PART1_CHALLENGES`; Reto B = dictado al ASR (dinámica nativa de EMMA) | ✅ |

## Partes 2–5 — Unidades 1–26

Datos por unidad (escenario, meta, gramática, sonido, chunks, trampas, retos)
en `units-a1.ts`/`units-a2.ts`/`units-b1.ts`/`units-b2.ts` dentro de
`src/lib/curriculum-data/`, tipo
`domain/curriculum/unit.ts`. Cada unidad se practica en los escenarios EMMA
listados; sus chunks alimentan sugerencias, sus trampas el corrector/lección,
sus retos los criterios de cierre.

| U | Título | MCER | Escenarios EMMA | Estado |
|---|---|---|---|---|
| 1 | Introducing yourself to the team | A1 | intro_yourself · meeting_intro · conference_intro | ✅ |
| 2 | Your stack and your working day | A1 | coffee_break · lunch_chat | ✅ |
| 3 | Your environment: what exists and where | A1 | system_walkthrough* · ask_for_help | ✅ |
| 4 | What are you working on right now? | A1 | morning_greeting · slack_thread* · daily_standup | ✅ |
| 5 | Asking for things without sounding rude | A1 | ask_for_help · vacation_request | ✅ |
| 6 | What did you do yesterday? | A1 | daily_standup | ✅ |
| 7 | The complete stand-up | A2 | daily_standup | ✅ |
| 8 | Comparing technologies and options | A2 | tech_comparison* · design_review | ✅ |
| 9 | Estimates, plans and promises | A2 | task_estimation | ✅ |
| 10 | Your experience: perfect vs past | A2 | behavioral_qa · tech_interview | ✅ |
| 11 | Writing instructions and documentation | A2 | documentation_workshop* | ✅ |
| 12 | Narrating a bug | A2 | bug_triage · incident_postmortem | ✅ |
| 13 | Code review without making enemies | B1 | code_review | ✅ |
| 14 | Cause, effect and the order of events | B1 | incident_postmortem | ✅ |
| 15 | Hypotheticals: conditionals | B1 | design_review · architecture_pitch | ✅ |
| 16 | Passive voice and reported speech | B1 | meeting_recap* · retrospective | ✅ |
| 17 | Surviving a meeting in real time | B1 | multi_team_sync* · release_planning · retrospective | ✅ |
| 18 | Describing systems with precision | B1 | design_review · architecture_pitch · tech_interview | ✅ |
| 19 | Regret, blame and third conditional | B2 | incident_postmortem · retrospective | ✅ |
| 20 | Hedging and epistemic precision | B2 | design_review · architecture_pitch | ✅ |
| 21 | Emphasis: clefts, inversion, fronting | B2 | architecture_pitch · stakeholder_pres · tech_strategy_pitch | ✅ |
| 22 | The technical interview | B2 | tech_interview · behavioral_qa | ✅ |
| 23 | Negotiating: salary, scope, deadlines | B2 | salary_negotiation* · talent_negotiation · vendor_call | ✅ |
| 24 | Leading: feedback, delegation, 1:1s | B2 | peer_feedback_1on1 · mentor_junior | ✅ |
| 25 | Presenting: demos, talks, Q&A | B2 | stakeholder_pres · tool_demo · sprint_review | ✅ |
| 26 | Professional writing: email, PRs, ADRs, Slack | B2 | slack_thread* · documentation_workshop* · code_review | ✅ |

`*` = escenario nuevo creado para cubrir el hueco (en
`src/lib/scenarios-data-curriculum.ts`, con 24 situaciones en
`src/lib/situations-data-curriculum.ts`): `system_walkthrough`, `tech_comparison`,
`documentation_workshop`, `meeting_recap`, `multi_team_sync`, `slack_thread`,
`salary_negotiation`. Nota: `slack_thread` y `multi_team_sync` eran
referenciados por `domain/goals/goal-context.ts` sin existir (legado Python) —
crearlos reparó esa inconsistencia.

La unidad activa se resuelve por sesión con
`domain/curriculum/unit-catalog.ts` (`unitForSession`) y se inyecta al system
prompt como bloque LANGUAGE FOCUS (`domain/chat/language-focus.ts`): chunks
como objetivos a provocar, trampas como vigilancia silenciosa. Los chips de
sugerencia usan chunks de la unidad + banco de frases G; la lección
post-sesión usa las trampas de la unidad + Apéndice E.

Componentes internos por unidad: Input (diálogo) → lo interpreta EMMA en vivo
(kickoff + rol); Practice (ejercicios cerrados con solucionario) → drills
(ver Apéndice I); Vocabulario cero / regla SVO → error nº1 del Apéndice E +
grammarFocus de U1.

## Parte 6 — Apéndices

| Ap. | Contenido | Dinámica en la app | Estado |
|---|---|---|---|
| A | 100 verbos irregulares + IPA | `src/lib/reference-data/irregular-verbs.ts` → drills y tarjetas SRS | ✅ |
| B | 120 phrasal verbs | `src/lib/reference-data/phrasal-verbs.ts` → drills cloze y sugerencias | ✅ |
| C | 150 colocaciones técnicas | `src/lib/reference-data/collocations.ts` → tarjetas de colocación (0.5) | ✅ |
| D | 60 falsos amigos | `src/lib/reference-data/false-friends.ts` → corrector/lección | ✅ |
| E | 50 errores del hispanohablante | `src/lib/reference-data/common-errors.ts` → enriquece `error-taxonomy` y lección post-sesión | ✅ |
| F | Glosario técnico ES→EN + IPA | `src/lib/reference-data/glossary.ts` → «Teach me»/pronunciación | ✅ |
| G | Banco de frases por situación | `src/lib/reference-data/phrase-bank.ts` → chips de sugerencia por escenario | ✅ |
| H | Checklists autoevaluación A1→B2 (13/15 + bases) | `domain/curriculum/self-assessment.ts` (`certifiesB2`) + vista persistida en `/practice?tab=assessment` | ✅ |
| I | Solucionario | `src/lib/exercise-data/` (137 ejercicios con respuestas) + `domain/exercises/evaluate-exercise.ts` (corrección determinista) | ✅ |
| J | Plan 24 semanas detallado (45 min/día, hitos) | `domain/curriculum/study-plan.ts` + tarjeta de plan en Progreso | ✅ |
| K | Recursos | `src/lib/reference-data/resources.ts` (24 recursos, 10 categorías) | ✅ |

### Los 72 retos (paso 7 del ciclo)

`domain/curriculum/challenge-selection.ts` + puerto/repo de retos +
`application/challenges/`: el cierre de sesión propone el reto de la unidad
practicada con sus criterios contables, y el tab «Retos» de `/practice` permite
entregarlo y marcarlo (progreso N/72).

### Métricas del método (0.6)

`domain/progression/session-metrics.ts` calcula al cerrar cada sesión las tres
métricas medibles — latencia de respuesta (mediana), monólogo sostenido y
densidad de error — las persiste y las muestra en Progreso con su nivel MCER.
Las otras dos del libro (velocidad de lectura y comprensión auditiva) quedan
como autoevaluación manual, y la UI lo dice.

### Bucle de pronunciación (0.5 · Reto B)

`domain/phonetics/pronunciation-check.ts` compara palabra a palabra tu
transcripción (Whisper) contra el objetivo y marca lo que la máquina no
entendió; el criterio es **inteligibilidad** (umbral 0.8), no acento nativo.
Disponible en el laboratorio de pares mínimos y en el shadowing.

## Estado de implementación

Implementación completa (todas las olas):

1. **Datos** — 26 unidades (chunks, trampas, retos 1–72), fonética Parte 1,
   137 ejercicios con solucionario, apéndices A–K (~700 entradas).
2. **Dominio** — currículo (ciclo 7 pasos, plan 24 semanas, checklists H,
   reglas del método, unit-catalog), SRS Leitner + tarjetas, evaluación
   determinista de ejercicios, drill perceptivo de pares mínimos.
3. **Integración** — bloque LANGUAGE FOCUS en el prompt de simulación por
   unidad de sesión; chips con chunks + banco G; lección con trampas +
   Apéndice E; tarjetas SRS generadas desde los errores al cerrar sesión;
   7 escenarios nuevos con 24 situaciones.
4. **UI** — sección «Práctica» (`/practice`): drills de ejercicios, repaso
   SRS, laboratorio de pares mínimos + shadowing (TTS), plan de estudio y
   ciclo/reglas del método, autoevaluación A1→B2 persistida con criterio de
   certificación B2.

5. **Capa tutora (el agente como cabeza del sistema)** —
   `domain/tutor/` (`TutorContext`, `recommendPractice`, `SYSTEM_MAP_ES`,
   `buildTutorBriefing`) + `application/tutor/get-tutor-context-use-case.ts`.
   El agente conoce y decide en cada punto: bienvenida con briefing del plan
   (semana/unidad/pendientes), TUTOR AWARENESS en escena (débil en X →
   provoca práctica sin romper personaje), cierre de sesión con «Próximos
   pasos» clicables (deep-links a `/practice`), siguiente escenario con boost
   por semana del plan, tarjeta de plan en Progreso.

6. **Naturalidad de la conversación** — la escena reacciona antes de preguntar,
   atribuye cada respuesta al objetivo que de verdad contesta
   (`advanceScene`), hace **recast** de tus deslices en personaje
   (`domain/chat/recast.ts`), pide desarrollo cuando respondes corto
   (`elaboration.ts`), no cierra dejando una pregunta en el aire ni antes de
   poder evaluarse (`scene-closing.ts`), y los **39 escenarios** tienen
   objetivos (`src/lib/scene-checklists.ts`).

Verificación: `pnpm test` 851/851 · `pnpm typecheck` limpio ·
`graphify update .` ejecutado.

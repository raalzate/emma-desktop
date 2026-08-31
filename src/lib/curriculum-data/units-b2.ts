/**
 * Unidades 19–26 (nivel B2) del libro «English for Software Engineers».
 *
 * El "why": transcripción fiel del contenido pedagógico de la Parte 5 del
 * libro fuente (escenarios, chunks con función comunicativa, trampas del
 * hispanohablante y retos globales 43–72) para alimentar las dinámicas de
 * EMMA. Datos puros: sin IO ni lógica.
 */

import type { CurriculumUnit } from "@/domain/curriculum/unit";

export const UNITS_B2: CurriculumUnit[] = [
  {
    number: 19,
    title: "Regret, blame and the third conditional",
    cefrLevel: "B2",
    scenarioEs:
      "La parte más delicada de un postmortem: hablar de lo que se hizo mal sin destruir a nadie, incluido tú mismo.",
    goalEs:
      "Analizar el pasado contrafactual y expresar arrepentimiento con precisión.",
    grammarFocus: [
      "Tercer condicional (If + had + participio → would have + participio)",
      "Condicionales mixtos (pasado → presente y presente → pasado)",
      "wish / if only",
      "should have / shouldn't have / could have / needn't have",
      "was supposed to / was meant to / ended up / failed to",
      "Inversión formal sin if (Had we done that…)",
    ],
    soundFocus:
      "Contracciones casi inaudibles de would have y had: 'we'd have caught' /wid əv ˈkɔːt/, 'should have' /ˈʃʊdəv/ (\"SHOO-da\"), 'Had we known' /(h)əd wi ˈnoʊn/. Frase de entrenamiento con tres contracciones seguidas: \"If we'd load-tested it at production volumes, we'd have caught the leak, and none of this would have happened.\"",
    chunks: [
      {
        text: "If we'd load-tested at production volumes, we would have caught the leak before release.",
        functionEs:
          "Tercer condicional: analizar un pasado que no ocurrió y su consecuencia hipotética",
      },
      {
        text: "If the alert threshold hadn't been raised in December, we'd have been paged twenty minutes earlier.",
        functionEs:
          "Tercer condicional en negativa: señalar el efecto de una acción que sí ocurrió",
      },
      {
        text: "If it had had an owner, someone would have noticed that it had been silenced.",
        functionEs:
          "Tercer condicional: señalar un hueco sistémico sin culpar a nadie",
      },
      {
        text: "If we'd tested it, we might have caught it.",
        functionEs:
          "Consecuencia posible con might have: versión más humilde que would",
      },
      {
        text: "Had we done that, it would have shown up in the December config diff.",
        functionEs:
          "Inversión formal sin if: registro profesional que separa B2 de B1",
      },
      {
        text: "Had it not been for the retry logic, we'd have lost the payments.",
        functionEs: "Inversión formal de 'if it hadn't been for'",
      },
      {
        text: "If the alert had had an owner, we wouldn't be in this meeting.",
        functionEs:
          "Condicional mixto pasado → presente: algo que no pasó afecta al presente",
      },
      {
        text: "If we had proper load testing, this wouldn't have happened.",
        functionEs:
          "Condicional mixto presente → pasado: una condición permanente explica un hecho pasado",
      },
      {
        text: "I wish we'd written down the temporary threshold change as a ticket.",
        functionEs: "wish + had + participio: arrepentimiento sobre el pasado",
      },
      {
        text: "I wish I knew why it failed.",
        functionEs: "wish + pasado simple: deseo contrario a la realidad presente",
      },
      {
        text: "If only we'd load-tested.",
        functionEs: "if only: versión más enfática de wish",
      },
      {
        text: "In hindsight, we should have treated a threshold change as a config change.",
        functionEs: "Crítica retrospectiva constructiva con should have",
      },
      {
        text: "We shouldn't have deployed on a Friday.",
        functionEs: "shouldn't have: no debimos y lo hicimos",
      },
      {
        text: "We needn't have rolled back — the fix was already live.",
        functionEs: "needn't have: lo hicimos y no era necesario",
      },
      {
        text: "It was supposed to be reverted in January — it just never happened.",
        functionEs: "was supposed to: expectativa prevista que no se cumplió",
      },
      {
        text: "We ended up rolling back.",
        functionEs: "ended up + -ing: resultado no planeado",
      },
      {
        text: "We failed to detect it for three weeks.",
        functionEs: "failed to: no logramos (registro formal)",
      },
      {
        text: "Nobody owned it. It wasn't anyone's job.",
        functionEs: "Nombrar la falta de responsable como fallo de sistema",
      },
      {
        text: "It fell through the cracks.",
        functionEs: "Describir algo que se pasó por alto sin señalar culpables",
      },
      {
        text: "That's exactly the kind of gap we should be looking for.",
        functionEs: "Validar el hallazgo de un hueco sistémico en el postmortem",
      },
      {
        text: "This isn't a \"be more careful\" problem. The action item is systemic, not individual.",
        functionEs: "Rechazar acciones correctivas no sistémicas",
      },
      {
        text: "We got away with it. It could have been much worse.",
        functionEs: "Reconocer que el impacto pudo ser mayor",
      },
      {
        text: "With the benefit of hindsight, what we missed was the ownership gap.",
        functionEs: "Retrospectiva formal: nombrar lo que faltó",
      },
      {
        text: "The threshold was raised as a temporary measure, and there was no mechanism to ensure it was reverted.",
        functionEs:
          "Registro blameless: pasiva y procesos en lugar de nombres de personas",
      },
    ],
    traps: [
      {
        wrong: "If we would have tested…",
        right: "If we had tested…",
        noteEs: "Nunca would en la cláusula if.",
      },
      {
        wrong: "If we had tested it, we would find it.",
        right: "If we had tested it, we would have found it.",
        noteEs: "Ambas partes en pasado.",
      },
      {
        wrong: "should of / could of / would of",
        right: "should have / could have / would have",
      },
      {
        wrong: "I wish I would know.",
        right: "I wish I knew.",
      },
      {
        wrong: "I wish we have done it.",
        right: "I wish we had done it.",
      },
      {
        wrong: "It was supposed to being reverted.",
        right: "It was supposed to be reverted.",
      },
      {
        wrong: "We didn't needed to.",
        right: "We didn't need to.",
      },
      {
        wrong: "If only we would have known.",
        right: "If only we had known.",
      },
      {
        wrong: "I regret to not have said it.",
        right: "I regret not saying / not having said it.",
      },
      {
        wrong: "It had to be worse.",
        right: "It could have been worse.",
      },
    ],
    challenges: [
      {
        id: 43,
        instructionsEs:
          "Escribe la sección \"What could we have done differently\" de un postmortem real, en 10–12 frases.",
        criteria: [
          "10–12 frases",
          "Cuatro terceros condicionales",
          "Un condicional mixto",
          "Un wish",
          "Dos should have",
          "Un was supposed to",
          "Una inversión sin if",
          "Cero nombres propios de personas",
        ],
        mode: "written",
      },
      {
        id: 44,
        instructionsEs:
          "Escribe la versión \"con culpables\" del mismo texto y compáralas lado a lado. Este ejercicio es incómodo a propósito: sirve para que veas exactamente qué mecanismos lingüísticos producen el efecto de neutralidad.",
        criteria: [
          "Versión con culpables del mismo texto del reto 43",
          "Comparación lado a lado de ambas versiones",
          "Identificación de los mecanismos lingüísticos que producen la neutralidad",
        ],
        mode: "written",
      },
      {
        id: 45,
        instructionsEs:
          "Presenta la sección en voz alta (2 min). El tercer condicional en voz alta a velocidad natural es una de las cosas más difíciles del inglés para un hispanohablante. Grábate y mide cuántas contracciones produces.",
        criteria: [
          "Duración de 2 minutos",
          "Grabación realizada",
          "Conteo de contracciones producidas",
          "Tercer condicional a velocidad natural",
        ],
        mode: "oral",
      },
    ],
    scenarioTypes: ["incident_postmortem", "retrospective"],
  },
  {
    number: 20,
    title: "Hedging, nuance and epistemic precision",
    cefrLevel: "B2",
    scenarioEs:
      "Escribes un RFC o un documento de diseño que será leído por gente con más autoridad que tú, y necesitas afirmar cosas de las que no estás totalmente seguro.",
    goalEs: "Calibrar exactamente el grado de certeza de cada afirmación.",
    grammarFocus: [
      "Hedging avanzado (verbos modales epistémicos: will, must, should, may well, might just, can)",
      "Adverbios modales de probabilidad y su posición (probably, presumably, arguably, almost certainly)",
      "Verbos de apariencia y tendencia: appear / seem / tend / look like",
      "Estructuras impersonales: it is likely that / X is likely to",
      "Atribución de fuente (based on, according to, as far as I can tell, anecdotally)",
      "Declarar límites explícitamente y cuándo NO hacer hedging (hechos, obligaciones, decisiones)",
    ],
    soundFocus:
      "Los hedges son átonos y rápidos; el contenido lleva el acento: \"It appears to reduce latency by about forty percent\" acentúa re-DUCE, LA-ten-cy, FOR-ty. Acentuar el hedge suena dubitativo, no cauto: la cautela está en las palabras, no en la voz.",
    chunks: [
      {
        text: "Based on a proof of concept run against a snapshot of production, this appears to reduce p99 read latency by around 40%.",
        functionEs:
          "Cautela formal sobre resultados con evidencia declarada y cuantificador cauto",
      },
      {
        text: "The sample covered only two weeks of traffic and may not be representative of month-end load.",
        functionEs: "Declarar el límite de la muestra",
      },
      {
        text: "We are fairly confident about the read path.",
        functionEs: "Graduar la confianza en una parte del análisis",
      },
      {
        text: "We are considerably less confident about the write path.",
        functionEs: "Contrastar grados de certeza entre partes",
      },
      {
        text: "It's possible that the partition routing adds overhead we haven't measured.",
        functionEs: "Señalar una posibilidad no medida",
      },
      {
        text: "There is some evidence that this can become significant above roughly 50 partitions.",
        functionEs: "Presentar evidencia parcial con posibilidad genérica (can)",
      },
      {
        text: "We have not tested rollback under load.",
        functionEs: "Declarar explícitamente lo que no se ha probado",
      },
      {
        text: "We are assuming — but have not verified — that pg_partman handles the retention window correctly.",
        functionEs: "Hacer explícita una asunción no verificada",
      },
      {
        text: "We would suggest proceeding with a limited rollout to one tenant, on the understanding that we treat the write-path numbers as unvalidated.",
        functionEs: "Recomendar con condiciones y límites declarados",
      },
      {
        text: "It may well be the cause.",
        functionEs: "Posibilidad reforzada (~65%) con may well",
      },
      {
        text: "It might be a race condition — I'm about 50/50 on it.",
        functionEs:
          "Posibilidad específica con might (frente a can, que es genérico)",
      },
      {
        text: "It seems to happen only under load.",
        functionEs: "Verbo de apariencia: describir lo observado con cautela",
      },
      {
        text: "These tests tend to get flaky over time.",
        functionEs: "Tendencia general con tend to",
      },
      {
        text: "It'll probably fail under load.",
        functionEs:
          "Adverbio de probabilidad en posición correcta (tras el auxiliar)",
      },
      {
        text: "Presumably they tested it before merging.",
        functionEs: "Marcar una inferencia con presumably",
      },
      {
        text: "Arguably the cleaner approach.",
        functionEs: "Presentar una opinión como defendible con arguably",
      },
      {
        text: "It's unlikely that this is the root cause.",
        functionEs: "Estructura impersonal de improbabilidad",
      },
      {
        text: "It remains to be seen whether it scales.",
        functionEs: "Dejar una cuestión abierta con registro formal",
      },
      {
        text: "As far as I can tell, the leak started in 4.12.",
        functionEs: "Limitar la afirmación a tu conocimiento",
      },
      {
        text: "To the best of my knowledge, nobody has load-tested it.",
        functionEs: "Atribución a conocimiento propio, registro formal",
      },
      {
        text: "Anecdotally, the platform team has seen the same issue.",
        functionEs: "Marcar evidencia no sistemática",
      },
      {
        text: "I'd treat these numbers as indicative rather than definitive.",
        functionEs: "Calificar cifras como orientativas",
      },
      {
        text: "The main unknown is the write path. Where I'd want more data is sustained load.",
        functionEs: "Nombrar la incógnita principal y dónde faltan datos",
      },
      {
        text: "The pool was exhausted at 02:14. That's in the logs.",
        functionEs: "Ser rotundo cuando es un hecho verificado (sin hedging)",
      },
      {
        text: "My recommendation is to proceed with option B.",
        functionEs: "Recomendación final rotunda: no se hace hedging de decisiones",
      },
      {
        text: "Secrets must never be committed to the repo.",
        functionEs: "Obligación de seguridad rotunda (sin hedging)",
      },
    ],
    traps: [
      {
        wrong: "Probably it will fail.",
        right: "It'll probably fail.",
        noteEs: "El adverbio va tras el auxiliar, no al inicio.",
      },
      {
        wrong: "It can be the cause.",
        right: "It may/might be the cause.",
        noteEs: "can = posibilidad genérica; may/might = caso concreto.",
      },
      {
        wrong: "I think that maybe possibly…",
        right: "I suspect… / My sense is…",
      },
      {
        wrong: "In my opinion I think…",
        right: "In my opinion… / I think…",
        noteEs: "Redundante: elige una.",
      },
      {
        wrong: "It's sure that…",
        right: "It's certain that… / Certainly, …",
      },
      {
        wrong: "I am agree that it's likely.",
        right: "I agree that it's likely.",
      },
      {
        wrong: "Is possible that…",
        right: "It's possible that…",
      },
      {
        wrong: "Depends of the load.",
        right: "It depends on the load.",
      },
      {
        wrong: "More or less 40%",
        right: "Around / roughly 40%",
      },
      {
        wrong: "Actually the numbers are…",
        right: "Currently / In fact the numbers are…",
      },
    ],
    challenges: [
      {
        id: 46,
        instructionsEs:
          "Escribe un RFC corto (250–350 palabras) sobre una propuesta técnica real, con las secciones: Summary, Confidence, What we don't know, Recommendation.",
        criteria: [
          "250–350 palabras",
          "Secciones Summary, Confidence, What we don't know y Recommendation",
          "Tres grados distintos de certeza claramente diferenciados",
          "Dos atribuciones de fuente",
          "Tres declaraciones explícitas de límite",
          "Recomendación final sin hedging",
        ],
        mode: "written",
      },
      {
        id: 47,
        instructionsEs:
          "Autoauditoría: coge el último documento técnico que hayas escrito en inglés. Subraya cada afirmación y clasifícala: hecho verificado / interpretación / predicción / asunción. Comprueba si el grado de certeza del lenguaje corresponde a la categoría.",
        criteria: [
          "Cada afirmación del documento subrayada",
          "Cada afirmación clasificada como hecho verificado, interpretación, predicción o asunción",
          "Verificación de que el grado de certeza del lenguaje corresponde a la categoría",
        ],
        mode: "real-work",
      },
      {
        id: 48,
        instructionsEs:
          "Responde en voz alta a \"Are you sure this will work?\" con tres versiones: una honesta y cauta, una honesta y firme, y una que distinga explícitamente qué sabes de qué asumes.",
        criteria: [
          "Versión honesta y cauta",
          "Versión honesta y firme",
          "Versión que distingue explícitamente lo que sabes de lo que asumes",
        ],
        mode: "oral",
      },
    ],
    // `hiring_debrief`: valorar a un candidato exige certeza calibrada, no juicio tajante.
    scenarioTypes: ["design_review", "architecture_pitch", "hiring_debrief"],
  },
  {
    number: 21,
    title: "Emphasis and persuasion: cleft sentences, inversion and fronting",
    cefrLevel: "B2",
    scenarioEs:
      "Un documento de diseño donde necesitas que el lector retenga una idea, o una discusión donde necesitas redirigir la atención.",
    goalEs: "Controlar dónde cae el foco de la información.",
    grammarFocus: [
      "Cleft sentences con it (It is… that / It wasn't until… that)",
      "Cleft sentences con what (What… is)",
      "Inversión enfática (Not only…, Never…, Only after…, Under no circumstances…)",
      "Fronting (adelantar elementos sin invertir)",
      "do enfático (We do accept that…)",
    ],
    soundFocus:
      "El elemento enfatizado lleva el pico tonal: \"It was the COUpling that caused it\", \"What we need is a READ model\", \"We DO accept that…\". Si se lee plano, la estructura se desperdicia; en \"It's not that it's SLOW — it's that we call it FOUR HUNDRED times\" hay doble pico contrastivo.",
    chunks: [
      {
        text: "It's the coupling between billing and notifications that has caused most of our incidents this year.",
        functionEs:
          "It-cleft: contrastar que es X y no otra cosa lo que causa el problema",
      },
      {
        text: "It was only when we ran it at scale that the leak appeared.",
        functionEs: "It-cleft temporal: enfatizar el momento exacto",
      },
      {
        text: "It wasn't until December that anyone noticed.",
        functionEs: "It wasn't until… that: enfatizar lo tardío de un hecho",
      },
      {
        text: "It's not that the code is slow — it's that we call it 400 times per request.",
        functionEs:
          "Corregir el diagnóstico de otra persona sin contradecirla frontalmente",
      },
      {
        text: "It's the boundary, not the database, that's the problem.",
        functionEs: "It-cleft con contraste explícito X, not Y",
      },
      {
        text: "What we're proposing is not a rewrite.",
        functionEs: "What-cleft: crear suspense y fijar la idea al final",
      },
      {
        text: "What's causing the problem is the retry logic.",
        functionEs: "What-cleft: primero el problema, después la causa",
      },
      {
        text: "What matters is the failure mode, not the happy path.",
        functionEs: "What-cleft para priorizar lo importante",
      },
      {
        text: "What I'd do is add a feature flag first.",
        functionEs: "What-cleft para recomendar una acción",
      },
      {
        text: "What worries me is the blast radius.",
        functionEs: "What-cleft para señalar la preocupación principal",
      },
      {
        text: "What surprised us most when we mapped it out was how little of the code actually needs to move.",
        functionEs: "What-cleft para destacar un hallazgo inesperado",
      },
      {
        text: "All we need is one more week.",
        functionEs: "All (that) we need is…: minimizar la petición",
      },
      {
        text: "The reason it's slow is that we're not batching.",
        functionEs: "The reason X is that…: explicar la causa con foco",
      },
      {
        text: "Not only did it fail, but it also took the notification service down.",
        functionEs: "Inversión enfática con Not only… but also",
      },
      {
        text: "Never have I seen a stack trace that deep.",
        functionEs: "Inversión enfática con Never",
      },
      {
        text: "Only after we've split that boundary should we even discuss whether the rest of the monolith needs breaking up.",
        functionEs: "Inversión con Only after: condicionar la discusión futura",
      },
      {
        text: "Under no circumstances should secrets be committed.",
        functionEs: "Inversión con Under no circumstances: prohibición tajante",
      },
      {
        text: "At no point did we consider a big-bang rewrite.",
        functionEs: "Inversión con At no point: negar rotundamente",
      },
      {
        text: "Little did we know it had been there for three weeks.",
        functionEs: "Inversión con Little: ignorancia retrospectiva",
      },
      {
        text: "No sooner had we deployed than the alerts fired.",
        functionEs: "Inversión con No sooner… than: inmediatez dramática",
      },
      {
        text: "So severe was the impact that we froze deploys for a week.",
        functionEs: "Inversión con So… that: magnitud de la consecuencia",
      },
      {
        text: "That part I completely agree with. The rest we can fix later.",
        functionEs: "Fronting: adelantar el elemento para enlazar o contrastar",
      },
      {
        text: "We do accept that this leaves us with two deployment units for longer than anyone would like.",
        functionEs: "do enfático: conceder algo antes de discrepar",
      },
      {
        text: "I do see the appeal of a rewrite. What I don't see is how we'd ship anything for six months.",
        functionEs:
          "Conceder con do enfático y discrepar con what-cleft: discusión profesional eficaz",
      },
      {
        text: "It does work, but only under low load.",
        functionEs: "do enfático para afirmar con reserva",
      },
    ],
    traps: [
      {
        wrong: "It is the coupling what caused it.",
        right: "It is the coupling that caused it.",
        noteEs: "El español usa \"lo que\"; el inglés usa that.",
      },
      {
        wrong: "Is the boundary that…",
        right: "It's the boundary that…",
        noteEs: "Sujeto obligatorio.",
      },
      {
        wrong: "Not only it failed…",
        right: "Not only did it fail…",
        noteEs: "Inversión obligatoria.",
      },
      {
        wrong: "Never I have seen…",
        right: "Never have I seen…",
      },
      {
        wrong: "Only after we split it, we should…",
        right: "Only after we split it should we…",
      },
      {
        wrong: "What I do is I add a flag.",
        right: "What I'd do is add a flag.",
        noteEs: "Infinitivo sin to tras is.",
      },
      {
        wrong: "The thing is that is complex.",
        right: "The thing is it's complex.",
      },
      {
        wrong: "For that reason is important.",
        right: "For that reason it's important.",
      },
      {
        wrong: "Is not that it's slow.",
        right: "It's not that it's slow.",
      },
      {
        wrong: "Also it took down notifications.",
        right: "It also took down notifications.",
        noteEs: "Posición de also.",
      },
    ],
    challenges: [
      {
        id: 49,
        instructionsEs:
          "Escribe la sección de apertura de un documento de diseño (200–250 palabras) defendiendo una decisión técnica real.",
        criteria: [
          "200–250 palabras",
          "Un it-cleft",
          "Dos what-clefts",
          "Una inversión",
          "Un do enfático",
          "Un \"It's not that X, it's that Y\"",
          "Una única idea que el lector deba recordar al terminar",
        ],
        mode: "written",
      },
      {
        id: 50,
        instructionsEs:
          "Coge un párrafo neutro que hayas escrito y reescríbelo tres veces desplazando el foco a tres elementos distintos. Observa cómo cambia lo que el lector se lleva.",
        criteria: [
          "Tres reescrituras del mismo párrafo",
          "Foco desplazado a un elemento distinto en cada versión",
          "Observación de cómo cambia lo que el lector retiene",
        ],
        mode: "written",
      },
      {
        id: 51,
        instructionsEs:
          "Presenta tu argumento en voz alta (2 min) con los picos tonales marcados. Grábate. Escucha si el énfasis se oye o si tu melodía es plana; en ese caso las estructuras no sirven de nada.",
        criteria: [
          "Duración de 2 minutos",
          "Grabación realizada",
          "Picos tonales marcados en los elementos enfatizados",
          "Verificación de que el énfasis se oye (melodía no plana)",
        ],
        mode: "oral",
      },
    ],
    scenarioTypes: [
      "architecture_pitch",
      "stakeholder_pres",
      "tech_strategy_pitch",
    ],
  },
  {
    number: 22,
    title: "The technical interview",
    cefrLevel: "B2",
    scenarioEs:
      "Una entrevista de 4 rondas en inglés: behavioural, live coding, system design y \"do you have any questions for us?\".",
    goalEs:
      "Narrar tu experiencia con estructura, pensar en voz alta mientras programas, y diseñar un sistema hablando.",
    grammarFocus: [
      "Método STAR (Situation–Task–Action–Result)",
      "Pensamiento en voz alta (live coding): clarificar, anunciar plan, narrar, desatascarse",
      "Lenguaje de diseño de sistemas (cinco fases)",
      "Preguntas al entrevistador",
      "I frente a we en la sección Action",
    ],
    soundFocus:
      "Deletrear y leer símbolos, letras y números en voz alta: underscore, square brackets, curly braces, O(n log n) = \"oh of en log en\", p99 = \"p ninety-nine\", letras E /iː/ vs I /aɪ/, G /dʒiː/ vs J /dʒeɪ/; vocabulario de diseño: latency /ˈleɪtənsi/, idempotent /aɪˈdempətənt/, queue /kjuː/, cache /kæʃ/.",
    chunks: [
      {
        text: "So, for context, about a year ago I was on a team of five maintaining the payments service.",
        functionEs: "STAR — Situation: dar el contexto mínimo necesario",
      },
      {
        text: "My concern was that we already had four different responsibilities in that file.",
        functionEs: "STAR — Task: declarar tu responsabilidad o preocupación concreta",
      },
      {
        text: "So what I did was — rather than argue about it in the review — I spent an afternoon writing a small proof of concept.",
        functionEs: "STAR — Action: narrar qué hiciste tú (60% del tiempo)",
      },
      {
        text: "The outcome was that we went with the adapter. It took about two days longer up front.",
        functionEs: "STAR — Result: cerrar con resultado concreto",
      },
      {
        text: "What I took away from it is that a working proof of concept moves a conversation much faster than an argument does.",
        functionEs: "STAR — Result: cerrar con el aprendizaje",
      },
      {
        text: "In hindsight, I'd have asked to see the plan before it was finalised.",
        functionEs: "Responder a \"What would you have done differently?\"",
      },
      {
        text: "The team decided X; my part was Y.",
        functionEs: "Distinguir I de we sin sonar arrogante",
      },
      {
        text: "I owned the caching layer end to end.",
        functionEs: "Hablar de logros con ownership sin minimizar",
      },
      {
        text: "I can't take credit for the design, but I did implement the migration.",
        functionEs: "Atribuir crédito con precisión",
      },
      {
        text: "We cut p99 latency from 800ms to 120ms. That reduced our on-call pages by about 70%.",
        functionEs: "Cerrar el Result con números medibles",
      },
      {
        text: "Before I start, can I clarify a couple of things?",
        functionEs: "Live coding: clarificar el problema antes de escribir",
      },
      {
        text: "Can I assume the input is always valid? What should happen if the list is empty?",
        functionEs: "Live coding: acotar supuestos y casos límite",
      },
      {
        text: "Are we optimising for time or for memory here?",
        functionEs: "Live coding: preguntar el criterio de optimización",
      },
      {
        text: "My first thought is a brute-force approach, and then I'll look at optimising.",
        functionEs: "Live coding: anunciar el plan antes de codificar",
      },
      {
        text: "Let me talk through the approach before I write any code.",
        functionEs: "Live coding: verbalizar el enfoque primero",
      },
      {
        text: "I'll use a set so lookups are constant time. I'll come back to the edge cases in a moment.",
        functionEs: "Live coding: narrar decisiones mientras escribes",
      },
      {
        text: "Let me think out loud for a second.",
        functionEs: "Live coding: evitar el silencio cuando te atascas",
      },
      {
        text: "I'm not immediately seeing the trick here, so let me work through a small example.",
        functionEs: "Live coding: desatascarse con un ejemplo concreto",
      },
      {
        text: "Could I get a nudge on this bit? Am I on the right track?",
        functionEs: "Live coding: pedir una pista sin admitir derrota",
      },
      {
        text: "Actually, scrap that. Here's a better way.",
        functionEs: "Live coding: descartar tu propio enfoque en voz alta",
      },
      {
        text: "That's O(n) time and O(n) space. We could bring that down to O(n) if we…",
        functionEs: "Live coding: analizar complejidad y proponer mejora",
      },
      {
        text: "There's an edge case I haven't handled: what if the input is empty?",
        functionEs: "Live coding: cerrar mencionando casos límite pendientes",
      },
      {
        text: "Let's start with requirements. Who are the users, and what are the core flows?",
        functionEs: "System design — fase 1: requisitos",
      },
      {
        text: "What scale are we targeting? Is there a latency budget?",
        functionEs: "System design — fase 1: acotar escala y presupuesto de latencia",
      },
      {
        text: "Let's do some rough numbers. Back-of-the-envelope, we're looking at about 2 TB a year.",
        functionEs: "System design — fase 2: estimaciones a ojo",
      },
      {
        text: "Let me sketch the high-level components first, then drill into each one.",
        functionEs: "System design — fase 3: diseño de alto nivel",
      },
      {
        text: "Let's zoom in on the write path. There are a few ways to shard this. The trade-off is…",
        functionEs: "System design — fase 4: profundizar y exponer trade-offs",
      },
      {
        text: "Let's talk about what happens when things break. The main bottleneck I'd expect is…",
        functionEs: "System design — fase 5: fallos y cuellos de botella",
      },
      {
        text: "This gives us eventual consistency, which is fine for the feed but not for balances.",
        functionEs: "System design: justificar un trade-off de consistencia",
      },
      {
        text: "If I had to pick one thing to improve, it'd be the hot partition problem.",
        functionEs: "System design: cerrar priorizando una mejora",
      },
      {
        text: "What does the on-call rotation look like in practice?",
        functionEs: "Pregunta al entrevistador: realismo operacional",
      },
      {
        text: "How are technical decisions made when people disagree?",
        functionEs: "Pregunta al entrevistador: madurez del equipo",
      },
      {
        text: "What would you want me to have achieved by the end of month three?",
        functionEs: "Pregunta al entrevistador: orientación a resultados",
      },
      {
        text: "Is there anything about my background that gives you pause?",
        functionEs:
          "Pregunta al entrevistador: rebatir objeciones antes de irte",
      },
      {
        text: "Thanks — that was useful. What are the next steps, and what's the timeline?",
        functionEs: "Cerrar la entrevista pidiendo siguientes pasos",
      },
    ],
    traps: [
      {
        wrong: "In my actual company…",
        right: "In my current company…",
        noteEs: "actual = \"real, verdadero\".",
      },
      {
        wrong: "Actually I work at…",
        right: "Currently I work at…",
        noteEs: "actually = \"en realidad\".",
      },
      {
        wrong: "I have experience since 3 years.",
        right: "I've had experience for 3 years.",
      },
      {
        wrong: "I made a master's.",
        right: "I did / took a master's.",
      },
      {
        wrong: "I am responsible of…",
        right: "I am responsible for…",
      },
      {
        wrong: "We were 5 people in the team.",
        right: "There were 5 of us on the team.",
      },
      {
        wrong: "Explain me the problem.",
        right: "Explain the problem to me.",
      },
      {
        wrong: "I didn't listen you.",
        right: "I didn't hear you.",
      },
      {
        wrong: "working as developer",
        right: "working as a developer",
        noteEs: "Artículo obligatorio.",
      },
      {
        wrong: "I assist to meetings.",
        right: "I attend meetings.",
      },
      {
        wrong: "My English is not very good, sorry.",
        right: "I'll ask if I need anything repeated.",
        noteEs: "Nunca te disculpes por tu inglés.",
      },
      {
        wrong: "Sorry for my bad English.",
        right: "(elimínalo)",
        noteEs: "Resta credibilidad sin ganar nada.",
      },
    ],
    challenges: [
      {
        id: 52,
        instructionsEs:
          "Escribe y memoriza cinco historias STAR (desacuerdo, error en producción, plazo ajustado, feedback difícil, proyecto del que estás orgulloso). Grábalas y cronométralas.",
        criteria: [
          "Cinco historias STAR (desacuerdo, error en producción, plazo ajustado, feedback difícil, proyecto con orgullo)",
          "Máximo 90 segundos cada una",
          "Un número medible en el Result de cada historia",
          "Grabadas y cronometradas",
        ],
        mode: "memorization",
      },
      {
        id: 53,
        instructionsEs:
          "Coge un problema de LeetCode de nivel medio que ya sepas resolver y resuélvelo hablando en inglés todo el tiempo (20 min), sin silencios de más de tres segundos. Graba, escúchalo y cuenta los silencios y las veces que dices \"eeeh\" en lugar de un filler inglés.",
        criteria: [
          "20 minutos hablando en inglés todo el tiempo",
          "Sin silencios de más de tres segundos",
          "Grabación realizada",
          "Conteo de silencios y de \"eeeh\" en lugar de fillers ingleses",
        ],
        mode: "oral",
      },
      {
        id: 54,
        instructionsEs:
          "\"Design a URL shortener\" o \"Design a rate limiter\" (30 min). Recorre las cinco fases en voz alta. Escríbete de antemano solo las frases de apertura de cada fase; el resto improvisado.",
        criteria: [
          "30 minutos en voz alta",
          "Las cinco fases recorridas (requisitos, estimaciones, alto nivel, profundizar, fallos)",
          "Solo las frases de apertura de cada fase preparadas de antemano",
          "El resto improvisado",
        ],
        mode: "oral",
      },
      {
        id: 55,
        instructionsEs:
          "Prepara siete preguntas para el entrevistador, específicas de la empresa a la que quieres entrar, y una respuesta preparada para \"Is there anything about my background that gives you pause?\".",
        criteria: [
          "Siete preguntas específicas de la empresa objetivo",
          "Una respuesta preparada para \"Is there anything about my background that gives you pause?\"",
        ],
        mode: "written",
      },
    ],
    // `pair_programming`: es el mismo músculo que el live coding — pensar en voz alta.
    scenarioTypes: ["tech_interview", "behavioral_qa", "pair_programming"],
  },
  {
    number: 23,
    title: "Negotiating: salary, scope and deadlines",
    cefrLevel: "B2",
    scenarioEs:
      "Una oferta que quieres mejorar, y un product manager que quiere meter tres features más en el mismo sprint.",
    goalEs: "Defender tu posición sin romper la relación.",
    grammarFocus: [
      "Lenguaje diplomático",
      "Concesiones condicionales (si tú X, yo Y)",
      "Push back graduado (de suave a firme)",
      "Silencio y anclaje",
      "Decir \"no\" negando la posibilidad, no el hecho",
      "Disagree and commit",
    ],
    soundFocus:
      "La entonación lo es todo: \"Is there any flexibility on the base?\" ↗ colaborativo; \"I can't commit to that.\" ↘ definitivo. Números con entonación descendente (\"ninety-two\" ↘, nunca ascendente) y pausas de dos segundos completos tras una cifra del otro lado.",
    chunks: [
      {
        text: "Thanks — I'm really pleased to hear that, and I'm genuinely excited about the team.",
        functionEs:
          "Movimiento 1 de la negociación: agradecer y mostrar entusiasmo (nunca lo omitas)",
      },
      {
        text: "Can I be upfront with you about the number?",
        functionEs: "Movimiento 2: pedir permiso para ser directo",
      },
      {
        text: "Based on what I've seen for senior roles in this market, I was expecting something closer to 92.",
        functionEs: "Movimiento 3: anclar con una cifra justificada",
      },
      {
        text: "Is there any flexibility on the base?",
        functionEs: "Movimiento 4: preguntar por el margen",
      },
      {
        text: "Let me be clear that base is the piece that matters most to me.",
        functionEs: "Movimiento 5: declarar tu prioridad",
      },
      {
        text: "If you could get to 88, I'd sign today.",
        functionEs: "Movimiento 6: conceder condicionalmente",
      },
      {
        text: "If the band genuinely caps out below that, I'd want to understand what the path to the next level looks like, and over what timeframe.",
        functionEs: "Movimiento 7: plan B si no hay margen",
      },
      {
        text: "One other thing while we're here — I've got two weeks of holiday already booked in September. Would that be a problem?",
        functionEs: "Movimiento 8: agrupar el resto de peticiones",
      },
      {
        text: "Take your time. Let me know when you've had a chance to look.",
        functionEs: "Movimiento 9: dejar espacio",
      },
      {
        text: "My current total comp is X, so I'd need to see a meaningful step up.",
        functionEs: "Anclaje justificado desde la compensación actual",
      },
      {
        text: "I've got another process at a similar stage, and the range there is X.",
        functionEs: "Anclaje justificado con otra oferta en curso",
      },
      {
        text: "If the base is fixed, could we look at the signing bonus instead?",
        functionEs: "Palanca alternativa cuando el base está bloqueado",
      },
      {
        text: "I could be flexible on start date if there's movement on base.",
        functionEs: "Concesión condicional: intercambiar variables",
      },
      {
        text: "I'd be happy with X provided the review is brought forward to six months.",
        functionEs: "Concesión condicional con provided",
      },
      {
        text: "I could work with 84 if we bring the salary review forward to six months.",
        functionEs: "Nunca conceder sin condición: aceptar a cambio de algo",
      },
      {
        text: "Could I have a couple of days to look at the whole package?",
        functionEs: "Ganar tiempo: no aceptar nunca en el momento",
      },
      {
        text: "Could you send that over in writing? When do you need an answer by?",
        functionEs: "Ganar tiempo y fijar plazos por escrito",
      },
      {
        text: "I'd rather not anchor on my current number — what's the range for the role?",
        functionEs: "No dar tu cifra actual antes de que ellos den la suya",
      },
      {
        text: "We can do that. What I'd need to move out of the sprint to fit it in is X.",
        functionEs:
          "Negociar alcance: no decir \"no\", decir \"sí, y esto es lo que cuesta\"",
      },
      {
        text: "I can see why that's a priority. The constraint we're up against is capacity, not willingness.",
        functionEs: "Reconocer la prioridad y exponer la restricción",
      },
      {
        text: "We've got room for two of the three. Which two matter most?",
        functionEs: "Hacer visible el trade-off y devolver la decisión",
      },
      {
        text: "There are three ways we could play this: cut scope, move the date, or ship it behind a flag.",
        functionEs: "Ofrecer opciones en lugar de un no",
      },
      {
        text: "I'm happy either way — it's a product call, not an engineering one.",
        functionEs: "Devolver la decisión a quien corresponde",
      },
      {
        text: "Just to confirm what we agreed: X is in, Y moves to next sprint.",
        functionEs: "Confirmar el acuerdo por escrito",
      },
      {
        text: "I'd push back on that a little.",
        functionEs: "Pushback suave",
      },
      {
        text: "I'm not sure that follows.",
        functionEs: "Pushback suave: cuestionar el razonamiento",
      },
      {
        text: "Can I offer a different read on that?",
        functionEs: "Pushback suave: proponer otra lectura",
      },
      {
        text: "I hear you, but I don't think that gets us there.",
        functionEs: "Pushback medio",
      },
      {
        text: "I want to flag a risk with that plan.",
        functionEs: "Pushback medio: señalar un riesgo",
      },
      {
        text: "I'd be uncomfortable committing to that date.",
        functionEs: "Pushback medio: rechazar una fecha sin negarse en seco",
      },
      {
        text: "I don't think that's realistic, and I'd rather say so now than in three weeks.",
        functionEs: "Pushback firme",
      },
      {
        text: "I can't commit to that. What I can commit to is X.",
        functionEs: "Pushback firme: negar comprometiéndote a una alternativa",
      },
      {
        text: "I'd want that decision documented, because I don't agree with it.",
        functionEs: "Pushback muy firme y formal: pedir que conste el desacuerdo",
      },
      {
        text: "I'll do it, but I want to be on record that I think it's the wrong call.",
        functionEs: "Disagree and commit: ejecutar dejando constancia",
      },
      {
        text: "I've said what I think. The decision's yours, and I'm behind it.",
        functionEs: "Disagree and commit: la frase canónica",
      },
      {
        text: "I've got capacity for one of those this week. Which one?",
        functionEs: "Proteger tu tiempo devolviendo la priorización",
      },
      {
        text: "If that's urgent, something else has to give.",
        functionEs: "Proteger tu tiempo: hacer visible el coste de la urgencia",
      },
      {
        text: "I'd rather do one of them well than three badly.",
        functionEs: "Proteger la calidad frente a la cantidad",
      },
      {
        text: "I won't be able to, I'm afraid.",
        functionEs: "Decir \"no puedo\" en registro profesional",
      },
      {
        text: "I don't have the capacity this sprint.",
        functionEs: "Decir \"no tengo tiempo\" sin sonar brusco",
      },
      {
        text: "I think there might be a misunderstanding.",
        functionEs:
          "Decir \"te equivocas\" negando la posibilidad, no el hecho",
      },
    ],
    traps: [
      {
        wrong: "I want that you increase it.",
        right: "I'd like you to increase it.",
        noteEs: "Nunca want that.",
      },
      {
        wrong: "Is possible to negotiate?",
        right: "Is it possible to negotiate?",
      },
      {
        wrong: "I have a compromise at 5.",
        right: "I have a commitment / a meeting at 5.",
        noteEs: "compromise = \"acuerdo con concesiones\".",
      },
      {
        wrong: "I will can start…",
        right: "I'll be able to start…",
        noteEs: "Dos modales nunca juntos.",
      },
      {
        wrong: "Let me to think.",
        right: "Let me think.",
      },
      {
        wrong: "We must to decide.",
        right: "We must decide.",
      },
      {
        wrong: "I expect that you understand.",
        right: "I hope you'll understand.",
        noteEs: "expect = \"esperar/exigir\".",
      },
      {
        wrong: "capacity for do it",
        right: "capacity to do it",
      },
      {
        wrong: "Sorry, it's impossible.",
        right: "I can't see a way to…",
        noteEs: "Evita impossible.",
      },
      {
        wrong: "I demand…",
        right: "I'd like… / I'd need…",
        noteEs: "demand es muy agresivo.",
      },
      {
        wrong: "It's not fair.",
        right: "I don't think that reflects the level of the role.",
      },
      {
        wrong: "My salary is very low.",
        right: "I'd need the number to reflect X.",
        noteEs: "No argumentes desde la carencia.",
      },
    ],
    challenges: [
      {
        id: 56,
        instructionsEs:
          "Ensaya la negociación completa del Input en voz alta (5 min), tú haciendo los dos papeles, con las pausas de dos segundos incluidas. Grábate. Escucha si tus números suenan con entonación descendente.",
        criteria: [
          "5 minutos ensayando la negociación completa",
          "Los dos papeles interpretados",
          "Pausas de dos segundos incluidas",
          "Grabación realizada",
          "Números con entonación descendente verificados",
        ],
        mode: "oral",
      },
      {
        id: 57,
        instructionsEs:
          "Escribe el correo de seguimiento tras una llamada de oferta: agradece, resume lo hablado, confirma la petición por escrito, y da una fecha para tu respuesta.",
        criteria: [
          "Agradecimiento",
          "Resumen de lo hablado",
          "Petición confirmada por escrito",
          "Fecha para tu respuesta",
          "Máximo 120 palabras",
        ],
        mode: "written",
      },
      {
        id: 58,
        instructionsEs:
          "Un PM te pide meter tres features en un sprint donde caben dos. Escribe tu respuesta de Slack: reconoce la prioridad, expón la restricción, ofrece tres opciones, devuelve la decisión.",
        criteria: [
          "Reconoce la prioridad",
          "Expone la restricción",
          "Ofrece tres opciones",
          "Devuelve la decisión",
          "Máximo 90 palabras",
          "Sin la palabra \"no\"",
        ],
        mode: "written",
      },
      {
        id: 59,
        instructionsEs:
          "Practica disagree and commit: expresa un desacuerdo técnico real en tres frases y cierra comprometiéndote a ejecutar la decisión contraria.",
        criteria: [
          "Desacuerdo técnico real expresado en tres frases",
          "Cierre comprometiéndote a ejecutar la decisión contraria",
        ],
        mode: "oral",
      },
    ],
    scenarioTypes: ["salary_negotiation", "talent_negotiation", "vendor_call"],
  },
  {
    number: 24,
    title: "Leading: feedback, delegation and 1:1s",
    cefrLevel: "B2",
    scenarioEs:
      "Eres tech lead. Tienes que decirle a alguien que su trabajo no está al nivel, delegar algo que harías mejor tú, y llevar un 1:1 que no sea un informe de estado.",
    goalEs:
      "Influir en el comportamiento de otra persona sin dañar la relación.",
    grammarFocus: [
      "Feedback estructurado (SBI: Situation–Behaviour–Impact + pregunta abierta)",
      "Feedback sobre conducta, nunca sobre identidad",
      "Delegación con contexto (cuatro niveles: ejecutar, recomendar, decidir e informar, poseer)",
      "Preguntas de coaching",
      "Conversaciones difíciles",
    ],
    soundFocus:
      "Los hechos en tono plano y descendente ↘; las preguntas en tono ascendente y suave ↗; el acuerdo en descendente firme ↘. Nunca subas el volumen: el inglés profesional marca gravedad con lentitud (80% de la velocidad normal) y con una pausa antes del Impact.",
    chunks: [
      {
        text: "There's something I want to raise, and I'd rather do it directly than let it sit. Is now a good time?",
        functionEs: "Pedir permiso antes del feedback: evitar la emboscada",
      },
      {
        text: "Can I give you some feedback on X?",
        functionEs: "Pedir permiso para dar feedback",
      },
      {
        text: "So, the observation is this: the last four PRs you've opened have each come back with fifteen or twenty comments.",
        functionEs:
          "SBI — Situation/Behaviour: conducta observable, no rasgo de carácter",
      },
      {
        text: "The impact is that reviews are taking two or three days instead of a few hours.",
        functionEs: "SBI — Impact: efecto medible en otros",
      },
      {
        text: "How does that land with you?",
        functionEs: "Pregunta abierta: ceder el turno en lugar de sentenciar",
      },
      {
        text: "That makes sense, and I get the pressure. My concern is that it's not actually making us faster.",
        functionEs:
          "Reconocer la explicación y sostener la preocupación (fuerza media)",
      },
      {
        text: "What would help you run the checks locally before you open a PR?",
        functionEs: "Pasar del reproche a la solución con una pregunta",
      },
      {
        text: "And can we agree that if a PR needs more than five review comments about mechanical stuff, that's a signal to check tooling?",
        functionEs: "Cerrar el feedback con un acuerdo concreto",
      },
      {
        text: "One small thing you might consider…",
        functionEs: "Feedback correctivo de fuerza mínima",
      },
      {
        text: "I want to flag something before it becomes a pattern.",
        functionEs: "Feedback correctivo de fuerza media",
      },
      {
        text: "This is having a real impact on the team, and we need to change it.",
        functionEs: "Feedback correctivo firme",
      },
      {
        text: "I need to be clear that this can't continue.",
        functionEs: "Feedback correctivo muy firme",
      },
      {
        text: "We're at the point where I have to document this.",
        functionEs: "Feedback formal, registro de RRHH",
      },
      {
        text: "That was really well handled. I want to call out how you dealt with X.",
        functionEs:
          "Feedback positivo explícito (omitirlo se lee como desaprobación)",
      },
      {
        text: "You unblocked three people with that. Thank you.",
        functionEs: "Feedback positivo con impacto concreto",
      },
      {
        text: "Credit where it's due: that was your call and it was the right one.",
        functionEs: "Reconocer la decisión de otra persona",
      },
      {
        text: "That's a real step up from six months ago.",
        functionEs: "Reconocer el progreso en el tiempo",
      },
      {
        text: "I'd like you to take ownership of the caching layer.",
        functionEs: "Delegación: el qué",
      },
      {
        text: "You've done the most work on the read path, and this is a good chance to own something end to end.",
        functionEs: "Delegación: el porqué (para la persona)",
      },
      {
        text: "What I care about is that p99 comes down below 200ms. How you get there is up to you.",
        functionEs: "Delegación: el resultado, no el método",
      },
      {
        text: "Two constraints: no new infrastructure, and it needs to be behind a flag.",
        functionEs: "Delegación: los límites",
      },
      {
        text: "Come to me if you're blocked, and let's check in on Thursday.",
        functionEs: "Delegación: el apoyo",
      },
      {
        text: "You don't need to run every decision past me.",
        functionEs: "Delegación: la confianza",
      },
      {
        text: "This is yours end to end. I'll review if you want me to, but it's your call.",
        functionEs: "Delegación nivel 4: ownership completo",
      },
      {
        text: "Could you look into the options and come back with a recommendation?",
        functionEs: "Delegación nivel 2: recomendar (tú decides)",
      },
      {
        text: "I'd have done it differently, but your way works. Let's go with yours.",
        functionEs: "Resistir la tentación de retomar la tarea delegada",
      },
      {
        text: "That's your call to make.",
        functionEs: "Devolver la decisión a quien la posee",
      },
      {
        text: "What's slowing you down that I could remove?",
        functionEs: "1:1 — obstáculos: qué puede quitar el líder",
      },
      {
        text: "If you could only get one thing done this week, what would it be?",
        functionEs: "1:1 — prioridades",
      },
      {
        text: "What do you want to be better at in six months?",
        functionEs: "1:1 — crecimiento",
      },
      {
        text: "Is there anything the team isn't saying out loud?",
        functionEs: "1:1 — clima del equipo",
      },
      {
        text: "What should I be doing differently?",
        functionEs: "1:1 — feedback hacia ti como líder",
      },
      {
        text: "Anything you'd want me to be doing differently?",
        functionEs: "Cerrar el 1:1 pidiendo feedback inverso",
      },
      {
        text: "What have you tried so far?",
        functionEs: "Coaching: ayudar a pensar en lugar de dar la respuesta",
      },
      {
        text: "What would you do if I weren't here?",
        functionEs: "Coaching: devolver la autonomía",
      },
      {
        text: "And what else?",
        functionEs: "Coaching: la pregunta más eficaz que existe",
      },
      {
        text: "So what I'm hearing is… Let me make sure I've got this right.",
        functionEs: "Escucha activa: parafrasear para verificar",
      },
      {
        text: "That's a fair point, and I hadn't thought about it that way.",
        functionEs: "Escucha activa: reconocer un punto válido",
      },
      {
        text: "I want to be straight with you about the promotion, and about what would need to change.",
        functionEs: "Conversación difícil: no promoción, con claridad",
      },
      {
        text: "You don't seem yourself lately. How are you actually doing?",
        functionEs: "Conversación difícil: posible burnout",
      },
      {
        text: "I got that wrong, and it made your job harder. I'm sorry.",
        functionEs: "Reconocer tu propio error como líder",
      },
      {
        text: "Thanks for taking that well. I know that wasn't easy to hear.",
        functionEs: "Cierre de una conversación difícil",
      },
      {
        text: "Let's revisit this in two weeks. My door's open if you want to come back to any of it.",
        functionEs: "Cierre con seguimiento y disponibilidad",
      },
    ],
    traps: [
      {
        wrong: "a feedback",
        right: "some feedback / a piece of feedback",
        noteEs: "Incontable.",
      },
      {
        wrong: "I recommend you to run…",
        right: "I recommend running / that you run…",
      },
      {
        wrong: "Let me explain you…",
        right: "Let me explain it to you…",
      },
      {
        wrong: "I need that you update…",
        right: "I need you to update…",
      },
      {
        wrong: "Everybody are…",
        right: "Everybody is…",
      },
      {
        wrong: "Thanks for take it well.",
        right: "Thanks for taking it well.",
      },
      {
        wrong: "He said me…",
        right: "He told me…",
      },
      {
        wrong: "You are always making mistakes.",
        right: "The last four PRs had…",
        noteEs: "Evita always + presente continuo (acusación).",
      },
      {
        wrong: "an advice",
        right: "some advice / a piece of advice",
      },
      {
        wrong: "I have to say you something.",
        right: "I need to tell you something.",
      },
      {
        wrong: "Don't worry, it's normal.",
        right: "That's a common one — here's what I'd do.",
        noteEs: "\"It's normal\" puede sonar condescendiente.",
      },
    ],
    challenges: [
      {
        id: 60,
        instructionsEs:
          "Escribe un feedback correctivo real siguiendo SBI + pregunta, sobre una situación que hayas vivido. Comprueba que no contiene ni un solo adjetivo de carácter.",
        criteria: [
          "Estructura SBI + pregunta abierta",
          "Situación real vivida",
          "Máximo 100 palabras",
          "Cero adjetivos de carácter",
        ],
        mode: "written",
      },
      {
        id: 61,
        instructionsEs:
          "Representa el feedback en voz alta (3 min). Grábate. Escucha si el tono de los hechos es plano y el de las preguntas es ascendente.",
        criteria: [
          "3 minutos representando el feedback",
          "Grabación realizada",
          "Tono plano en los hechos",
          "Tono ascendente en las preguntas",
        ],
        mode: "oral",
      },
      {
        id: 62,
        instructionsEs:
          "Escribe una delegación completa de seis bloques para una tarea que normalmente harías tú.",
        criteria: [
          "Los seis bloques presentes: qué, por qué, resultado, límites, apoyo, confianza",
          "Tarea que normalmente harías tú",
        ],
        mode: "written",
      },
      {
        id: 63,
        instructionsEs:
          "Prepara la agenda de un 1:1 con ocho preguntas de la sección de 1:1s, adaptadas a una persona concreta de tu equipo. Incluye al menos una pregunta sobre ti.",
        criteria: [
          "Ocho preguntas de 1:1",
          "Adaptadas a una persona concreta del equipo",
          "Al menos una pregunta sobre ti como líder",
        ],
        mode: "written",
      },
    ],
    scenarioTypes: ["peer_feedback_1on1", "mentor_junior"],
  },
  {
    number: 25,
    title: "Presenting: demos, talks and surviving Q&A",
    cefrLevel: "B2",
    scenarioEs:
      "Una demo de sprint, una presentación de arquitectura a stakeholders, y una charla de veinte minutos en una conferencia.",
    goalEs: "Estructurar un discurso largo y sobrevivir a las preguntas.",
    grammarFocus: [
      "Signposting (abrir, anunciar la estructura, transiciones, cerrar)",
      "Narración",
      "Gestión del Q&A (plantillas de respuesta)",
      "Lenguaje de gráficos y datos (verbos de cambio y adverbios de grado)",
      "Guion de demo en vivo",
    ],
    soundFocus:
      "Prosodia de charla: 20% más lento que en conversación, grupos tonales de 5–8 palabras con pausa entre ellos, pausa completa (1–2 s) antes de cada punto clave y después de cada cifra, bajada final ↘ en cada afirmación, volumen constante, y silencio en lugar de \"eeeh\": en una charla el silencio se lee como control.",
    chunks: [
      {
        text: "Thanks for having me.",
        functionEs: "Abrir la charla agradeciendo la invitación",
      },
      {
        text: "For the next twenty minutes, I want to talk about something we got badly wrong and then fixed.",
        functionEs: "Abrir con duración y gancho",
      },
      {
        text: "I'm going to make one argument today, and it's this: …",
        functionEs: "Abrir declarando el argumento único",
      },
      {
        text: "Here's where we started. Here's where we ended up.",
        functionEs: "Contraste antes/después para enganchar",
      },
      {
        text: "By the end of this, you should be able to…",
        functionEs: "Abrir declarando el objetivo para la audiencia",
      },
      {
        text: "What I'm not going to do is tell you which tools to use — that's not the interesting part.",
        functionEs: "Delimitar el alcance de la charla",
      },
      {
        text: "So I'll cover three things. First… Second… And third…",
        functionEs: "Anunciar la estructura en tres puntos",
      },
      {
        text: "I'll spend most of the time on the second one.",
        functionEs: "Anticipar dónde estará el peso de la charla",
      },
      {
        text: "So that's the measurement. Let's move on to the fix.",
        functionEs: "Transición: cerrar un bloque y abrir el siguiente",
      },
      {
        text: "Which brings me to the second point.",
        functionEs: "Transición: enlazar bloques",
      },
      {
        text: "Before I move on, one caveat.",
        functionEs: "Insertar una salvedad sin perder el hilo",
      },
      {
        text: "Let me come back to that in a minute.",
        functionEs: "Posponer un tema sin ignorarlo",
      },
      {
        text: "Now, here's where it gets interesting.",
        functionEs: "Marcar el clímax de la charla",
      },
      {
        text: "I'll skip the details, but the short version is…",
        functionEs: "Comprimir contenido sin perder a la audiencia",
      },
      {
        text: "To put that in perspective, …",
        functionEs: "Dar escala a una cifra",
      },
      {
        text: "And this is the important bit.",
        functionEs: "Señalar lo clave",
      },
      {
        text: "So, to bring it back to where we started…",
        functionEs: "Cerrar volviendo al principio",
      },
      {
        text: "If you take one thing from this talk, make it this.",
        functionEs: "Cerrar fijando la idea única que deben recordar",
      },
      {
        text: "That's all I've got. Thanks — happy to take questions.",
        functionEs: "Cierre natural (no \"in conclusion, thank you for your attention\")",
      },
      {
        text: "I'll be around afterwards if anyone wants to dig into the details.",
        functionEs: "Ofrecer continuidad tras la charla",
      },
      {
        text: "This chart shows deploy duration over eighteen months. Time along the bottom, minutes up the side.",
        functionEs: "Presentar un gráfico y sus ejes",
      },
      {
        text: "It drops off sharply here, and there's a steady decline from March.",
        functionEs: "Describir tendencia descendente con adverbios de grado",
      },
      {
        text: "It spikes here, then it plateaus and levels off.",
        functionEs: "Describir pico y estabilización",
      },
      {
        text: "That outlier is a bad test. Note the log scale.",
        functionEs: "Señalar puntos notables y advertir sobre la escala",
      },
      {
        text: "Roughly a fivefold improvement. That's an order of magnitude.",
        functionEs: "Comparar magnitudes",
      },
      {
        text: "Small sample, so treat it as indicative.",
        functionEs: "Advertir del límite de los datos mostrados",
      },
      {
        text: "Let me show you rather than tell you.",
        functionEs: "Abrir la demo",
      },
      {
        text: "So what you're looking at here is the admin panel.",
        functionEs: "Situar a la audiencia en la pantalla",
      },
      {
        text: "Keep an eye on the counter in the corner. Watch what happens when I…",
        functionEs: "Guiar la atención durante la demo",
      },
      {
        text: "I'll skip the login — assume I'm already authenticated.",
        functionEs: "Comprimir pasos irrelevantes de la demo",
      },
      {
        text: "This normally takes about a second. Give it a moment.",
        functionEs: "Cubrir una demo lenta",
      },
      {
        text: "Well — that's not supposed to happen. Let me try that again.",
        functionEs: "Reaccionar cuando la demo falla",
      },
      {
        text: "I'm not going to fight with it. Let me show you the recording instead.",
        functionEs: "Plan B cuando la demo falla en serio",
      },
      {
        text: "This is the part where the demo gods decide my fate.",
        functionEs: "Humor para desactivar la tensión de la demo",
      },
      {
        text: "And that's the whole flow. That's the happy path — the error handling is the boring bit.",
        functionEs: "Cerrar la demo",
      },
      {
        text: "Sorry, could you repeat the last part? I want to make sure I've understood — are you asking about X or Y?",
        functionEs: "Q&A: pedir aclaración cuando no entendiste la pregunta",
      },
      {
        text: "So the question was about how we handle rollbacks.",
        functionEs: "Q&A: reformular la pregunta para la sala (siempre)",
      },
      {
        text: "So the short answer is X, and the longer answer is…",
        functionEs: "Q&A: ganar tiempo estructurando la respuesta",
      },
      {
        text: "I don't know. My guess would be X, but I'd want to check.",
        functionEs:
          "Q&A: admitir que no lo sabes con calma (aumenta la credibilidad)",
      },
      {
        text: "That's a bigger question than I can do justice to here — can we talk afterwards?",
        functionEs: "Q&A: aparcar una pregunta fuera de alcance",
      },
      {
        text: "That's a fair challenge. Here's why we went the other way.",
        functionEs: "Q&A: responder a quien discrepa sin ponerse a la defensiva",
      },
      {
        text: "I think there's a question in there — is it about X?",
        functionEs: "Q&A: reconducir a quien está haciendo un discurso",
      },
      {
        text: "I don't think we're going to agree on this one, and that's fine. Let's take it offline.",
        functionEs: "Q&A: cerrar con alguien hostil",
      },
      {
        text: "Time for one more. I'll be around if anyone wants to keep going.",
        functionEs: "Q&A: cerrar el turno de preguntas",
      },
    ],
    traps: [
      {
        wrong: "the graphic",
        right: "the chart / the graph",
        noteEs: "graphic = imagen/gráfico visual.",
      },
      {
        wrong: "Any question?",
        right: "Any questions? / Questions?",
        noteEs: "Plural.",
      },
      {
        wrong: "Somebody has a question?",
        right: "Does anyone have a question?",
      },
      {
        wrong: "I will explain you…",
        right: "I'll explain it to you…",
      },
      {
        wrong: "talk about of…",
        right: "talk about…",
      },
      {
        wrong: "during 20 minutes",
        right: "for 20 minutes",
      },
      {
        wrong: "The x-axis represent…",
        right: "The x-axis represents…",
      },
      {
        wrong: "Let me to show you.",
        right: "Let me show you.",
      },
      {
        wrong: "in the next slide",
        right: "on the next slide",
      },
      {
        wrong: "Sensible data",
        right: "Sensitive data",
        noteEs: "sensible = \"razonable\".",
      },
      {
        wrong: "Sorry, my English is bad.",
        right: "(elimínalo)",
      },
      {
        wrong: "I am agree.",
        right: "I agree.",
      },
    ],
    challenges: [
      {
        id: 64,
        instructionsEs:
          "Escribe la apertura completa de una charla de veinte minutos sobre algo que hayas construido: gancho, resultado, lo que no vas a cubrir, estructura de tres puntos.",
        criteria: [
          "Gancho",
          "Resultado",
          "Lo que no vas a cubrir",
          "Estructura de tres puntos",
          "Máximo 200 palabras",
        ],
        mode: "written",
      },
      {
        id: 65,
        instructionsEs:
          "Graba la apertura (5 min) respetando los grupos tonales y las pausas. Escúchate y cuenta: cuántas afirmaciones terminan en tono ascendente, y cuántos \"eeeh\" hay.",
        criteria: [
          "5 minutos grabados",
          "Grupos tonales y pausas respetados",
          "Conteo de afirmaciones que terminan en tono ascendente",
          "Conteo de \"eeeh\"",
        ],
        mode: "oral",
      },
      {
        id: 66,
        instructionsEs:
          "Que alguien te haga cinco preguntas hostiles sobre tu tema, o escríbelas tú mismo y respóndelas en frío, grabando. Una de ellas debe tener como respuesta \"I don't know\".",
        criteria: [
          "Cinco preguntas hostiles respondidas",
          "Respuestas en frío grabadas",
          "Una respuesta que sea \"I don't know\"",
        ],
        mode: "oral",
      },
      {
        id: 67,
        instructionsEs:
          "Escribe el guion de una demo de tres minutos, incluyendo las dos frases que usarás cuando falle.",
        criteria: [
          "Guion de demo de tres minutos",
          "Dos frases preparadas para cuando falle",
        ],
        mode: "written",
      },
    ],
    // `escalation_call`: comunicar impacto a dirección y aguantar el Q&A hostil.
    scenarioTypes: ["stakeholder_pres", "tool_demo", "sprint_review", "escalation_call"],
  },
  {
    number: 26,
    title: "Professional writing: email, PRs, ADRs and Slack",
    cefrLevel: "B2",
    scenarioEs: "Todo lo que escribes en un día de trabajo.",
    goalEs:
      "Escribir textos que consigan la acción que quieres al primer intento.",
    grammarFocus: [
      "Estructura BLUF (Bottom Line Up Front: petición/conclusión → razón → contexto → detalle)",
      "Registro escrito en tres niveles (informal Slack / neutro email / formal documento)",
      "Plantillas: email, descripción de PR (What/Why/How/Testing/Risks), ADR, informe de incidente",
      "Tono en mensajería (brevedad sin marcadores de amabilidad se lee como enfado)",
      "Tiempos verbales del ADR (Decision con will, Alternatives con pasiva + rejected because)",
    ],
    soundFocus:
      "Prueba oral infalible del tono escrito: lee tu mensaje en voz alta; si suena a robot, a burócrata o a enfadado, reescríbelo. La escritura profesional en inglés está muy cerca del habla: \"Heads up — we've moved the deploy to Thursday\" frente a \"Please be advised that the deployment has been rescheduled\".",
    chunks: [
      {
        text: "Hi Tom — could you approve the Redis upgrade by Thursday? It unblocks the caching work. Details below if you need them.",
        functionEs:
          "BLUF: la petición primero, el razonamiento después",
      },
      {
        text: "Approval needed: Redis upgrade (by Thu)",
        functionEs: "Línea de asunto accionable: acción + objeto + plazo",
      },
      {
        text: "Could you let me know by Thursday?",
        functionEs: "Cierre de email con acción y plazo claros",
      },
      {
        text: "If I don't hear back by Thursday I'll assume it's fine and proceed.",
        functionEs: "Cierre con siguiente paso por defecto",
      },
      {
        text: "No action needed — just keeping you in the loop.",
        functionEs: "Informar sin pedir acción",
      },
      {
        text: "Following up on my message from Monday. Just bumping this to the top of your inbox.",
        functionEs: "Seguimiento de un email sin respuesta",
      },
      {
        text: "Gentle nudge on this one.",
        functionEs: "Recordatorio suave",
      },
      {
        text: "I've got some bad news about the timeline. Wanted to flag this early rather than late.",
        functionEs: "Abrir un email de malas noticias",
      },
      {
        text: "We haven't met — I'm the new backend engineer on the platform team.",
        functionEs: "Presentarse por escrito",
      },
      {
        text: "Apologies for the slow reply.",
        functionEs: "Responder tarde sin dar explicaciones largas",
      },
      {
        text: "Thanks for thinking of me. I'm going to have to pass on this one.",
        functionEs: "Declinar una petición con cortesía",
      },
      {
        text: "Looping in Priya as this needs a decision above my level.",
        functionEs: "Escalar añadiendo a la persona adecuada",
      },
      {
        text: "Unless anyone objects, let's consider this settled.",
        functionEs: "Cerrar un hilo de discusión",
      },
      {
        text: "Happy to jump on a call if that's easier.",
        functionEs: "Ofrecer escalar de texto a voz",
      },
      {
        text: "Let me know what you'd like me to do.",
        functionEs:
          "Alternativa natural a \"Please advise\" y \"Kindly do the needful\"",
      },
      {
        text: "I went with Redis rather than in-process counters because we run six replicas.",
        functionEs: "PR: justificar la decisión de diseño (How)",
      },
      {
        text: "Open to being talked out of this.",
        functionEs: "PR: invitar a discrepar de tu decisión",
      },
      {
        text: "This is deliberately not handling Z — separate ticket.",
        functionEs: "PR: acotar el alcance explícitamente",
      },
      {
        text: "Not tested: behaviour when Redis is unavailable — worth a second opinion on the error path.",
        functionEs: "PR: declarar lo no probado y pedir revisión dirigida",
      },
      {
        text: "Splitting this out of #412 to keep the diff reviewable.",
        functionEs: "PR: explicar la división del cambio",
      },
      {
        text: "No functional change — pure refactor.",
        functionEs: "PR: señalar que no hay cambio de comportamiento",
      },
      {
        text: "Fails open by design.",
        functionEs: "PR: documentar una decisión de modo de fallo",
      },
      {
        text: "Do not merge until X lands.",
        functionEs: "PR: bloquear el merge por dependencia",
      },
      {
        text: "Draft — pushing for early feedback, not review.",
        functionEs: "PR: pedir feedback temprano sin revisión formal",
      },
      {
        text: "Rollback is the feature flag rate_limit_enabled, no migration involved.",
        functionEs: "PR: declarar el plan de reversión (Risks/Rollback)",
      },
      {
        text: "nit: / question: / suggestion: / praise: / blocking: / FYI:",
        functionEs:
          "Etiquetas convencionales de comentarios de revisión de código",
      },
      {
        text: "We will implement rate limiting as a token bucket in Redis, keyed by tenant.",
        functionEs: "ADR — Decision: se escribe con will",
      },
      {
        text: "Rate limiting now depends on Redis availability; we mitigate this by failing open.",
        functionEs: "ADR — Consequences: consecuencias en presente",
      },
      {
        text: "We accept a small amount of imprecision under clock skew.",
        functionEs: "ADR — Consequences: asumir un coste explícitamente",
      },
      {
        text: "In-process counters — rejected because of the multiplication problem.",
        functionEs:
          "ADR — Alternatives considered: pasiva + rejected because",
      },
      {
        text: "Root cause was connection pool exhaustion caused by a connection leak introduced in release 4.12.",
        functionEs:
          "Informe de incidente: diagnóstico con pasiva y sustantivos, cero nombres",
      },
      {
        text: "Add a pool-utilisation alert (owner: Maya, by 20 March).",
        functionEs: "Informe de incidente: cada acción con dueño y fecha",
      },
      {
        text: "Hi — quick one: is the staging DB meant to be read-only?",
        functionEs:
          "Slack: pregunta corta con contexto (nunca \"hi\" solo esperando)",
      },
      {
        text: "Getting a 403 from /v2/orders with a token that worked yesterday — did something change?",
        functionEs: "Slack: preguntar con contexto en lugar de \"Does the API work?\"",
      },
      {
        text: "No rush — whenever you get a chance.",
        functionEs: "Slack: quitar presión",
      },
      {
        text: "This is blocking me, sorry to push.",
        functionEs: "Slack: urgencia explícita sin gritar",
      },
      {
        text: "Seen this — looking now. On it. Give me 20 mins.",
        functionEs: "Slack: reconocer sin resolver todavía",
      },
      {
        text: "Heads up: we've moved the deploy to Thursday.",
        functionEs: "Slack: avisar",
      },
      {
        text: "For visibility:",
        functionEs: "Slack: informar sin pedir acción",
      },
      {
        text: "Good spot. / Nice catch.",
        functionEs: "Slack: reconocer un hallazgo ajeno",
      },
      {
        text: "Ah, ignore me — found it. My bad.",
        functionEs: "Slack: autocorrección y asumir un error informal",
      },
      {
        text: "Shall we jump on a quick call?",
        functionEs: "Slack: escalar de texto a voz",
      },
      {
        text: "Parking this for now. Circling back on this.",
        functionEs: "Slack: aplazar y retomar",
      },
      {
        text: "Not this one, sorry. / Could you do X when you get a chance?",
        functionEs:
          "Slack: marcadores baratos de amabilidad que evitan que la brevedad suene a enfado",
      },
      {
        text: "LGTM / PTAL / SGTM / TL;DR / AFAIK / IIRC / EOD / OOO / ETA?",
        functionEs: "Slack: abreviaturas profesionales de mensajería",
      },
    ],
    traps: [
      {
        wrong: "I am writing you…",
        right: "I'm writing to you…",
      },
      {
        wrong: "Dear Tom, (email interno)",
        right: "Hi Tom,",
      },
      {
        wrong: "I remain at your disposal.",
        right: "Let me know if you need anything else.",
        noteEs: "Calco del español.",
      },
      {
        wrong: "for any doubt",
        right: "if you have any questions",
        noteEs: "doubt = duda de creencia, no pregunta.",
      },
      {
        wrong: "inconvenients",
        right: "inconvenience",
        noteEs: "Incontable.",
      },
      {
        wrong: "in attach",
        right: "attached / I've attached…",
      },
      {
        wrong: "Waiting for your answer.",
        right: "Looking forward to hearing from you.",
      },
      {
        wrong: "According to my last email…",
        right: "As per / As I mentioned in my last email…",
        noteEs: "according to = \"según [una fuente]\".",
      },
      {
        wrong: "Thanks for your attention, greetings.",
        right: "Thanks — best,",
        noteEs: "greetings no es despedida.",
      },
      {
        wrong: "I would be grateful if you can…",
        right: "I would be grateful if you could…",
        noteEs: "Condicional.",
      },
      {
        wrong: "Please advise.",
        right: "Let me know what you'd like me to do.",
      },
      {
        wrong: "I have a doubt.",
        right: "I have a question.",
      },
      {
        wrong: "Actually…",
        right: "Currently… / In fact…",
        noteEs: "Según lo que quieras decir.",
      },
      {
        wrong: "Sensible information",
        right: "Sensitive information",
      },
      {
        wrong: "We are agree.",
        right: "We agree.",
      },
      {
        wrong: "Do it. / No.",
        right: "Could you do X? / Not this one, sorry.",
        noteEs: "Brevedad = enfado en inglés escrito.",
      },
    ],
    challenges: [
      {
        id: 68,
        instructionsEs:
          "Escribe un email real de petición con BLUF, asunto accionable y cierre con siguiente paso. Léelo en voz alta y comprueba que no suena a carta comercial.",
        criteria: [
          "Estructura BLUF",
          "Asunto accionable",
          "Cierre con siguiente paso",
          "Máximo 120 palabras",
          "Leído en voz alta: no suena a carta comercial",
        ],
        mode: "written",
      },
      {
        id: 69,
        instructionsEs:
          "Escribe un ADR completo de una decisión que hayas tomado, con los cuatro bloques y tres alternativas rechazadas con su razón.",
        criteria: [
          "Los cuatro bloques: Context, Decision, Consequences, Alternatives considered",
          "Tres alternativas rechazadas",
          "Cada alternativa con su razón de rechazo",
        ],
        mode: "written",
      },
      {
        id: 70,
        instructionsEs:
          "Escribe un informe de incidente completo sobre un incidente real, con timeline en UTC, causa raíz sin nombres, what went well, y tres acciones con dueño y fecha.",
        criteria: [
          "Timeline en UTC",
          "Causa raíz sin nombres de personas",
          "Sección what went well",
          "Tres acciones, cada una con dueño y fecha",
        ],
        mode: "written",
      },
      {
        id: 71,
        instructionsEs:
          "Reescribe los cinco mensajes de Slack más secos que hayas enviado esta semana añadiendo marcadores de amabilidad, sin alargarlos más de cinco palabras.",
        criteria: [
          "Cinco mensajes de Slack reales reescritos",
          "Marcadores de amabilidad añadidos",
          "Ningún mensaje alargado más de cinco palabras",
        ],
        mode: "real-work",
      },
      {
        id: 72,
        instructionsEs:
          "El reto final del libro: elige un proyecto técnico real y produce el paquete completo en inglés: (1) un ADR, (2) la descripción del PR, (3) un email a un stakeholder no técnico explicando por qué importa, (4) el guion de una demo de tres minutos, y (5) una charla de cinco minutos grabada. Cinco registros distintos, un solo contenido. Si puedes hacer esto, tienes B2 operativo.",
        criteria: [
          "Un ADR",
          "La descripción del PR",
          "Un email a un stakeholder no técnico explicando por qué importa",
          "El guion de una demo de tres minutos",
          "Una charla de cinco minutos grabada",
          "Cinco registros distintos con un solo contenido",
        ],
        mode: "real-work",
      },
    ],
    scenarioTypes: ["slack_thread", "documentation_workshop", "code_review"],
  },
];

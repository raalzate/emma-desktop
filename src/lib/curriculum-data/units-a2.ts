/**
 * Unidades 7–12 (nivel A2) del libro «English for Software Engineers».
 *
 * El "why": transcripción fiel de la fuente pedagógica (Parte 3 del libro)
 * a datos estructurados que consumen los escenarios, el coach de chunks,
 * el corrector de trampas y los retos de cierre de sesión de EMMA.
 *
 * Nota de fidelidad: la Unidad 7 no incluye tabla «Trampas del
 * hispanohablante» en el libro, por eso su arreglo `traps` está vacío.
 * En la Unidad 11 se incluyen tanto la tabla final de trampas como la
 * tabla «Trampas de conectores muy frecuentes» de la sección 3.
 */

import type { CurriculumUnit } from "@/domain/curriculum/unit";

export const UNITS_A2: CurriculumUnit[] = [
  {
    number: 7,
    title: "The complete stand-up",
    cefrLevel: "A2",
    scenarioEs:
      "El stand-up diario completo, con las tres partes: ayer, hoy, bloqueos.",
    goalEs: "Integrar pasado, presente e intención futura en 30 segundos.",
    grammarFocus: [
      "going to",
      "be + to",
      "integración de los tres tiempos",
      "lenguaje de bloqueos",
    ],
    soundFocus:
      "Reducciones de futuro: gonna /ˈɡʌnə/, wanna /ˈwɑːnə/, I'll /aɪl/, it'll /ˈɪtəl/, gotta /ˈɡɑːtə/, kinda /ˈkaɪndə/. Sin esto no entenderás un stand-up de nativos.",
    chunks: [
      // Bloque 1 — Ayer (verbos de cierre y de progreso)
      { text: "I wrapped up the migration.", functionEs: "informar que se terminó del todo" },
      { text: "I finished / completed X.", functionEs: "informar una tarea terminada" },
      { text: "I got X merged.", functionEs: "conseguí que se fusionara" },
      { text: "I made progress on X.", functionEs: "avancé en" },
      { text: "I made a start on X.", functionEs: "empecé" },
      { text: "I spent most of the day on X.", functionEs: "pasé casi todo el día en" },
      { text: "I looked into X.", functionEs: "investigué" },
      { text: "I didn't get to X.", functionEs: "no llegué a X" },
      { text: "I didn't get to the bottom of it.", functionEs: "no llegué al fondo del asunto" },
      { text: "I parked X.", functionEs: "lo dejé aparcado" },
      { text: "I carried on with X.", functionEs: "seguí con" },
      // Bloque 2 — Hoy
      { text: "Today I'm working on X.", functionEs: "tarea en curso" },
      { text: "Today I'm going to start on X.", functionEs: "intención decidida" },
      { text: "I'm picking up the X ticket.", functionEs: "cogiendo la tarea" },
      { text: "I'm aiming to have a draft by EOD.", functionEs: "marcar un objetivo" },
      { text: "I'm hoping to finish it today.", functionEs: "esperanza, menos firme" },
      { text: "I'll probably get to X.", functionEs: "expresar probabilidad" },
      { text: "I'm planning to pair with Maya.", functionEs: "anunciar un plan" },
      { text: "First I'm going to X, then I'll Y.", functionEs: "marcar una secuencia" },
      // Bloque 3 — Bloqueos (el bloque que más importa)
      { text: "No blockers.", functionEs: "todo bien" },
      { text: "Nothing blocking.", functionEs: "todo bien (variante)" },
      { text: "I'm blocked on X.", functionEs: "bloqueo duro" },
      { text: "I'm waiting on X. / waiting for approval.", functionEs: "señalar una espera" },
      { text: "I need access to X.", functionEs: "pedir acceso" },
      { text: "I could use a hand with X.", functionEs: "pedir ayuda sin dramatizar" },
      { text: "I might need X later.", functionEs: "aviso preventivo" },
      {
        text: "This is a soft blocker — I can work around it for now.",
        functionEs: "bloqueo parcial",
      },
      {
        text: "It's not blocking me yet, but it will be by Thursday.",
        functionEs: "anticipar un bloqueo",
      },
      { text: "Can we take this offline?", functionEs: "proponer discutirlo después" },
    ],
    // El libro no trae tabla «Trampas del hispanohablante» en la Unidad 7.
    traps: [],
    challenges: [
      {
        id: 14,
        instructionsEs:
          "Escribe tu stand-up completo de hoy, con los tres bloques, en 6 frases. Cronométralo al leerlo: debe durar entre 25 y 40 segundos. Si dura más de un minuto, estás dando demasiado detalle — el stand-up es un titular, no un informe.",
        criteria: [
          "Contiene los tres bloques: ayer, hoy, bloqueos",
          "Tiene 6 frases",
          "Leído en voz alta dura entre 25 y 40 segundos",
          "No supera el minuto (exceso de detalle)",
        ],
        mode: "written",
      },
      {
        id: 15,
        instructionsEs:
          "Escribe tu stand-up cada día durante cinco días laborables. El viernes compáralos: verás que estás reutilizando 15 chunks. Ese es exactamente el objetivo: automatización.",
        criteria: [
          "Un stand-up escrito por día durante cinco días laborables",
          "Comparación de los cinco stand-ups el viernes",
          "Identifica unos 15 chunks reutilizados entre días",
        ],
        mode: "real-work",
      },
    ],
    scenarioTypes: ["daily_standup"],
  },
  {
    number: 8,
    title: "Comparing technologies and options",
    cefrLevel: "A2",
    scenarioEs:
      "Una reunión de decisión técnica: Postgres o MongoDB, REST o gRPC, monolito o microservicios.",
    goalEs: "Comparar, evaluar y justificar una preferencia.",
    grammarFocus: [
      "comparativos",
      "superlativos",
      "as…as",
      "than",
      "adjetivos graduables",
      "lenguaje de trade-offs",
    ],
    soundFocus:
      "-er final y than, ambos con schwa: /ər/ y /ðən/ (faster than /ˈfæstər ðən/). Enlazar than con la palabra siguiente sin pausa; con vocal plena suena entrecortado.",
    chunks: [
      { text: "The trade-off is X versus Y.", functionEs: "plantear el compromiso" },
      {
        text: "It's a trade-off between speed and simplicity.",
        functionEs: "nombrar el compromiso entre dos cualidades",
      },
      { text: "On the one hand… on the other hand…", functionEs: "presentar las dos caras" },
      { text: "The downside is… / The upside is…", functionEs: "señalar pro y contra" },
      {
        text: "The main advantage is… / The main drawback is…",
        functionEs: "ventaja y desventaja principales",
      },
      { text: "It comes at the cost of…", functionEs: "tiene el coste de" },
      {
        text: "X is fine for now, but it won't scale.",
        functionEs: "aceptar con reserva de escalabilidad",
      },
      { text: "It depends on the use case.", functionEs: "relativizar según el caso de uso" },
      { text: "In my experience…", functionEs: "anclar en autoridad propia" },
      { text: "I'd rather have X than Y.", functionEs: "expresar preferencia" },
      { text: "I'd lean towards X.", functionEs: "me inclinaría por" },
      { text: "That's a fair point.", functionEs: "conceder" },
      {
        text: "Let's revisit this if X becomes a problem.",
        functionEs: "aparcar con criterio",
      },
      { text: "It's not a blocker either way.", functionEs: "quitar presión a la decisión" },
    ],
    traps: [
      { wrong: "more easy / more simple", right: "easier / simpler" },
      { wrong: "most best", right: "the best" },
      {
        wrong: "It's simpler that the old one.",
        right: "It's simpler than the old one.",
        noteEs: "Tras un comparativo va than, no that.",
      },
      { wrong: "It's very better.", right: "It's much better." },
      { wrong: "I prefer Postgres than Mongo.", right: "I prefer Postgres to Mongo." },
      { wrong: "It's the same than before.", right: "It's the same as before." },
      { wrong: "different to", right: "different from" },
      { wrong: "He is major than me.", right: "He's older than me. / He's more senior." },
      { wrong: "It's more good.", right: "It's better." },
      {
        wrong: "as fast that possible",
        right: "as fast as possible",
        noteEs: "La estructura es as + adjetivo + as possible.",
      },
    ],
    challenges: [
      {
        id: 16,
        instructionsEs:
          "Escribe una comparación real entre dos tecnologías que uses, en 10–12 frases.",
        criteria: [
          "10–12 frases",
          "Cuatro comparativos",
          "Un superlativo",
          "Un as…as",
          "Tres modificadores de grado distintos",
          "Conclusión con «I'd lean towards…»",
        ],
        mode: "written",
      },
      {
        id: 17,
        instructionsEs:
          "Defiende en voz alta, durante 2 minutos, una decisión técnica que hayas tomado. Estructura: contexto → opciones → criterios → trade-off → decisión → cuándo la revisarías. Grábate. Esto es literalmente una pregunta de entrevista de nivel senior.",
        criteria: [
          "Duración: 2 minutos",
          "Sigue la estructura: contexto → opciones → criterios → trade-off → decisión → cuándo la revisarías",
          "Grabación realizada",
        ],
        mode: "oral",
      },
    ],
    scenarioTypes: ["tech_comparison", "design_review"],
  },
  {
    number: 9,
    title: "Estimates, plans and promises",
    cefrLevel: "A2",
    scenarioEs:
      "Sprint planning: te preguntan cuánto vas a tardar y tienes que comprometerte sin mentir.",
    goalEs:
      "Predecir, prometer, estimar y protegerte con lenguaje probabilístico.",
    grammarFocus: [
      "will",
      "going to (revisado)",
      "oraciones temporales de futuro",
      "may / might",
      "primer condicional (introducción)",
    ],
    soundFocus:
      "'ll y won't: I'll /aɪl/ es una sílaba, it'll /ˈɪtəl/ con flap. Par mínimo crítico: won't /woʊnt/ (diptongo) vs want /wɑːnt/ — confundirlos invierte el mensaje.",
    chunks: [
      { text: "Roughly / around / about three days.", functionEs: "dar una aproximación" },
      {
        text: "Three to five days.",
        functionEs: "dar un rango — la mejor respuesta a una estimación",
      },
      { text: "Best case… worst case…", functionEs: "plantear escenarios" },
      { text: "It's hard to say, but…", functionEs: "admitir incertidumbre sin evadir" },
      { text: "I'd say…", functionEs: "opinión suavizada" },
      { text: "Off the top of my head, …", functionEs: "sin haberlo pensado a fondo" },
      { text: "Don't hold me to this, but…", functionEs: "no me lo tomes como compromiso" },
      {
        text: "I'll have a better estimate once I've…",
        functionEs: "prometer precisión futura",
      },
      { text: "Assuming nothing goes wrong…", functionEs: "poner una condición implícita" },
      { text: "There's a risk that…", functionEs: "señalar riesgo" },
      { text: "That's a rough estimate.", functionEs: "marcar la estimación como aproximada" },
      { text: "Let's plan for X and flag the risk.", functionEs: "cerrar profesionalmente" },
    ],
    traps: [
      { wrong: "When I will finish…", right: "When I finish…" },
      { wrong: "If it will fail…", right: "If it fails…" },
      { wrong: "I will can…", right: "I will be able to…" },
      {
        wrong: "I won't (pronunciado /wɑːnt/)",
        right: "I won't /woʊnt/",
        noteEs: "Con /wɑːnt/ suena a want y se invierte el mensaje.",
      },
      {
        wrong: "I'm going to help you. (respondiendo a una petición)",
        right: "I'll help you.",
        noteEs: "Decisión tomada en el momento → will.",
      },
      {
        wrong: "It will take me 3 days to make it.",
        right: "It will take me 3 days to do it / to get it done.",
      },
      { wrong: "I hope to have it for Friday.", right: "I hope to have it by Friday." },
      { wrong: "Until Friday it will be ready.", right: "It'll be ready by Friday." },
      {
        wrong: "I'll inform you.",
        right: "I'll let you know.",
        noteEs: "Mucho más natural en contexto profesional.",
      },
      { wrong: "Probably it will take…", right: "It'll probably take…" },
    ],
    challenges: [
      {
        id: 18,
        instructionsEs:
          "Escribe tu respuesta real a «How long will this take?» para una tarea que tengas ahora mismo.",
        criteria: [
          "Incluye un rango",
          "Incluye un riesgo explícito",
          "Incluye una condición con if",
          "Incluye una oración temporal de futuro sin will",
          "Incluye un compromiso concreto de cuándo darás mejor información",
        ],
        mode: "written",
      },
      {
        id: 19,
        instructionsEs:
          "Reescribe la misma estimación tres veces: (a) para tu tech lead, (b) para el product owner, (c) para un cliente externo. Observa qué cambia: no la gramática, sino el grado de hedging y el nivel de detalle técnico.",
        criteria: [
          "Tres versiones de la misma estimación",
          "Audiencias: tech lead, product owner y cliente externo",
          "El grado de hedging y el nivel de detalle técnico varían entre versiones",
        ],
        mode: "written",
      },
    ],
    scenarioTypes: ["task_estimation"],
  },
  {
    number: 10,
    title: "Your experience: present perfect vs past simple",
    cefrLevel: "A2",
    scenarioEs:
      "Entrevista, 1:1 de carrera, o simplemente explicar qué has hecho antes.",
    goalEs:
      "Hablar de experiencia acumulada sin fechas, y distinguirla de hechos cerrados con fecha.",
    grammarFocus: [
      "presente perfecto",
      "for / since",
      "ever / never / just / already / yet",
      "presente perfecto continuo",
      "contraste con pasado simple",
    ],
    soundFocus:
      "Contracciones del perfecto casi inaudibles: I've /aɪv/, he's /hiːz/, I've been /aɪv bɪn/ (been átono /bɪn/). Participios con trampa fonética: read /red/, done /dʌn/, been /bɪn/, known /noʊn/.",
    chunks: [
      {
        text: "Tell me a bit about your background.",
        functionEs: "pregunta de apertura de entrevista",
      },
      {
        text: "I've been a backend developer for six years.",
        functionEs: "resumir la experiencia con su duración",
      },
      { text: "I've worked mostly with…", functionEs: "indicar tecnologías principales" },
      {
        text: "For the last two years I've been focusing on…",
        functionEs: "destacar el foco reciente",
      },
      { text: "Have you ever…?", functionEs: "preguntar por experiencia de vida" },
      { text: "I have, but not in production.", functionEs: "matizar experiencia" },
      {
        text: "I've used it in a side project.",
        functionEs: "acotar el contexto de la experiencia",
      },
      {
        text: "I haven't operated it at scale.",
        functionEs: "admitir límite con precisión",
      },
      {
        text: "I've been on the on-call rotation since 2024.",
        functionEs: "situar el inicio de una responsabilidad que continúa",
      },
      {
        text: "I've handled about fifteen incidents.",
        functionEs: "cuantificar experiencia acumulada",
      },
      {
        text: "I've never had to do that before.",
        functionEs: "señalar falta de experiencia concreta",
      },
      {
        text: "That's the first time I've seen that.",
        functionEs: "reaccionar ante algo nuevo",
      },
      { text: "We've come a long way.", functionEs: "hemos avanzado mucho" },
      { text: "So far, so good.", functionEs: "balance positivo hasta ahora" },
      { text: "I've just pushed a fix.", functionEs: "anunciar una acción muy reciente" },
      {
        text: "Has anyone looked at this yet?",
        functionEs: "preguntar si algo ya se ha atendido",
      },
    ],
    traps: [
      {
        wrong: "I work here since 2023.",
        right: "I've worked here since 2023.",
        noteEs: "Situación que continúa → presente perfecto.",
      },
      {
        wrong: "I'm working here for 3 years.",
        right: "I've been working here for 3 years.",
        noteEs: "Situación que continúa → presente perfecto.",
      },
      {
        wrong: "I have 3 years in this company.",
        right: "I've been at this company for 3 years.",
        noteEs: "«Tener años» no se traduce con have.",
      },
      {
        wrong: "Since 3 years",
        right: "For 3 years",
        noteEs: "since = punto de inicio; for = duración.",
      },
      {
        wrong: "I've deployed it yesterday.",
        right: "I deployed it yesterday.",
        noteEs: "Fecha concreta → pasado simple.",
      },
      {
        wrong: "He has joined last March.",
        right: "He joined last March.",
        noteEs: "Fecha concreta → pasado simple.",
      },
      {
        wrong: "Did you finish it already?",
        right: "Have you finished it yet?",
        noteEs: "El inglés americano informal lo permite; en escritura usa el perfecto.",
      },
      {
        wrong: "I didn't see him today.",
        right: "I haven't seen him today.",
        noteEs: "today sigue abierto.",
      },
      {
        wrong: "Have you ever went…?",
        right: "Have you ever been…?",
        noteEs: "Participio, no pasado.",
      },
      {
        wrong: "I've never been knowing…",
        right: "I've never known…",
        noteEs: "Verbo de estado → perfecto simple.",
      },
    ],
    challenges: [
      {
        id: 20,
        instructionsEs:
          "Escribe tu «background» de entrevista en 8–10 frases.",
        criteria: [
          "8–10 frases",
          "Tres presentes perfectos",
          "Dos pasados simples con fecha explícita",
          "Un for",
          "Un since",
          "Un presente perfecto continuo",
          "Una limitación admitida con honestidad (I haven't…)",
        ],
        mode: "written",
      },
      {
        id: 21,
        instructionsEs:
          "Grábate 90 segundos respondiendo «Tell me about your background.» Escúchate y cuenta cuántas veces has dicho «I work here since…» o similar. Cada aparición es una tarjeta de repaso espaciado.",
        criteria: [
          "Duración: 90 segundos",
          "Grabación y autoescucha realizadas",
          "Conteo de apariciones de «I work here since…» o similares",
        ],
        mode: "oral",
      },
      {
        id: 22,
        instructionsEs:
          "Reescribe tu perfil de LinkedIn o la sección de experiencia de tu CV aplicando la regla: descripciones de trabajos actuales en presente perfecto o presente simple; logros pasados y cerrados en pasado simple con cifras.",
        criteria: [
          "Trabajos actuales descritos en presente perfecto o presente simple",
          "Logros pasados y cerrados en pasado simple con cifras",
        ],
        mode: "real-work",
      },
    ],
    scenarioTypes: ["behavioral_qa", "tech_interview"],
  },
  {
    number: 11,
    title: "Writing instructions and documentation",
    cefrLevel: "A2",
    scenarioEs:
      "Escribes un README, los pasos de una migración, un runbook o la descripción de un PR.",
    goalEs: "Dar instrucciones claras, ordenadas y sin ambigüedad.",
    grammarFocus: [
      "imperativo",
      "secuenciadores",
      "voz pasiva (introducción)",
      "should / must / need to",
      "condicionales de instrucción",
    ],
    soundFocus:
      "Los verbos de instrucción y los conectores llevan acento en la primera sílaba del enunciado. Las comas después de First, Then, Finally son pausas reales, no decorativas; leídas de corrido el resultado suena atropellado.",
    chunks: [
      {
        text: "First, … / To begin, … / Start by + -ing",
        functionEs: "abrir una secuencia de pasos",
      },
      {
        text: "Then, … / Next, … / After that, … / Once that's done, …",
        functionEs: "continuar la secuencia",
      },
      {
        text: "While that runs, … / Meanwhile, … / At the same time, …",
        functionEs: "indicar simultaneidad",
      },
      {
        text: "Before you + verbo / Prior to + -ing",
        functionEs: "marcar precedencia",
      },
      {
        text: "After you + verbo / Once you've + participio, …",
        functionEs: "marcar posterioridad",
      },
      { text: "Finally, … / Lastly, … / To finish, …", functionEs: "cerrar la secuencia" },
      {
        text: "Note that… / Be aware that… / Make sure… / Bear in mind that…",
        functionEs: "advertir",
      },
      {
        text: "Alternatively, … / Otherwise, … / Instead, …",
        functionEs: "ofrecer una alternativa",
      },
      {
        text: "Before you start, make sure you have Docker 24+ and Node 20 installed.",
        functionEs: "declarar requisitos previos",
      },
      { text: "Do not commit this file.", functionEs: "prohibición en documentación" },
      {
        text: "Once the containers are healthy, run the migrations.",
        functionEs: "encadenar un paso a una condición",
      },
      {
        text: "The most common cause is a port conflict.",
        functionEs: "orientar el troubleshooting hacia la causa habitual",
      },
      {
        text: "This can take up to two minutes, so be patient.",
        functionEs: "gestionar expectativas de tiempo",
      },
      {
        text: "If you get stuck, ping #team-payments on Slack.",
        functionEs: "ofrecer un canal de ayuda",
      },
    ],
    traps: [
      // Trampas de conectores muy frecuentes (sección 3)
      {
        wrong: "At the end, run the tests.",
        right: "Finally, run the tests.",
        noteEs: "at the end = al final físico de algo.",
      },
      {
        wrong: "Actually, run npm install.",
        right: "First, run npm install.",
        noteEs: "actually = «en realidad».",
      },
      { wrong: "In the other hand", right: "On the other hand" },
      { wrong: "For finish", right: "To finish / Finally" },
      {
        wrong: "After to run it",
        right: "After running it / After you run it",
        noteEs: "Tras preposición → -ing.",
      },
      { wrong: "Before to deploy", right: "Before deploying / Before you deploy" },
      { wrong: "Make sure to have Docker", right: "Make sure you have Docker" },
      { wrong: "Take in account", right: "Take into account / Bear in mind" },
      // Trampas del hispanohablante (sección 10)
      { wrong: "For install it, run npm i.", right: "To install it, run npm i." },
      {
        wrong: "Is necessary to restart.",
        right: "You need to restart. / It's necessary to restart.",
      },
      { wrong: "Please to run the tests.", right: "Run the tests. / Please run the tests." },
      { wrong: "Depending of the config", right: "Depending on the config" },
      {
        wrong: "In case of the test fails",
        right: "In case the test fails / If the test fails",
      },
      {
        wrong: "Explain me how it works.",
        right: "Explain to me how it works. / Explain how it works.",
      },
      {
        wrong: "Advice (usado como verbo)",
        right: "advise /ədˈvaɪz/ es el verbo; advice /ədˈvaɪs/ el sustantivo",
      },
      { wrong: "Note that the token expire.", right: "Note that the token expires." },
      {
        wrong: "Realize the migration",
        right: "Run / perform / carry out the migration",
        noteEs: "realize = darse cuenta.",
      },
      {
        wrong: "Assist to the meeting",
        right: "Attend the meeting",
        noteEs: "assist = ayudar.",
      },
    ],
    challenges: [
      {
        id: 23,
        instructionsEs:
          "Escribe el README de configuración local de tu proyecto real, en inglés, con cuatro secciones: Prerequisites, Steps (mínimo cinco pasos numerados en imperativo), Troubleshooting (dos problemas con causa y solución), Notes.",
        criteria: [
          "Sección Prerequisites",
          "Sección Steps con mínimo cinco pasos numerados en imperativo",
          "Sección Troubleshooting con dos problemas, cada uno con causa y solución",
          "Sección Notes",
        ],
        mode: "real-work",
      },
      {
        id: 24,
        instructionsEs:
          "Escribe la descripción de tu último pull request con la plantilla: What — qué cambia (una frase en presente simple). Why — por qué (una o dos frases; enlaza el ticket). How — enfoque técnico (2–3 frases). Testing — qué has probado y cómo. Risks / rollback — qué puede salir mal y cómo revertirlo.",
        criteria: [
          "What: qué cambia, en una frase en presente simple",
          "Why: una o dos frases, con enlace al ticket",
          "How: enfoque técnico en 2–3 frases",
          "Testing: qué has probado y cómo",
          "Risks / rollback: qué puede salir mal y cómo revertirlo",
        ],
        mode: "real-work",
      },
    ],
    // `oncall_handover`: un traspaso es instruir qué vigilar y cuándo escalar.
    scenarioTypes: ["documentation_workshop", "oncall_handover"],
  },
  {
    number: 12,
    title: "Narrating a bug: what was happening when it broke",
    cefrLevel: "A2",
    scenarioEs:
      "Explicas a tu equipo qué estaba pasando cuando el sistema falló.",
    goalEs:
      "Narrar con fondo y primer plano; contrastar cómo eran las cosas antes.",
    grammarFocus: ["pasado continuo", "when / while", "used to / would", "There was/were"],
    soundFocus:
      "Formas débiles de was /wəz/ y were /wər/ en narración fluida. Los negativos nunca se reducen (wasn't, weren't, didn't, won't): escucha la fuerza de la sílaba, no la /t/ final.",
    chunks: [
      { text: "So what happened exactly?", functionEs: "abrir la investigación" },
      {
        text: "We were running X when Y happened.",
        functionEs: "estructura narrativa central",
      },
      { text: "While it was running, …", functionEs: "situar una acción de fondo" },
      { text: "At the same time, …", functionEs: "marcar simultaneidad" },
      { text: "That's the thing.", functionEs: "ahí está la clave" },
      { text: "By the time I checked, …", functionEs: "cuando llegué a mirar" },
      { text: "I wasn't looking at the dashboards.", functionEs: "admitir" },
      { text: "A customer complained.", functionEs: "señalar cómo se detectó el problema" },
      { text: "It turned out that…", functionEs: "resultó que" },
      {
        text: "We used to have an alert for that.",
        functionEs: "contrastar con cómo eran las cosas antes",
      },
      {
        text: "It was removed because it was too noisy.",
        functionEs: "explicar un cambio pasado sin culpar a nadie",
      },
      { text: "That's my read too.", functionEs: "coincido en la interpretación" },
      { text: "It's been happening intermittently.", functionEs: "describir un fallo intermitente" },
      { text: "We got lucky.", functionEs: "tuvimos suerte" },
      { text: "It could have been much worse.", functionEs: "relativizar el impacto" },
    ],
    traps: [
      {
        wrong: "I was checking when it was crashing.",
        right: "I was checking when it crashed.",
      },
      { wrong: "We used to had", right: "We used to have" },
      { wrong: "Did you used to…?", right: "Did you use to…?" },
      {
        wrong: "I use to work late. (hábito presente)",
        right: "I usually work late.",
        noteEs: "No existe «I use to» en presente; usa usually.",
      },
      { wrong: "While I debugged", right: "While I was debugging" },
      {
        wrong: "It was passing something strange.",
        right: "Something strange was happening.",
      },
      { wrong: "I was agreeing with him.", right: "I agreed with him." },
      { wrong: "Nobody didn't notice.", right: "Nobody noticed." },
      { wrong: "It failed all the time yesterday.", right: "It kept failing yesterday." },
      {
        wrong: "The customer complained about that it was slow.",
        right: "The customer complained that it was slow.",
      },
    ],
    challenges: [
      {
        id: 25,
        instructionsEs:
          "Narra un incidente real que hayas vivido, en 10–12 frases.",
        criteria: [
          "10–12 frases",
          "Tres pasados continuos",
          "Dos when y un while",
          "Un used to",
          "Tres términos de la tabla de vocabulario de incidentes",
          "Conclusión sobre la causa raíz",
        ],
        mode: "written",
      },
      {
        id: 26,
        instructionsEs:
          "Cuenta ese incidente en voz alta, durante 2 minutos, como si estuvieras en la reunión de postmortem. Estructura: what happened → timeline → impact → root cause → what we're doing about it. Esta habilidad se evalúa explícitamente en entrevistas de nivel senior y SRE.",
        criteria: [
          "Duración: 2 minutos",
          "Sigue la estructura: what happened → timeline → impact → root cause → what we're doing about it",
        ],
        mode: "oral",
      },
    ],
    scenarioTypes: ["bug_triage", "incident_postmortem"],
  },
];

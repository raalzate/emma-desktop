import type { CurriculumUnit } from "@/domain/curriculum/unit";

// Unidades 1-6 (nivel A1) transcritas del libro «English for Software Engineers».
// Contenido fiel a la fuente: chunks, trampas y retos provienen de cada unidad.
export const UNITS_A1: CurriculumUnit[] = [
  {
    number: 1,
    title: "Introducing yourself to the team",
    cefrLevel: "A1",
    scenarioEs:
      "Primer día en un equipo distribuido; te presentas en la reunión de bienvenida y en el canal de Slack. En la videollamada hay siete personas de cinco países y el engineering manager te invita a empezar la ronda de presentaciones.",
    goalEs: "Decir quién eres, qué haces, dónde estás y desde cuándo.",
    grammarFocus: [
      "Verbo to be (ser y estar a la vez)",
      "Pronombres personales y contracciones",
      "Negación con not después del verbo",
      "Preguntas por inversión (sin auxiliar)",
      "Respuestas cortas repitiendo el auxiliar (Yes, I am — nunca Yes, I'm)",
      "Preguntas wh- con be (what/where/who/why/when/how)",
    ],
    soundFocus:
      "Las contracciones: I'm /aɪm/, you're /jʊr/, he's /hiːz/ acaban en una sílaba; isn't lleva /z/; they're empieza con /ð/. Los nativos contraen casi siempre en habla.",
    chunks: [
      { text: "Hi everyone, I'm…", functionEs: "apertura estándar en reunión" },
      { text: "I'm a backend developer.", functionEs: "decir tu rol" },
      {
        text: "I'm based in [city].",
        functionEs: "ubicación (más profesional que I live in)",
      },
      {
        text: "I'm on the [X] team.",
        functionEs: "pertenencia a equipo — on, no in",
      },
      { text: "I'm new here.", functionEs: "presentarte como recién llegado" },
      { text: "Nice to meet you.", functionEs: "primera vez, siempre" },
      { text: "Nice to meet you too.", functionEs: "respuesta al saludo" },
      { text: "Good to be here.", functionEs: "cierre cálido" },
      {
        text: "I'm five hours ahead / behind.",
        functionEs: "hablar de zonas horarias",
      },
      { text: "I'm not sure.", functionEs: "tu frase más útil del primer mes" },
      {
        text: "Sorry, could you repeat that?",
        functionEs: "la segunda frase más útil: pedir repetición",
      },
      { text: "Sorry, you're breaking up.", functionEs: "avisar de mala conexión" },
      { text: "Can you hear me?", functionEs: "comprobar el audio en la llamada" },
      { text: "I'm on mute, sorry.", functionEs: "disculparte por el micrófono" },
    ],
    traps: [
      {
        wrong: "Is broken.",
        right: "It's broken.",
        noteEs: "el español omite el sujeto; el inglés no puede",
      },
      {
        wrong: "I'm developer.",
        right: "I'm a developer.",
        noteEs: "el español no usa artículo con profesiones",
      },
      {
        wrong: "I have 30 years.",
        right: "I am 30 years old.",
        noteEs: "«tener años» → to be",
      },
      {
        wrong: "I'm in the payments team.",
        right: "I'm on the payments team.",
        noteEs: "preposición fija",
      },
      {
        wrong: "I'm agree.",
        right: "I agree.",
        noteEs: "agree es verbo, no adjetivo",
      },
      {
        wrong: "Yes, I'm.",
        right: "Yes, I am.",
        noteEs: "no se contrae en respuesta corta afirmativa",
      },
      {
        wrong: "Where you are from?",
        right: "Where are you from?",
        noteEs: "falta inversión",
      },
      {
        wrong: "He no is here.",
        right: "He isn't here.",
        noteEs: "no ≠ not",
      },
      {
        wrong: "I'm boring. (= soy aburrido)",
        right: "I'm bored. (= estoy aburrido)",
        noteEs: "-ing describe la causa, -ed el sentimiento",
      },
      {
        wrong: "Actually I'm working on X.",
        right: "Currently / Right now I'm working on X.",
        noteEs: "actually = «en realidad», no «actualmente»",
      },
    ],
    challenges: [
      {
        id: 1,
        instructionsEs:
          "Escribe tu presentación real de 5 frases usando exclusivamente estructuras de esta unidad. Luego grábala, transcríbela con reconocimiento de voz y comprueba que la máquina entiende tu rol y tu ciudad. Repite hasta que acierte.",
        criteria: [
          "5 frases",
          "Incluye tu nombre",
          "Incluye tu rol",
          "Incluye tu ubicación",
          "Incluye tu equipo",
          "Incluye una frase de cierre",
          "El reconocimiento de voz entiende tu rol y tu ciudad",
        ],
        mode: "oral",
      },
      {
        id: 2,
        instructionsEs:
          "Escribe tu mensaje de presentación en el canal de Slack. Registro escrito, algo más largo. Plantilla mental: saludo → rol → ubicación → sobre qué vas a trabajar → una nota personal → apertura.",
        criteria: [
          "60–80 palabras",
          "Sigue la plantilla: saludo, rol, ubicación, sobre qué vas a trabajar, nota personal y apertura",
        ],
        mode: "written",
      },
    ],
    scenarioTypes: ["intro_yourself", "meeting_intro", "conference_intro"],
  },
  {
    number: 2,
    title: "Your stack and your working day",
    cefrLevel: "A1",
    scenarioEs:
      "Un compañero nuevo (tu onboarding buddy) te pregunta cómo funciona el equipo, qué tecnologías usáis y cómo es tu día. Todo lo que digas será una verdad general o un hábito: territorio del presente simple.",
    goalEs: "Describir rutinas, hábitos, hechos permanentes y responsabilidades.",
    grammarFocus: [
      "Presente simple para hechos permanentes, rutinas y estados",
      "La -s de tercera persona y sus reglas de escritura",
      "Auxiliar do/does en negativo e interrogativo (la -s solo una vez)",
      "Who como sujeto sin auxiliar (Who reviews the PRs?)",
      "Adverbios de frecuencia y su posición (antes del verbo, después de to be)",
    ],
    soundFocus:
      "La -s de tercera persona: /z/ (runs), /s/ (works), /ɪz/ (pushes). does es /dʌz/ y no rima con goes; don't es /doʊnt/ con diptongo.",
    chunks: [
      {
        text: "What does a normal day look like?",
        functionEs: "preguntar por la rutina",
      },
      { text: "How does X work?", functionEs: "pedir explicación de un sistema" },
      {
        text: "We use X for Y.",
        functionEs: "describir el stack: We use Redis for caching.",
      },
      { text: "It runs on X.", functionEs: "plataforma: It runs on Node." },
      { text: "We deploy twice a week.", functionEs: "expresar frecuencia" },
      {
        text: "It depends on…",
        functionEs: "tu respuesta más frecuente (/dɪˈpendz ɑːn/)",
      },
      {
        text: "That makes sense.",
        functionEs: "«tiene sentido» — señal de comprensión",
      },
      { text: "I'm responsible for…", functionEs: "tus responsabilidades" },
      { text: "I take care of…", functionEs: "me encargo de" },
      { text: "It's up to you.", functionEs: "tú decides" },
      { text: "How often do you…?", functionEs: "preguntar frecuencia" },
      { text: "Who owns this service?", functionEs: "preguntar quién es responsable" },
      {
        text: "It usually takes about X minutes.",
        functionEs: "duración habitual",
      },
    ],
    traps: [
      {
        wrong: "Does it works?",
        right: "Does it work?",
        noteEs: "la -s solo una vez",
      },
      { wrong: "He don't know.", right: "He doesn't know." },
      { wrong: "I no understand.", right: "I don't understand." },
      {
        wrong: "Why you don't deploy?",
        right: "Why don't you deploy?",
        noteEs: "inversión",
      },
      { wrong: "How much often…?", right: "How often…?" },
      {
        wrong: "I have 5 years working here.",
        right: "I have been working here for 5 years.",
        noteEs: "ver Unidad 10",
      },
      {
        wrong: "Depends of the size.",
        right: "It depends on the size.",
        noteEs: "sujeto obligatorio + preposición on",
      },
      {
        wrong: "We are deploy every week.",
        right: "We deploy every week.",
        noteEs: "no mezclar be con presente simple",
      },
      {
        wrong: "All the team join.",
        right: "The whole team joins / All the team members join.",
      },
      {
        wrong: "Everybody know it.",
        right: "Everybody knows it.",
        noteEs: "everybody es singular",
      },
      {
        wrong: "The people is ready.",
        right: "The people are ready.",
        noteEs: "people es plural",
      },
      {
        wrong: "I'm working here since 2020.",
        right: "I've been working here since 2020.",
        noteEs: "ver Unidad 10",
      },
    ],
    challenges: [
      {
        id: 3,
        instructionsEs:
          "Escribe 8–10 frases describiendo tu stack real y tu rutina.",
        criteria: [
          "8–10 frases",
          "Al menos tres verbos en tercera persona",
          "Dos adverbios de frecuencia",
          "Una negación con doesn't",
          "Una pregunta con does",
        ],
        mode: "written",
      },
      {
        id: 4,
        instructionsEs:
          "Oral, 60 segundos. Grábate respondiendo: \"What does a normal day look like for you?\" Cronométralo. Si dura menos de 45 segundos, añade detalles hasta llegar al minuto. Cuenta cuántas veces te comes la -s de tercera persona.",
        criteria: [
          "Duración de al menos 60 segundos (mínimo 45, añade detalles hasta el minuto)",
          "Contar las veces que falta la -s de tercera persona",
        ],
        mode: "oral",
      },
    ],
    scenarioTypes: ["coffee_break", "lunch_chat"],
  },
  {
    number: 3,
    title: "Your environment: what exists and where",
    cefrLevel: "A1",
    scenarioEs:
      "Describes la arquitectura del sistema y tu entorno de trabajo a alguien que acaba de llegar: servicios principales, bases de datos, tráfico, tests y dónde vive la configuración.",
    goalEs: "Decir qué hay, cuánto hay y dónde está.",
    grammarFocus: [
      "there is / there are (conjuga según el número de lo que sigue)",
      "Artículos a/an/the y cuándo el inglés no usa artículo",
      "Plurales regulares e irregulares (people, criteria, indices…)",
      "Contables e incontables (information, feedback, advice…)",
      "Cuantificadores: many/much, a few/few, a little/little, some/any",
      "Preposiciones de lugar: in, on, at, under, between, within…",
    ],
    soundFocus:
      "there /ðer/, their /ðer/ y they're /ðer/ se pronuncian igual; contraste con the /ðə/ y práctica de /ð/ con /ɪ/-/iː/ (this/these). There's se contrae en habla incluso ante plurales, pero se escribe there are.",
    chunks: [
      {
        text: "Let me give you an overview.",
        functionEs: "abrir una explicación",
      },
      {
        text: "There are three main components.",
        functionEs: "enumerar arquitectura",
      },
      {
        text: "There isn't a shared database.",
        functionEs: "negar existencia",
      },
      { text: "How much traffic is there?", functionEs: "preguntar volumen" },
      { text: "Are there any tests?", functionEs: "preguntar existencia en plural" },
      { text: "It's under `config/`.", functionEs: "ubicación en el repo" },
      {
        text: "at peak / under load",
        functionEs: "describir condiciones del sistema",
      },
      { text: "requests per second (RPS)", functionEs: "métrica de tráfico" },
      {
        text: "That was a deliberate decision.",
        functionEs: "justificar una decisión de diseño",
      },
      {
        text: "It's a bit of a mess, to be honest.",
        functionEs: "admitir deuda técnica",
      },
      {
        text: "There's room for improvement.",
        functionEs: "eufemismo profesional",
      },
    ],
    traps: [
      {
        wrong: "Have three services in production.",
        right: "There are three services in production.",
        noteEs: "«hay» = there is/are; have expresa posesión, no existencia",
      },
      {
        wrong: "There is many bugs.",
        right: "There are many bugs.",
        noteEs: "there is/are concuerda con lo que sigue",
      },
      {
        wrong: "an user / an URL",
        right: "a user / a URL",
        noteEs: "a/an depende del sonido, no de la letra (/juː/ es consonántico)",
      },
      {
        wrong: "There are a lot of informations in the logs.",
        right: "There is a lot of information in the logs.",
        noteEs: "information es incontable",
      },
      {
        wrong: "I have three feedbacks for you.",
        right: "I have some feedback for you.",
        noteEs: "feedback es incontable",
      },
      {
        wrong: "I need an advice.",
        right: "I need some advice / a piece of advice.",
        noteEs: "advice es incontable",
      },
      {
        wrong: "The people is waiting.",
        right: "The people are waiting.",
        noteEs: "people es plural",
      },
      {
        wrong: "It's in the main branch.",
        right: "It's on the main branch.",
        noteEs: "combinación fija: on the branch",
      },
      {
        wrong: "We use the Python.",
        right: "We use Python.",
        noteEs: "lenguajes y tecnologías sin artículo",
      },
      {
        wrong: "The data are corrupted.",
        right: "The data is corrupted.",
        noteEs: "data se usa hoy como incontable",
      },
    ],
    challenges: [
      {
        id: 5,
        instructionsEs:
          "Escribe una descripción de la arquitectura de tu sistema real en 10–12 frases.",
        criteria: [
          "10–12 frases",
          "Cuatro usos de there is/are",
          "Tres cuantificadores distintos",
          "Cinco preposiciones distintas",
          "Al menos un incontable usado correctamente",
        ],
        mode: "written",
      },
      {
        id: 6,
        instructionsEs:
          "Oral. Explica esa arquitectura en voz alta en 90 segundos, sin leer, como si un compañero nuevo acabara de entrar. Grábate. Cuenta cuántas veces dices \"there is\" con un plural detrás.",
        criteria: [
          "90 segundos sin leer",
          "Contar las veces que dices there is con un plural detrás",
        ],
        mode: "oral",
      },
    ],
    scenarioTypes: ["system_walkthrough", "ask_for_help"],
  },
  {
    number: 4,
    title: "What are you working on right now?",
    cefrLevel: "A1",
    scenarioEs:
      "Te preguntan tu estado actual en Slack, en un 1:1 o en el stand-up: en qué trabajas, qué te bloquea y qué está pasando ahora mismo.",
    goalEs: "Distinguir lo que haces siempre de lo que estás haciendo ahora.",
    grammarFocus: [
      "Presente continuo: to be + verbo-ing",
      "Reglas de escritura de -ing (writing, running, committing…)",
      "Cuatro usos: ahora mismo, proyecto temporal, tendencia, plan futuro acordado",
      "Contraste presente simple vs continuo (permanente vs temporal)",
      "Verbos de estado que no usan continuo (know, want, depend…)",
      "Excepciones con cambio de significado (think, have, look, see)",
    ],
    soundFocus:
      "La terminación -ing → /ɪŋ/: sin pronunciar la /ɡ/ final y con /ɪ/ corta, no /iː/. En habla informal se reduce a /ɪn/ (workin'): reconócelo, no lo imites al escribir.",
    chunks: [
      { text: "What are you working on?", functionEs: "pregunta estándar" },
      { text: "I'm working on…", functionEs: "tu respuesta estándar" },
      { text: "I'm looking into it.", functionEs: "lo estoy investigando" },
      { text: "I'm on it.", functionEs: "me pongo con ello (muy usado)" },
      { text: "I'm still waiting for…", functionEs: "expresar un bloqueo" },
      {
        text: "It's taking longer than expected.",
        functionEs: "comunicar un retraso",
      },
      {
        text: "I'm making progress. / Some progress.",
        functionEs: "comunicar avance",
      },
      { text: "I'm stuck on…", functionEs: "decir que estás atascado" },
      { text: "as we speak", functionEs: "mientras hablamos" },
      {
        text: "at the moment / right now / currently",
        functionEs: "marcar el ahora",
      },
      { text: "It's getting worse / better.", functionEs: "describir tendencia" },
      { text: "Nothing's moving until…", functionEs: "bloqueo total" },
      { text: "I'm about to…", functionEs: "estoy a punto de" },
      { text: "I'm halfway through it.", functionEs: "voy por la mitad" },
      { text: "Bear with me.", functionEs: "ten paciencia un momento" },
    ],
    traps: [
      { wrong: "I'm not agree.", right: "I don't agree / I disagree." },
      { wrong: "I am agree.", right: "I agree." },
      {
        wrong: "What are you doing tomorrow? — I go to the office.",
        right: "I'm going to the office.",
        noteEs: "plan futuro acordado → presente continuo",
      },
      {
        wrong: "He is working here since 2020.",
        right: "He has been working here since 2020.",
        noteEs: "ver Unidad 10",
      },
      {
        wrong: "I'm having 3 meetings today.",
        right: "I have three meetings today.",
        noteEs: "have de posesión no usa continuo",
      },
      {
        wrong: "Actually I'm working on X.",
        right: "Currently I'm working on X.",
        noteEs: "actually = «en realidad», no «actualmente»",
      },
      {
        wrong: "It's depending on you.",
        right: "It depends on you.",
        noteEs: "depend es verbo de estado",
      },
      {
        wrong: "I'm thinking that is wrong.",
        right: "I think it's wrong.",
        noteEs: "think (= opinar) no usa continuo",
      },
    ],
    challenges: [
      {
        id: 7,
        instructionsEs:
          "Escribe tu actualización de estado real para hoy en 4 frases: qué estás haciendo, qué te bloquea, quién te está ayudando y qué es lo siguiente.",
        criteria: [
          "4 frases: qué haces, qué te bloquea, quién te ayuda y qué es lo siguiente",
          "Presente continuo al menos tres veces",
          "Un verbo de estado en presente simple",
        ],
        mode: "written",
      },
      {
        id: 8,
        instructionsEs:
          "Escribe la misma actualización dos veces: (a) para Slack, informal y breve; (b) para un 1:1 con tu manager, más completa. Nota cómo cambia el registro sin cambiar la gramática.",
        criteria: [
          "Versión (a) para Slack: informal y breve",
          "Versión (b) para 1:1 con tu manager: más completa",
        ],
        mode: "written",
      },
    ],
    // `slack_status_update`: el estado asíncrono es justo presente continuo.
    scenarioTypes: ["morning_greeting", "slack_thread", "slack_status_update", "daily_standup"],
  },
  {
    number: 5,
    title: "Asking for things without sounding rude",
    cefrLevel: "A1",
    scenarioEs:
      "Pides una revisión de código, acceso a un sistema, ayuda con un bug, o cinco minutos del tiempo de alguien. En inglés la cortesía se transmite con estructura gramatical: traducir «Revisa mi PR» literalmente es dar una orden.",
    goalEs: "Pedir, ofrecer y dar permiso con el nivel de cortesía adecuado.",
    grammarFocus: [
      "Modales can/could/would/may/will/should/must: sin -s, sin to, sin do",
      "La escala de cortesía: could por defecto; nunca imperativo con personas",
      "would you mind + -ing (y su respuesta afirmativa negativa: No, not at all)",
      "Pedir permiso: Can/Could/May I, Is it OK if I, Do you mind if I",
      "Ofrecer y proponer: Do you want me to, let's, why don't we, shall we",
      "Aceptar, rechazar con cortesía y responder al agradecimiento",
    ],
    soundFocus:
      "Los modales se reducen en habla real: could you /ˈkʊdʒə/, would you /ˈwʊdʒə/, do you want to → \"d'ya wanna\". can débil /kən/ vs can't tónica /kænt/: si oyes la vocal clara, es negativo.",
    chunks: [
      { text: "Do you have a minute?", functionEs: "abrir una petición" },
      { text: "What's up?", functionEs: "respuesta informal" },
      { text: "when you get a chance", functionEs: "quitar urgencia" },
      { text: "no rush / no pressure", functionEs: "quitar urgencia" },
      {
        text: "Could you do me a favour?",
        functionEs: "pedir un favor (favour UK / favor US)",
      },
      { text: "Would you mind taking a look?", functionEs: "petición muy cortés" },
      {
        text: "Do you want to jump on a quick call?",
        functionEs: "proponer una llamada rápida",
      },
      { text: "Can I share my screen?", functionEs: "pedir permiso en la llamada" },
      {
        text: "Let's take this offline.",
        functionEs: "seguir la conversación fuera de la reunión",
      },
      { text: "I'm a bit swamped.", functionEs: "estoy desbordado" },
      { text: "I'll get to it this afternoon.", functionEs: "me pondré con ello" },
      { text: "Consider it done.", functionEs: "dalo por hecho" },
      { text: "Feel free to…", functionEs: "siéntete libre de" },
      { text: "Let me know if…", functionEs: "avísame si" },
      { text: "Sorry to bother you, but…", functionEs: "perdona que te moleste" },
      {
        text: "Thanks for the quick turnaround.",
        functionEs: "agradecer la rapidez",
      },
    ],
    traps: [
      {
        wrong: "Please review my PR.",
        right: "Could you review my PR?",
        noteEs: "please + imperativo sigue siendo orden",
      },
      {
        wrong: "Can you to help?",
        right: "Can you help?",
        noteEs: "modal + infinitivo sin to",
      },
      {
        wrong: "Would you mind to explain?",
        right: "Would you mind explaining?",
        noteEs: "mind + -ing",
      },
      { wrong: "He can helps.", right: "He can help." },
      {
        wrong: "I hope you can help me. (en frío)",
        right: "I'd really appreciate your help with…",
        noteEs: "la traducción literal suena a súplica",
      },
      {
        wrong: "I need that you review this.",
        right: "I need you to review this.",
      },
      {
        wrong: "It's necessary that you add a test.",
        right: "You should add a test.",
        noteEs: "el español legaliza; el inglés aconseja",
      },
      {
        wrong: "Tell me if you have doubts.",
        right: "Let me know if you have any questions.",
        noteEs: "doubt = duda escéptica, no pregunta",
      },
      {
        wrong: "I wait your response.",
        right: "I look forward to hearing from you. / Let me know.",
      },
      {
        wrong: "Excuse me, can I make a question?",
        right: "Can I ask a question?",
        noteEs: "ask, no make",
      },
    ],
    challenges: [
      {
        id: 9,
        instructionsEs:
          "Escribe tres mensajes de Slack reales: (a) pedir a un compañero cercano que revise un PR pequeño; (b) pedir a un ingeniero senior de otro equipo que te explique un sistema que no entiendes; (c) rechazar con cortesía una petición porque estás desbordado.",
        criteria: [
          "Tres mensajes: revisión a compañero cercano, explicación a senior de otro equipo, rechazo cortés",
          "Cada uno usa una estructura de cortesía distinta",
        ],
        mode: "written",
      },
      {
        id: 10,
        instructionsEs:
          "Coge los tres últimos mensajes que hayas escrito en inglés en el trabajo. Reescríbelos subiendo un nivel en la escala de cortesía. Compara.",
        criteria: [
          "Tres mensajes reales reescritos",
          "Cada uno sube un nivel en la escala de cortesía",
        ],
        mode: "real-work",
      },
    ],
    scenarioTypes: ["ask_for_help", "vacation_request"],
  },
  {
    number: 6,
    title: "What did you do yesterday?",
    cefrLevel: "A1",
    scenarioEs:
      "El stand-up diario: la primera pregunta es siempre sobre ayer. Cuentas qué terminaste, qué falló, qué revisaron y qué pasó con el incidente.",
    goalEs: "Narrar acciones terminadas en el pasado.",
    grammarFocus: [
      "Pasado simple regular (-ed) y sus reglas de escritura",
      "Los verbos irregulares esenciales (was/were, did, went, wrote, ran…)",
      "did/didn't + infinitivo: el pasado se marca una sola vez",
      "was/were niega e interroga sin did",
      "Who como sujeto sin did (Who deleted the index?)",
      "Expresiones de tiempo pasado: yesterday, last week, X ago (ago va después)",
    ],
    soundFocus:
      "La triple pronunciación de -ed: /t/ (fixed), /d/ (deployed), /ɪd/ (updated). Irregulares con trampa fonética: read (pasado) /red/, said /sed/, meant /ment/; caught, brought, thought y bought riman en /ɔːt/.",
    chunks: [
      { text: "Yesterday I finished…", functionEs: "apertura de stand-up" },
      { text: "I picked up the ticket for…", functionEs: "cogí la tarea de" },
      { text: "I opened a PR for…", functionEs: "informar de un PR abierto" },
      {
        text: "Tom left a couple of comments.",
        functionEs: "informar de comentarios en la revisión",
      },
      { text: "I addressed the comments.", functionEs: "resolví los comentarios" },
      { text: "It failed / It passed.", functionEs: "resultado de tests o builds" },
      { text: "I didn't have time to…", functionEs: "explicar lo que no hiciste" },
      { text: "I didn't get to it.", functionEs: "no llegué a hacerlo" },
      {
        text: "I got pulled into an incident.",
        functionEs: "me metieron en un incidente",
      },
      { text: "It took about two hours.", functionEs: "informar de la duración" },
      { text: "I dug into the logs.", functionEs: "investigar a fondo (dig → dug)" },
      { text: "I couldn't reproduce it.", functionEs: "no pude reproducirlo" },
      { text: "I ended up rewriting it.", functionEs: "acabé reescribiéndolo" },
      {
        text: "It turned out to be a config issue.",
        functionEs: "resultó ser",
      },
      { text: "That's a good point.", functionEs: "reconocer una observación" },
      { text: "by mistake / by accident", functionEs: "sin querer" },
    ],
    traps: [
      {
        wrong: "Did you finished?",
        right: "Did you finish?",
        noteEs: "el pasado solo se marca una vez",
      },
      { wrong: "I didn't saw it.", right: "I didn't see it." },
      {
        wrong: "Yesterday I have deployed.",
        right: "Yesterday I deployed.",
        noteEs: "con tiempo pasado explícito → pasado simple",
      },
      { wrong: "It taked / It costed", right: "It took / It cost" },
      {
        wrong: "The team were / was?",
        right: "Ambos válidos: the team was [US] / were [UK]",
      },
      {
        wrong: "I was working there 3 years.",
        right: "I worked there for 3 years.",
      },
      {
        wrong: "When I have arrived, it was broken.",
        right: "When I arrived, it was broken.",
      },
      {
        wrong: "He said me that…",
        right: "He told me that… / He said that…",
        noteEs: "say no lleva objeto de persona directo",
      },
      {
        wrong: "I explained him the bug.",
        right: "I explained the bug to him.",
      },
      {
        wrong: "We discussed about it.",
        right: "We discussed it.",
        noteEs: "discuss no lleva preposición",
      },
    ],
    challenges: [
      {
        id: 11,
        instructionsEs:
          "Escribe tu stand-up real de ayer en 5–7 frases, todo en pasado simple.",
        criteria: [
          "5–7 frases en pasado simple",
          "Tres verbos irregulares",
          "Una negación con didn't",
          "Una expresión de tiempo con ago",
        ],
        mode: "written",
      },
      {
        id: 12,
        instructionsEs:
          "Oral, 45 segundos. Grábate diciéndolo. Después escucha solo las terminaciones -ed: comprueba que distingues /t/, /d/ e /ɪd/. Es el ejercicio de práctica deliberada más rentable de todo el nivel A1.",
        criteria: [
          "45 segundos grabados",
          "Distinguir /t/, /d/ e /ɪd/ en las terminaciones -ed al escucharte",
        ],
        mode: "oral",
      },
      {
        id: 13,
        instructionsEs:
          "Escribe un mini-postmortem de un incidente real que hayas vivido, en 8 frases y solo con pasado simple: qué pasó, cuándo, qué hicisteis, cuánto tardó, qué aprendisteis.",
        criteria: [
          "8 frases",
          "Solo pasado simple",
          "Cubre: qué pasó, cuándo, qué hicisteis, cuánto tardó y qué aprendisteis",
        ],
        mode: "written",
      },
    ],
    scenarioTypes: ["daily_standup"],
  },
];

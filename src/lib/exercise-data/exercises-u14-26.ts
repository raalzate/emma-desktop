/**
 * Ejercicios cerrados (paso Practice) de las Unidades 14–26 del libro fuente,
 * cruzados con el solucionario del Apéndice I. Transcripción fiel: los stems
 * vienen de la sección Practice de cada unidad y las respuestas del Apéndice I.
 * Variantes separadas por "/" en el solucionario van en `altAnswers`; las
 * respuestas marcadas "(modelo)" llevan noteEs indicándolo.
 */

import type { UnitExercise } from "@/domain/exercises/exercise";

const MODELO = "respuesta modelo; variantes naturales válidas";

export const EXERCISES_U14_26: UnitExercise[] = [
  // ────────────────────────── UNIT 14 ──────────────────────────
  {
    id: "14A",
    unit: 14,
    kind: "fill",
    promptEs: "Completa con pasado simple o pasado perfecto.",
    items: [
      {
        stem: "By the time he ____ (be) paged, the error rate ____ (already reach) 40%.",
        answer: "was, had already reached",
      },
      {
        stem: "The leak ____ (be introduced) three weeks earlier, in release 4.12.",
        answer: "had been introduced",
      },
      {
        stem: "It ____ (not cause) problems before because traffic ____ (be) low.",
        answer: "hadn't caused, was",
      },
      {
        stem: "When I ____ (check) the dashboard, it ____ (already recover).",
        answer: "checked, had already recovered",
      },
      {
        stem: "It turned out that someone ____ (disable) the check in December.",
        answer: "had disabled",
      },
      {
        stem: "I ____ (never see) that error before it ____ (happen) last night.",
        answer: "had never seen, happened",
      },
      {
        stem: "We ____ (deploy) it on Tuesday and it ____ (break) on Wednesday.",
        answer: "deployed, broke",
      },
    ],
  },
  {
    id: "14B",
    unit: 14,
    kind: "fill",
    promptEs: "Completa con pasado perfecto simple o continuo.",
    items: [
      {
        stem: "The job ____ (run) for six hours when it crashed.",
        answer: "had been running",
      },
      {
        stem: "We ____ (see) intermittent timeouts for weeks before we found the cause.",
        answer: "had been seeing",
      },
      {
        stem: "Nobody ____ (lower) the threshold back.",
        answer: "had lowered",
      },
      {
        stem: "The leak ____ (consume) connections silently since release 4.12.",
        answer: "had been consuming",
      },
      {
        stem: "I ____ (review) the PR before the meeting.",
        answer: "had reviewed",
      },
    ],
  },
  {
    id: "14C",
    unit: 14,
    kind: "fill",
    promptEs:
      "Completa con because, because of, due to, so, therefore, which meant, although o despite.",
    items: [
      {
        stem: "It failed ____ the connection pool was exhausted.",
        answer: "because",
      },
      {
        stem: "It failed ____ a connection leak.",
        answer: "because of",
        altAnswers: ["due to"],
      },
      {
        stem: "The threshold had been raised; ____, no alert fired.",
        answer: "therefore",
      },
      {
        stem: "The pool was exhausted, ____ new requests timed out.",
        answer: "so",
        altAnswers: ["which meant"],
      },
      {
        stem: "____ traffic was low, nobody noticed the leak.",
        answer: "Because",
      },
      {
        stem: "____ the low traffic, the leak was already present.",
        answer: "Despite",
      },
      {
        stem: "The alert didn't fire, ____ we found out from a customer.",
        answer: "so",
      },
      {
        stem: "____ we had monitoring, we hadn't set the right threshold.",
        answer: "Although",
      },
    ],
  },
  {
    id: "14D",
    unit: 14,
    kind: "correct",
    promptEs: "Corrige el error de cada frase.",
    items: [
      {
        stem: "It failed because of the pool was exhausted.",
        answer: "It failed because the pool was exhausted.",
        altAnswers: ["It failed because of the exhausted pool."],
      },
      {
        stem: "Despite it was low traffic, the leak existed.",
        answer: "Despite the low traffic, the leak existed.",
        altAnswers: ["Although traffic was low, the leak existed."],
      },
      {
        stem: "It failed, however we recovered quickly.",
        answer: "It failed; however, we recovered quickly.",
      },
      {
        stem: "When I had arrived, the service was down.",
        answer: "When I arrived, the service was down.",
      },
      {
        stem: "The reason is because the threshold was raised.",
        answer: "The reason is that the threshold was raised.",
      },
      {
        stem: "It had been introduced three weeks ago. (en un relato en pasado)",
        answer: "It had been introduced three weeks earlier.",
      },
      {
        stem: "Although of the monitoring, we missed it.",
        answer: "Despite the monitoring, we missed it.",
      },
      {
        stem: "We had deployed it and then it had broken.",
        answer: "We had deployed it and then it broke.",
      },
    ],
  },
  {
    id: "14E",
    unit: 14,
    kind: "translate",
    promptEs: "Traduce al inglés.",
    items: [
      {
        stem: "Cuando avisaron al ingeniero de guardia, la tasa de error ya había alcanzado el 40%.",
        answer:
          "By the time the on-call engineer was paged, the error rate had already reached 40%.",
      },
      {
        stem: "La fuga se había introducido tres semanas antes, en la versión 4.12.",
        answer: "The leak had been introduced three weeks earlier, in release 4.12.",
      },
      {
        stem: "No había causado problemas porque el tráfico era bajo durante las vacaciones.",
        answer: "It hadn't caused problems because traffic was low over the holidays.",
      },
      {
        stem: "El motivo de que la alerta no se disparara antes es que se había subido el umbral.",
        answer: "The reason the alert didn't fire sooner is that the threshold had been raised.",
      },
      {
        stem: "Nadie lo había vuelto a bajar.",
        answer: "Nobody had lowered it back.",
      },
      {
        stem: "El job llevaba seis horas ejecutándose cuando se cayó.",
        answer: "The job had been running for six hours when it crashed.",
      },
      {
        stem: "El pool se agotó, lo que significó que las peticiones nuevas dieron timeout.",
        answer: "The pool was exhausted, which meant new requests timed out.",
      },
      {
        stem: "Aunque teníamos monitorización, no habíamos configurado el umbral correcto.",
        answer: "Although we had monitoring, we hadn't set the right threshold.",
      },
    ],
  },

  // ────────────────────────── UNIT 15 ──────────────────────────
  {
    id: "15A",
    unit: 15,
    kind: "fill",
    promptEs: "Completa con condicional cero, primero o segundo.",
    items: [
      {
        stem: "If you ____ (shard) by tenant, cross-tenant queries ____ (fan out). (verdad general)",
        answer: "shard, fan out",
      },
      {
        stem: "If we ____ (shard) the table, reporting ____ (break). (posibilidad real)",
        answer: "shard, will break",
      },
      {
        stem: "If we ____ (do) that, we ____ (need) a separate read model. (hipotético)",
        answer: "did, would need",
      },
      {
        stem: "If growth ____ (double), we ____ (be) back here in nine months. (improbable)",
        answer: "doubled, would be",
      },
      {
        stem: "If it ____ (be) a race condition, we ____ (see) it under load. (hipotético, usa were)",
        answer: "were, would see",
      },
      {
        stem: "If the hot table ____ (go) over 500 GB, we ____ (revisit) it. (plan real)",
        answer: "goes, will revisit",
      },
      {
        stem: "If I ____ (be) you, I ____ (revert) it now.",
        answer: "were, would revert",
      },
    ],
  },
  {
    id: "15B",
    unit: 15,
    kind: "fill",
    promptEs:
      "Completa con unless, as long as, in case, even if, assuming u otherwise.",
    items: [
      {
        stem: "____ growth spikes, we're fine for eighteen months.",
        answer: "Unless",
      },
      {
        stem: "I'm OK with it ____ we document it as a deferral.",
        answer: "as long as",
      },
      {
        stem: "Keep the old table ____ we need to roll back.",
        answer: "in case",
      },
      {
        stem: "____ we shard, reporting is still a problem.",
        answer: "Even if",
      },
      {
        stem: "____ growth stays flat, this buys us a year and a half.",
        answer: "Assuming",
      },
      {
        stem: "We need to archive; ____, the table keeps growing.",
        answer: "otherwise",
      },
    ],
  },
  {
    id: "15C",
    unit: 15,
    kind: "correct",
    promptEs: "Corrige el error de cada frase.",
    items: [
      {
        stem: "If we would shard it, we would need a read model.",
        answer: "If we sharded it, we would need a read model.",
      },
      {
        stem: "If we will archive the data, the table will be smaller.",
        answer: "If we archive the data, the table will be smaller.",
      },
      {
        stem: "Unless we don't shard, reporting works.",
        answer: "Unless we shard, reporting works.",
        altAnswers: ["If we don't shard, reporting works."],
      },
      {
        stem: "If it was a race condition, we would see it. (registro formal)",
        answer: "If it were a race condition, we would see it.",
      },
      {
        stem: "In case of it fails, roll back.",
        answer: "If it fails, roll back.",
        altAnswers: ["In case it fails, keep the old table."],
      },
      {
        stem: "What happens if we would not do anything?",
        answer: "What happens if we don't do anything?",
        altAnswers: ["What would happen if we did nothing?"],
      },
      {
        stem: "If I would be you, I'd revert.",
        answer: "If I were you, I'd revert.",
      },
      {
        stem: "Even we shard, reporting is a problem.",
        answer: "Even if we shard, reporting is a problem.",
      },
    ],
  },
  {
    id: "15D",
    unit: 15,
    kind: "translate",
    promptEs: "Traduce al inglés.",
    items: [
      {
        stem: "Si fragmentamos la tabla, ¿qué pasa con las consultas de informes?",
        answer: "If we shard the table, what happens to the reporting queries?",
      },
      {
        stem: "Si hiciéramos eso, necesitaríamos un modelo de lectura aparte.",
        answer: "If we did that, we'd need a separate read model.",
      },
      {
        stem: "Si usáramos el pipeline de CDC existente, unas dos semanas.",
        answer: "If we used the existing CDC pipeline, about two weeks.",
      },
      {
        stem: "Si tuviéramos que construirlo desde cero, más bien dos meses.",
        answer: "If we had to build it from scratch, more like two months.",
      },
      {
        stem: "¿Y si no fragmentáramos nada?",
        answer: "What if we didn't shard at all?",
      },
      {
        stem: "Si archivásemos todo lo anterior a 90 días, la tabla caliente sería el 8% de su tamaño actual.",
        answer:
          "If we archived everything older than 90 days, the hot table would be 8% of its current size.",
      },
      {
        stem: "Asumiendo que el crecimiento se mantenga, unos dieciocho meses.",
        answer: "Assuming growth holds, about eighteen months.",
      },
      {
        stem: "Preferiría comprar dieciocho meses baratos que gastar dos meses en fragmentar ahora.",
        answer:
          "I'd rather buy eighteen months cheaply than spend two months sharding now.",
      },
      {
        stem: "Mientras seamos honestos de que es una postergación y no un arreglo, me parece bien.",
        answer:
          "As long as we're honest that it's a deferral and not a fix, I'm fine with it.",
      },
      {
        stem: "Si la tabla caliente supera los 500 GB, lo reconsideramos.",
        answer: "If the hot table goes over 500 GB, we revisit it.",
      },
    ],
  },

  // ────────────────────────── UNIT 16 ──────────────────────────
  {
    id: "16A",
    unit: 16,
    kind: "transform",
    promptEs: "Convierte cada frase a voz pasiva.",
    items: [
      { stem: "We deploy it nightly.", answer: "It is deployed nightly." },
      {
        stem: "Someone deleted the production index.",
        answer: "The production index was deleted.",
      },
      {
        stem: "They are testing the new endpoint.",
        answer: "The new endpoint is being tested.",
      },
      {
        stem: "We have assigned the ticket to Maya.",
        answer: "The ticket has been assigned to Maya.",
      },
      {
        stem: "Someone had raised the threshold in December.",
        answer: "The threshold had been raised in December.",
      },
      {
        stem: "We will publish a migration guide.",
        answer: "A migration guide will be published.",
      },
      {
        stem: "We must complete the rollout first.",
        answer: "The rollout must be completed first.",
      },
      {
        stem: "They gave me access on Monday. (dos versiones)",
        answer: "I was given access on Monday.",
        altAnswers: ["Access was given to me on Monday."],
      },
    ],
  },
  {
    id: "16B",
    unit: 16,
    kind: "transform",
    promptEs: "Pasa cada cita a discurso referido.",
    items: [
      {
        stem: "\"We're going to deprecate v1 in Q3.\" → They said…",
        answer: "They said (that) they were going to deprecate v1 in Q3.",
      },
      {
        stem: "\"Will there be a migration guide?\" (Maya) → Maya asked…",
        answer: "Maya asked whether there would be a migration guide.",
      },
      {
        stem: "\"We'll publish one by the end of June.\" → They said…",
        answer: "They said they would publish one by the end of June.",
      },
      {
        stem: "\"Our service still relies on v1.\" (Tom) → Tom pointed out…",
        answer: "Tom pointed out that their service still relied on v1.",
      },
      {
        stem: "\"Prioritise the migration this quarter.\" (Tom) → Tom suggested…",
        answer: "Tom suggested prioritising the migration that quarter.",
        altAnswers: ["Tom suggested that we prioritise the migration that quarter."],
      },
      {
        stem: "\"Don't deploy on Friday.\" (Priya) → Priya told us…",
        answer: "Priya told us not to deploy on Friday.",
      },
      {
        stem: "\"I tested it yesterday.\" (Maya) → Maya said…",
        answer: "Maya said she had tested it the day before.",
      },
      {
        stem: "\"Can you review our PR?\" (us) → We asked them…",
        answer: "We asked them to review our PR.",
      },
    ],
  },
  {
    id: "16C",
    unit: 16,
    kind: "choose",
    promptEs:
      "Elige el verbo introductor adecuado: pointed out, admitted, suggested, warned, refused, denied, offered, flagged.",
    items: [
      {
        stem: "He ____ that our service still uses v1 in three places.",
        answer: "pointed out",
      },
      {
        stem: "She ____ us that the endpoint would be switched off without notice.",
        answer: "warned",
      },
      {
        stem: "He ____ changing the config — he says it wasn't him.",
        answer: "denied",
      },
      {
        stem: "He ____ to change the config — he thinks it's a bad idea.",
        answer: "refused",
      },
      {
        stem: "They ____ to review our migration PR.",
        answer: "offered",
      },
      {
        stem: "Maya ____ splitting the ticket into two.",
        answer: "suggested",
      },
      {
        stem: "He ____ that he hadn't run the tests.",
        answer: "admitted",
      },
      {
        stem: "Priya ____ the risk to the product owner.",
        answer: "flagged",
      },
    ],
  },
  {
    id: "16D",
    unit: 16,
    kind: "correct",
    promptEs: "Corrige el error de cada frase.",
    items: [
      {
        stem: "He said me that it was ready.",
        answer: "He told me that it was ready.",
      },
      {
        stem: "He suggested me to split the PR.",
        answer: "He suggested that I split the PR.",
        altAnswers: ["He suggested splitting the PR."],
      },
      {
        stem: "He asked when would it be ready.",
        answer: "He asked when it would be ready.",
      },
      {
        stem: "He recommended me to use Postgres.",
        answer: "He recommended using Postgres.",
        altAnswers: ["He recommended that I use Postgres."],
      },
      {
        stem: "The index was delete by someone.",
        answer: "The index was deleted by someone.",
      },
      {
        stem: "It has been assign to Maya.",
        answer: "It has been assigned to Maya.",
      },
      {
        stem: "He explained me the architecture.",
        answer: "He explained the architecture to me.",
      },
      {
        stem: "He denied to have changed it.",
        answer: "He denied changing it.",
        altAnswers: ["He denied having changed it."],
      },
      {
        stem: "She asked me if I had finished it?",
        answer: "She asked me if I had finished it.",
      },
      {
        stem: "The rollout must be complete before v1 is switch off.",
        answer: "The rollout must be completed before v1 is switched off.",
      },
    ],
  },
  {
    id: "16E",
    unit: 16,
    kind: "translate",
    promptEs: "Traduce al inglés.",
    items: [
      {
        stem: "El equipo de plataforma dijo que iban a deprecar el endpoint v1 en el Q3.",
        answer:
          "The platform team said they were going to deprecate the v1 endpoint in Q3.",
      },
      {
        stem: "Maya preguntó si habría una guía de migración.",
        answer: "Maya asked whether there would be a migration guide.",
      },
      {
        stem: "Dijeron que publicarían una para finales de junio.",
        answer: "They said they'd publish one by the end of June.",
      },
      {
        stem: "Tom señaló que nuestro servicio todavía depende de v1 en tres sitios.",
        answer: "Tom pointed out that our service still relies on v1 in three places.",
      },
      {
        stem: "Sugirió que priorizáramos la migración este trimestre.",
        answer: "He suggested that we prioritise the migration this quarter.",
      },
      {
        stem: "Se decidió que se crearía un spike para dimensionar el trabajo.",
        answer: "It was decided that a spike would be created to size the work.",
      },
      {
        stem: "El ticket se ha asignado a Maya.",
        answer: "The ticket has been assigned to Maya.",
      },
      {
        stem: "El despliegue debe completarse antes de que se apague v1.",
        answer: "The rollout must be completed before v1 is switched off.",
      },
      {
        stem: "Me dieron acceso el lunes. (usa la pasiva con persona como sujeto)",
        answer: "I was given access on Monday.",
      },
      {
        stem: "Se cree que es un problema del driver.",
        answer: "It's believed to be a driver issue.",
      },
    ],
  },

  // ────────────────────────── UNIT 17 ──────────────────────────
  {
    id: "17A",
    unit: 17,
    kind: "fill",
    promptEs: "Añade el question tag.",
    items: [
      { stem: "It's already deployed, ____?", answer: "isn't it" },
      { stem: "You haven't reviewed it yet, ____?", answer: "have you" },
      { stem: "We deployed on Tuesday, ____?", answer: "didn't we" },
      { stem: "This won't scale, ____?", answer: "will it" },
      { stem: "There's a rollback plan, ____?", answer: "isn't there" },
      { stem: "Let's park that, ____?", answer: "shall we" },
      { stem: "I'm on the list, ____?", answer: "aren't I" },
      { stem: "It doesn't retry, ____?", answer: "does it" },
    ],
  },
  {
    id: "17B",
    unit: 17,
    kind: "choose",
    promptEs: "Elige la frase adecuada a cada situación de reunión.",
    items: [
      {
        stem: "No has oído la última frase por mala conexión.",
        answer: "Sorry, you cut out — could you say that again?",
        noteEs: MODELO,
      },
      {
        stem: "Alguien habla demasiado rápido y llevas dos minutos perdido.",
        answer:
          "Sorry to stop you — I've lost the thread. Could we back up to the part about the queue?",
        noteEs: MODELO,
      },
      {
        stem: "Quieres discrepar suavemente de tu tech lead delante de diez personas.",
        answer: "I see it slightly differently, and I might be wrong, but…",
        noteEs: MODELO,
      },
      {
        stem: "Quieres interrumpir para añadir un dato importante.",
        answer: "Can I jump in with one data point?",
        noteEs: MODELO,
      },
      {
        stem: "Necesitas aplazar una respuesta que no sabes.",
        answer: "Let me come back to you on that — I want to check before I answer.",
        noteEs: MODELO,
      },
      {
        stem: "Quieres cortar una discusión que se está alargando.",
        answer: "Shall we take this offline and come back with a proposal?",
        noteEs: MODELO,
      },
      {
        stem: "Quieres confirmar que has entendido bien un plan complejo.",
        answer:
          "Just to play that back: X, then Y, and Z is out of scope. Is that right?",
        noteEs: MODELO,
      },
    ],
  },
  {
    id: "17C",
    unit: 17,
    kind: "transform",
    promptEs: "Reescribe con registro adecuado.",
    items: [
      { stem: "What? Repeat.", answer: "Sorry, could you say that again?" },
      { stem: "You're wrong.", answer: "I see it differently." },
      {
        stem: "I don't understand nothing.",
        answer: "I'm not following at all — could we back up?",
      },
      {
        stem: "Speak slowly please.",
        answer: "Would you mind slowing down a bit?",
      },
      { stem: "No, that's not true.", answer: "I'm not sure that's the case." },
      { stem: "Wait, I want to talk.", answer: "Can I jump in here?" },
    ],
  },
  {
    id: "17D",
    unit: 17,
    kind: "translate",
    promptEs: "Traduce al inglés.",
    items: [
      {
        stem: "Perdona, ¿puedo intervenir un momento?",
        answer: "Sorry, can I jump in for a second?",
      },
      {
        stem: "No te he pillado la última parte.",
        answer: "I didn't catch the last part.",
      },
      {
        stem: "Para asegurarme de que lo entiendo: quieres decir que X, ¿verdad?",
        answer: "Just to make sure I've understood: you're saying that X, right?",
      },
      {
        stem: "Entiendo tu punto, pero no estoy seguro de que aplique aquí.",
        answer: "I see your point, but I'm not sure it applies here.",
      },
      {
        stem: "Buena observación, no lo había pensado.",
        answer: "Good point — I hadn't thought of that.",
      },
      {
        stem: "¿Podemos dejar eso aparcado por ahora?",
        answer: "Can we park that for now?",
      },
      {
        stem: "Creo que estamos hablando de dos cosas distintas.",
        answer: "I think we're talking about two different things.",
      },
      {
        stem: "Tengo que irme puntual a las tres.",
        answer: "I've got a hard stop at three.",
      },
      {
        stem: "Lo confirmo por escrito después.",
        answer: "I'll confirm it in writing afterwards.",
      },
      {
        stem: "¿Estamos todos alineados en eso?",
        answer: "Are we all aligned on that?",
      },
    ],
  },

  // ────────────────────────── UNIT 18 ──────────────────────────
  {
    id: "18A",
    unit: 18,
    kind: "fill",
    promptEs: "Une con el relativo adecuado: that, which, who, whose, where.",
    items: [
      {
        stem: "This is the service ____ handles payments.",
        answer: "that",
        altAnswers: ["which"],
      },
      {
        stem: "Postgres is the database ____ the transactional data lives.",
        answer: "where",
      },
      {
        stem: "The engineer ____ wrote this has left the company.",
        answer: "who",
      },
      {
        stem: "Requests ____ signature doesn't match are rejected.",
        answer: "whose",
      },
      {
        stem: "We use Redis, ____ is fast enough for our needs.",
        answer: "which",
      },
      {
        stem: "The pool was exhausted, ____ meant requests timed out.",
        answer: "which",
      },
    ],
  },
  {
    id: "18B",
    unit: 18,
    kind: "classify",
    promptEs:
      "Añade comas donde haga falta (definida vs. no definida) y explica el cambio de significado.",
    items: [
      {
        stem: "Requests that fail are retried.",
        answer: "Sin comas (definida: solo se reintentan las que fallan).",
      },
      {
        stem: "The payments service which runs in Kubernetes handles 2k RPS.",
        answer:
          "The payments service, which runs in Kubernetes, handles 2k RPS. — con comas, porque hay un solo servicio de pagos y el dato es adicional.",
      },
      {
        stem: "Engineers who are on call get a laptop.",
        answer: "Sin comas (definida: solo los que están de guardia).",
      },
      {
        stem: "The file which is generated at 23:00 is uploaded to SFTP.",
        answer:
          "Cambia el significado: sin comas hay varios archivos y hablamos del de las 23:00; con comas hay uno solo y la hora es un dato extra.",
      },
    ],
  },
  {
    id: "18C",
    unit: 18,
    kind: "transform",
    promptEs: "Reduce a cláusula de participio.",
    items: [
      {
        stem: "the file that is generated at 23:00",
        answer: "the file generated at 23:00",
      },
      {
        stem: "the worker that is called `settlement-runner`",
        answer: "the worker called `settlement-runner`",
      },
      {
        stem: "requests that come through the gateway",
        answer: "requests coming through the gateway",
      },
      {
        stem: "the endpoints that were deprecated in Q1",
        answer: "the endpoints deprecated in Q1",
      },
      {
        stem: "a service that runs in Kubernetes",
        answer: "a service running in Kubernetes",
      },
      {
        stem: "the tests that were added in this PR",
        answer: "the tests added in this PR",
      },
    ],
  },
  {
    id: "18D",
    unit: 18,
    kind: "transform",
    promptEs: "Omite el relativo donde sea posible.",
    items: [
      {
        stem: "The bug that I fixed yesterday came back.",
        answer: "The bug I fixed yesterday came back.",
      },
      {
        stem: "The service that handles payments is Java.",
        answer: "No se puede omitir (el relativo es sujeto).",
      },
      {
        stem: "The person who you spoke to is on holiday.",
        answer: "The person you spoke to is on holiday.",
      },
      {
        stem: "The library which we use is deprecated.",
        answer: "The library we use is deprecated.",
      },
      {
        stem: "The team that owns this service is platform.",
        answer: "No se puede omitir (el relativo es sujeto).",
      },
    ],
  },
  {
    id: "18E",
    unit: 18,
    kind: "correct",
    promptEs: "Corrige el error de cada frase.",
    items: [
      {
        stem: "The service who handles payments…",
        answer: "The service that/which handles payments…",
      },
      {
        stem: "Postgres, that we use for transactions, is on RDS.",
        answer: "Postgres, which we use for transactions, is on RDS.",
      },
      {
        stem: "The engineer which wrote it has left.",
        answer: "The engineer who wrote it has left.",
      },
      {
        stem: "This is the repo where I told you about.",
        answer: "This is the repo (that) I told you about.",
      },
      {
        stem: "Running the migration, the database crashed.",
        answer: "When we ran the migration, the database crashed.",
        noteEs: "el participio colgado atribuía la acción a la base de datos",
      },
      {
        stem: "We have five services, most of them are stateless.",
        answer: "We have five services, most of which are stateless.",
      },
      {
        stem: "The file generating at 23:00 is uploaded.",
        answer: "The file generated at 23:00 is uploaded.",
      },
      {
        stem: "The reason why is because the pool was full.",
        answer: "The reason is that the pool was full.",
      },
    ],
  },
  {
    id: "18F",
    unit: 18,
    kind: "translate",
    promptEs: "Traduce al inglés.",
    items: [
      {
        stem: "El servicio que gestiona los pagos es una aplicación Java que corre en Kubernetes.",
        answer:
          "The service that handles payments is a Java application running in Kubernetes.",
      },
      {
        stem: "Habla con dos bases de datos: Postgres, donde viven los datos transaccionales, y Redis, que usamos para claves de idempotencia.",
        answer:
          "It talks to two databases: Postgres, where the transactional data lives, and Redis, which we use for idempotency keys.",
      },
      {
        stem: "Toda petición entra por el API gateway, que valida el JWT antes de enrutar.",
        answer:
          "Every request comes in through the API gateway, which validates the JWT before routing.",
      },
      {
        stem: "Las peticiones cuya firma no coincide se rechazan con un 401.",
        answer: "Requests whose signature doesn't match are rejected with a 401.",
      },
      {
        stem: "Hay un worker, llamado `settlement-runner`, que recoge las transacciones completadas.",
        answer:
          "There's a worker, called `settlement-runner`, that picks up completed transactions.",
      },
      {
        stem: "El archivo, generado a las 23:00 cada noche, se sube a un endpoint SFTP.",
        answer:
          "The file, generated at 23:00 every night, is uploaded to an SFTP endpoint.",
      },
      {
        stem: "La parte que cambiaría si pudiera es la lógica de reintentos.",
        answer: "The part I'd change if I could is the retry logic.",
      },
      {
        stem: "Tenemos tres puntos de llamada, todos los cuales hay que actualizar.",
        answer: "We have three call sites, all of which need updating.",
      },
    ],
  },

  // ────────────────────────── UNIT 19 ──────────────────────────
  {
    id: "19A",
    unit: 19,
    kind: "fill",
    promptEs: "Completa con tercer condicional.",
    items: [
      {
        stem: "If we ____ (load-test) at production volumes, we ____ (catch) the leak.",
        answer: "had load-tested, would have caught",
      },
      {
        stem: "If the threshold ____ (not be raised), the alert ____ (fire) twenty minutes earlier.",
        answer: "hadn't been raised, would have fired",
      },
      {
        stem: "If the alert ____ (have) an owner, someone ____ (notice) it had been silenced.",
        answer: "had had, would have noticed",
      },
      {
        stem: "If we ____ (write) it down as a ticket, it ____ (not fall) through the cracks.",
        answer: "had written, wouldn't have fallen",
      },
      {
        stem: "If I ____ (know) about the backfill, I ____ (not start) the batch job.",
        answer: "had known, wouldn't have started",
      },
    ],
  },
  {
    id: "19B",
    unit: 19,
    kind: "fill",
    promptEs: "Condicionales mixtos: identifica el tipo y completa.",
    items: [
      {
        stem: "If we ____ (document) it, we ____ (not guess) now.",
        answer: "had documented, wouldn't be guessing",
        noteEs: "condicional mixto: pasado → presente",
      },
      {
        stem: "If I ____ (be) more familiar with the codebase, I ____ (spot) it in review.",
        answer: "were, would have spotted",
        noteEs: "condicional mixto: presente → pasado",
      },
      {
        stem: "If we ____ (have) proper load testing, this ____ (not happen).",
        answer: "had, wouldn't have happened",
        noteEs: "condicional mixto: presente → pasado",
      },
    ],
  },
  {
    id: "19C",
    unit: 19,
    kind: "fill",
    promptEs: "Completa con wish / if only.",
    items: [
      {
        stem: "I wish I ____ (know) why it failed. (no lo sé)",
        answer: "knew",
      },
      {
        stem: "I wish we ____ (write) it down. (no lo hicimos)",
        answer: "had written",
      },
      {
        stem: "I wish it ____ (be) simpler. (uso formal)",
        answer: "were",
      },
      {
        stem: "I wish they ____ (respond) faster. (queja sobre otros)",
        answer: "would respond",
      },
      {
        stem: "If only we ____ (load-test) it first.",
        answer: "had load-tested",
      },
    ],
  },
  {
    id: "19D",
    unit: 19,
    kind: "fill",
    promptEs:
      "Completa con should have, needn't have, was supposed to o ended up.",
    items: [
      { stem: "We ____ caught this in review.", answer: "should have" },
      { stem: "It ____ be reverted in January.", answer: "was supposed to" },
      {
        stem: "We ____ rolled back — the fix was already live.",
        answer: "needn't have",
      },
      { stem: "We ____ rolling back anyway.", answer: "ended up" },
      {
        stem: "We ____ deployed on a Friday. (no debimos)",
        answer: "shouldn't have",
      },
    ],
  },
  {
    id: "19E",
    unit: 19,
    kind: "transform",
    promptEs: "Reescribe con inversión (sin if).",
    items: [
      {
        stem: "If we had done that, it would have shown up in the diff.",
        answer: "Had we done that, it would have shown up in the diff.",
      },
      {
        stem: "If it hadn't been for the retry logic, we'd have lost the payments.",
        answer: "Had it not been for the retry logic, we'd have lost the payments.",
      },
      {
        stem: "If we had known about the backfill, we'd have waited.",
        answer: "Had we known about the backfill, we'd have waited.",
      },
    ],
  },
  {
    id: "19F",
    unit: 19,
    kind: "transform",
    promptEs: "Convierte a blameless: reescribe evitando señalar a la persona.",
    items: [
      {
        stem: "Maya raised the threshold and forgot to revert it.",
        answer:
          "The threshold was raised as a temporary measure, and there was no mechanism to ensure it was reverted.",
        noteEs: MODELO,
      },
      {
        stem: "Tom deployed without running the tests.",
        answer:
          "The change was deployed without the test suite running, because the pre-merge hook doesn't enforce it.",
        noteEs: MODELO,
      },
      {
        stem: "You didn't check the dashboards.",
        answer:
          "The dashboards weren't checked — there was no step in the runbook that required it.",
        noteEs: MODELO,
      },
      {
        stem: "The intern deleted the index.",
        answer:
          "The index was dropped during onboarding; the account had write access to production on day one.",
        noteEs: MODELO,
      },
    ],
  },
  {
    id: "19G",
    unit: 19,
    kind: "correct",
    promptEs: "Corrige el error de cada frase.",
    items: [
      {
        stem: "If we would have tested it, we would have found it.",
        answer: "If we had tested it, we would have found it.",
      },
      {
        stem: "If we had tested it, we would find it.",
        answer: "If we had tested it, we would have found it.",
      },
      { stem: "I wish I would know.", answer: "I wish I knew." },
      { stem: "We should of caught it.", answer: "We should have caught it." },
      {
        stem: "I wish that we have documented it.",
        answer: "I wish we had documented it.",
      },
      {
        stem: "If only we would have known.",
        answer: "If only we had known.",
      },
      {
        stem: "It was supposed to being reverted.",
        answer: "It was supposed to be reverted.",
      },
      {
        stem: "We didn't needed to roll back.",
        answer: "We didn't need to roll back.",
      },
    ],
  },
  {
    id: "19H",
    unit: 19,
    kind: "translate",
    promptEs: "Traduce al inglés.",
    items: [
      {
        stem: "Si hubiéramos hecho pruebas de carga a volúmenes de producción, habríamos detectado la fuga antes de la release.",
        answer:
          "If we'd load-tested at production volumes, we'd have caught the leak before release.",
      },
      {
        stem: "Si no hubieran subido el umbral en diciembre, nos habrían avisado veinte minutos antes.",
        answer:
          "If they hadn't raised the threshold in December, we'd have been paged twenty minutes earlier.",
      },
      {
        stem: "El impacto habría sido una fracción del que fue.",
        answer: "The impact would have been a fraction of what it was.",
      },
      {
        stem: "Si la alerta hubiera tenido un dueño, alguien se habría dado cuenta de que estaba silenciada.",
        answer:
          "If the alert had had an owner, someone would have noticed that it had been silenced.",
      },
      {
        stem: "No era el trabajo de nadie, y ese es exactamente el tipo de hueco que deberíamos buscar.",
        answer:
          "It wasn't anyone's job, which is exactly the kind of gap we should be looking for.",
      },
      {
        stem: "Ojalá lo hubiéramos apuntado como ticket.",
        answer: "I wish we'd written it down as a ticket.",
      },
      {
        stem: "Se suponía que se iba a revertir en enero; simplemente no ocurrió.",
        answer: "It was supposed to be reverted in January — it just never happened.",
      },
      {
        stem: "En retrospectiva, deberíamos haber tratado un cambio de umbral como un cambio de configuración.",
        answer:
          "In hindsight, we should have treated a threshold change as a config change.",
      },
      {
        stem: "De haberlo hecho así, habría aparecido en el diff de diciembre.",
        answer: "Had we done that, it would have shown up in the December diff.",
      },
      {
        stem: "La acción no es \"ser más cuidadosos\", es \"las alertas necesitan dueño\".",
        answer:
          "The action item isn't \"be more careful\" — it's \"alerts need owners\".",
      },
    ],
  },

  // ────────────────────────── UNIT 20 ──────────────────────────
  {
    id: "20A",
    unit: 20,
    kind: "transform",
    promptEs: "Calibra la certeza: reescribe cada afirmación al grado indicado.",
    items: [
      {
        stem: "It's a race condition. → 50%",
        answer: "It might be a race condition.",
      },
      {
        stem: "It's a race condition. → 95% deducción",
        answer: "It must be a race condition — nothing else changed.",
      },
      {
        stem: "It's a race condition. → 85% expectativa",
        answer: "It should be a race condition, given the pattern.",
        altAnswers: ["It's most likely a race condition."],
      },
      {
        stem: "This will reduce latency by 40%. → basado en evidencia limitada",
        answer:
          "Based on a limited sample, this appears to reduce latency by around 40%.",
      },
      {
        stem: "This is the root cause. → improbable",
        answer: "It's unlikely that this is the root cause.",
      },
    ],
  },
  {
    id: "20B",
    unit: 20,
    kind: "transform",
    promptEs: "Coloca el adverbio en su posición correcta.",
    items: [
      {
        stem: "(probably) It will fail under load.",
        answer: "It'll probably fail under load.",
      },
      {
        stem: "(arguably) That's the cleaner approach.",
        answer: "That's arguably the cleaner approach.",
      },
      {
        stem: "(presumably) They tested it before merging.",
        answer: "Presumably they tested it before merging.",
      },
      {
        stem: "(almost certainly) The leak has been there since 4.12.",
        answer: "The leak has almost certainly been there since 4.12.",
      },
      {
        stem: "(apparently) The platform team has already deprecated it.",
        answer: "The platform team has apparently already deprecated it.",
      },
    ],
  },
  {
    id: "20C",
    unit: 20,
    kind: "fill",
    promptEs: "Completa con may, might, can o could.",
    items: [
      {
        stem: "Race conditions ____ be very hard to reproduce. (genérico)",
        answer: "can",
      },
      {
        stem: "It ____ be a race condition — I'm about 50/50 on it. (específico)",
        answer: "might",
        altAnswers: ["may"],
      },
      { stem: "This ____ well be the cause. (65%)", answer: "may" },
      {
        stem: "Above 50 partitions, the overhead ____ become significant. (posibilidad genérica)",
        answer: "can",
      },
      {
        stem: "____ you take a look when you get a chance? (petición)",
        answer: "Could",
      },
    ],
  },
  {
    id: "20D",
    unit: 20,
    kind: "transform",
    promptEs: "Añade la declaración de límite adecuada.",
    items: [
      {
        stem: "This reduces p99 latency by 40%. → añade que la muestra fue de dos semanas.",
        answer:
          "This reduces p99 latency by 40%, although the sample covered only two weeks of traffic.",
        noteEs: MODELO,
      },
      {
        stem: "pg_partman handles the retention window correctly. → añade que es una asunción no verificada.",
        answer:
          "We're assuming — but haven't verified — that pg_partman handles the retention window correctly.",
        noteEs: MODELO,
      },
      {
        stem: "The write path is fine. → añade que no lo has medido.",
        answer: "The write path looks fine, but I haven't measured it.",
        noteEs: MODELO,
      },
    ],
  },
  {
    id: "20E",
    unit: 20,
    kind: "correct",
    promptEs: "Corrige el hedging mal aplicado.",
    items: [
      {
        stem: "It might possibly be the case that the pool was perhaps exhausted at 02:14.",
        answer: "The pool was exhausted at 02:14.",
        noteEs: "es un hecho: sin hedging",
      },
      {
        stem: "Maybe we should perhaps consider not committing secrets.",
        answer: "Secrets must never be committed.",
      },
      {
        stem: "I sort of think option B could maybe be better?",
        answer: "I'd recommend option B, mainly because of the rollback story.",
      },
      {
        stem: "Probably it will fail.",
        answer: "It'll probably fail.",
      },
      {
        stem: "It can be the cause of this outage.",
        answer: "It may be the cause of this outage.",
        altAnswers: ["It might be the cause of this outage."],
      },
      {
        stem: "In my opinion I think that possibly…",
        answer: "I suspect that…",
        altAnswers: ["My sense is that…"],
      },
    ],
  },
  {
    id: "20F",
    unit: 20,
    kind: "translate",
    promptEs: "Traduce al inglés manteniendo el grado exacto de certeza.",
    items: [
      {
        stem: "Basándonos en una prueba de concepto contra una instantánea de producción, esto parece reducir la latencia de lectura p99 en torno al 40%.",
        answer:
          "Based on a proof of concept run against a snapshot of production, this appears to reduce p99 read latency by around 40%.",
      },
      {
        stem: "Aunque la muestra cubría solo dos semanas de tráfico y puede no ser representativa de la carga de fin de mes.",
        answer:
          "Although the sample covered only two weeks of traffic and may not be representative of month-end load.",
      },
      {
        stem: "Estamos bastante seguros del camino de lectura.",
        answer: "We're fairly confident about the read path.",
      },
      {
        stem: "Estamos considerablemente menos seguros del camino de escritura.",
        answer: "We're considerably less confident about the write path.",
      },
      {
        stem: "Es posible que el enrutado de particiones añada una sobrecarga que no hemos medido.",
        answer:
          "It's possible that the partition routing adds overhead we haven't measured.",
      },
      {
        stem: "Hay algunas indicaciones en las listas de correo de Postgres de que esto puede volverse significativo.",
        answer:
          "There's some evidence in the Postgres mailing lists that this can become significant.",
      },
      {
        stem: "No hemos probado la reversión bajo carga.",
        answer: "We haven't tested rollback under load.",
      },
      {
        stem: "Asumimos, pero no hemos verificado, que pg_partman gestiona correctamente la ventana de retención.",
        answer:
          "We're assuming — but haven't verified — that pg_partman handles the retention window correctly.",
      },
      {
        stem: "Yo trataría estas cifras como indicativas y no como definitivas.",
        answer: "I'd treat these numbers as indicative rather than definitive.",
      },
      {
        stem: "Recomendaríamos proceder con un despliegue limitado a un solo tenant.",
        answer: "We'd suggest proceeding with a limited rollout to one tenant.",
      },
    ],
  },

  // ────────────────────────── UNIT 21 ──────────────────────────
  {
    id: "21A",
    unit: 21,
    kind: "transform",
    promptEs: "Reescribe con it-cleft.",
    items: [
      {
        stem: "The coupling caused most of our incidents.",
        answer: "It was the coupling that caused most of our incidents.",
      },
      {
        stem: "Maya found the leak.",
        answer: "It was Maya who found the leak.",
      },
      {
        stem: "We only noticed it in December.",
        answer: "It wasn't until December that we noticed it.",
      },
      {
        stem: "We need better tests, not more dashboards.",
        answer: "It's better tests that we need, not more dashboards.",
      },
    ],
  },
  {
    id: "21B",
    unit: 21,
    kind: "transform",
    promptEs: "Reescribe con what-cleft.",
    items: [
      {
        stem: "The retry logic is causing the problem.",
        answer: "What's causing the problem is the retry logic.",
      },
      {
        stem: "We need a separate read model.",
        answer: "What we need is a separate read model.",
      },
      {
        stem: "We're proposing a strangler pattern, not a rewrite.",
        answer: "What we're proposing is a strangler pattern, not a rewrite.",
      },
      {
        stem: "The blast radius worries me.",
        answer: "What worries me is the blast radius.",
      },
      {
        stem: "Very little of the code actually needs to move. (empieza con \"What surprised us…\")",
        answer: "What surprised us was how little of the code actually needs to move.",
      },
    ],
  },
  {
    id: "21C",
    unit: 21,
    kind: "transform",
    promptEs: "Reescribe con inversión enfática.",
    items: [
      {
        stem: "It didn't only fail; it also took down notifications. (Not only…)",
        answer: "Not only did it fail, but it also took down notifications.",
      },
      {
        stem: "I have never seen a stack trace that deep. (Never…)",
        answer: "Never have I seen a stack trace that deep.",
      },
      {
        stem: "We should only discuss the rest after we've split the boundary. (Only after…)",
        answer: "Only after we've split the boundary should we discuss the rest.",
      },
      {
        stem: "Secrets should never be committed under any circumstances. (Under no circumstances…)",
        answer: "Under no circumstances should secrets be committed.",
      },
      {
        stem: "We didn't know it had been there for three weeks. (Little…)",
        answer: "Little did we know it had been there for three weeks.",
      },
      {
        stem: "If we had tested it, we'd have caught it. (Had…)",
        answer: "Had we tested it, we'd have caught it.",
      },
    ],
  },
  {
    id: "21D",
    unit: 21,
    kind: "transform",
    promptEs: "Añade do enfático.",
    items: [
      {
        stem: "We accept that this leaves two deployment units.",
        answer: "We do accept that this leaves two deployment units.",
      },
      {
        stem: "It works, but only under low load.",
        answer: "It does work, but only under low load.",
      },
      {
        stem: "I see the appeal of a rewrite.",
        answer: "I do see the appeal of a rewrite.",
      },
    ],
  },
  {
    id: "21E",
    unit: 21,
    kind: "correct",
    promptEs: "Corrige el error de cada frase.",
    items: [
      {
        stem: "It is the coupling what caused the incidents.",
        answer: "It is the coupling that caused the incidents.",
      },
      {
        stem: "What we need are a read model. (aceptable pero elige la forma estándar)",
        answer: "What we need is a read model.",
      },
      {
        stem: "Not only it failed, but also it took down notifications.",
        answer: "Not only did it fail, but it also took down notifications.",
      },
      {
        stem: "Never I have seen that.",
        answer: "Never have I seen that.",
      },
      {
        stem: "Only after we split it, we should discuss the rest.",
        answer: "Only after we split it should we discuss the rest.",
      },
      {
        stem: "Is the boundary that is the problem.",
        answer: "It's the boundary that is the problem.",
      },
      {
        stem: "What I do is I would add a feature flag.",
        answer: "What I'd do is add a feature flag.",
      },
      {
        stem: "Under no circumstances secrets should be committed.",
        answer: "Under no circumstances should secrets be committed.",
      },
    ],
  },
  {
    id: "21F",
    unit: 21,
    kind: "translate",
    promptEs: "Traduce al inglés manteniendo el énfasis.",
    items: [
      {
        stem: "Lo que proponemos no es una reescritura.",
        answer: "What we're proposing is not a rewrite.",
      },
      {
        stem: "Es el acoplamiento entre facturación y notificaciones lo que ha causado la mayoría de nuestros incidentes este año.",
        answer:
          "It's the coupling between billing and notifications that has caused most of our incidents this year.",
      },
      {
        stem: "Lo que más nos sorprendió al mapearlo fue lo poco código que hay que mover realmente.",
        answer:
          "What surprised us most when we mapped it out was how little of the code actually needs to move.",
      },
      {
        stem: "Solo después de separar esa frontera deberíamos plantearnos si hay que romper el resto del monolito.",
        answer:
          "Only after we've split that boundary should we discuss whether the rest of the monolith needs breaking up.",
      },
      {
        stem: "Sí aceptamos que esto nos deja con dos unidades de despliegue más tiempo del que a nadie le gustaría.",
        answer:
          "We do accept that this leaves us with two deployment units for longer than anyone would like.",
      },
      {
        stem: "Lo que no aceptamos es que la alternativa haya funcionado alguna vez en esta empresa.",
        answer:
          "What we don't accept is that the alternative has ever worked at this company.",
      },
      {
        stem: "No es que el código sea lento; es que lo llamamos cuatrocientas veces por petición.",
        answer:
          "It's not that the code is slow — it's that we call it four hundred times per request.",
      },
      {
        stem: "Nunca había visto una traza de pila tan profunda.",
        answer: "Never had I seen a stack trace that deep.",
        altAnswers: ["Never have I seen a stack trace that deep."],
      },
    ],
  },

  // ────────────────────────── UNIT 22 ──────────────────────────
  {
    id: "22A",
    unit: 22,
    kind: "classify",
    promptEs:
      "Etiqueta las fases STAR en el Input de la sección 1 de la unidad y calcula qué proporción ocupa la Action.",
    items: [
      {
        stem: "Marca dónde empieza cada bloque S/T/A/R y calcula la proporción de la Action.",
        answer:
          "S = \"about a year ago I was on a team of five…\" · T = \"the tech lead's plan was… My concern was that…\" · A = \"So what I did was… I spent an afternoon…\" · R = \"The outcome was that… What I took away from it…\". La Action ocupa algo más de la mitad del texto, que es la proporción correcta.",
        noteEs: "clasificación sobre el texto Input de la unidad",
      },
    ],
  },
  {
    id: "22B",
    unit: 22,
    kind: "transform",
    promptEs: "Reescribe pasando de we a I (sin sonar arrogante).",
    items: [
      {
        stem: "We decided to use an adapter interface.",
        answer:
          "The team went with an adapter interface; the proof of concept that made the case was mine.",
      },
      {
        stem: "We reduced latency a lot.",
        answer: "I cut p99 from 800 ms to 120 ms.",
      },
      {
        stem: "We fixed the bug and shipped it.",
        answer: "I found the root cause and shipped the fix; Tom reviewed it.",
      },
      {
        stem: "We migrated the database.",
        answer: "I owned the migration end to end.",
      },
    ],
  },
  {
    id: "22C",
    unit: 22,
    kind: "transform",
    promptEs: "Reformula las respuestas débiles.",
    items: [
      {
        stem: "I just helped a bit with the migration.",
        answer: "I led the migration of three services.",
      },
      {
        stem: "It was a team effort, nothing special.",
        answer:
          "It was a team effort — my part was the data layer, which was the piece we were most worried about.",
      },
      {
        stem: "I don't know, we made it faster I think.",
        answer: "We cut p99 latency from 800 ms to 120 ms.",
      },
      {
        stem: "My English is not very good, sorry.",
        answer: "Elimínalo por completo.",
        altAnswers: ["Do stop me if anything isn't clear."],
      },
    ],
  },
  {
    id: "22D",
    unit: 22,
    kind: "transform",
    promptEs: "Lee en voz alta: escribe cómo se pronuncia cada fragmento técnico.",
    items: [
      {
        stem: "`user_id` → `users/{id}/settings`",
        answer:
          "user underscore i-d → users slash curly braces i-d curly braces close slash settings",
      },
      {
        stem: "`if (x !== y) { return null; }`",
        answer:
          "if open paren x not-equals-equals y close paren curly brace return null semicolon curly brace",
        altAnswers: ["if x is not strictly equal to y, return null"],
        noteEs: "en la práctica se prefiere la lectura natural de la variante",
      },
      {
        stem: "That's O(n log n) time and O(1) space.",
        answer: "That's oh of en log en time and oh of one space.",
      },
      {
        stem: "`https://api.example.com/v2.1/orders?status=paid&limit=50`",
        answer:
          "h-t-t-p-s colon slash slash a-p-i dot example dot com slash v-two point one slash orders question-mark status equals paid ampersand limit equals fifty",
      },
      {
        stem: "p99 went from 850ms to 120ms — about a 7x improvement.",
        answer:
          "p ninety-nine went from eight hundred and fifty mils to a hundred and twenty — about a seven-x improvement.",
      },
      {
        stem: "`SELECT * FROM events WHERE created_at > NOW() - INTERVAL '1 day';`",
        answer:
          "select star from events where created underscore at is greater than now open-close parens minus interval one day.",
      },
    ],
  },
  {
    id: "22E",
    unit: 22,
    kind: "choose",
    promptEs: "Elige el chunk para cada situación de entrevista.",
    items: [
      {
        stem: "Llevas veinte segundos en silencio y no ves la solución.",
        answer: "Let me think out loud for a second.",
      },
      {
        stem: "Te das cuenta de que tu enfoque no funciona a medio camino.",
        answer: "Actually, scrap that — let me back up. Here's a better way.",
      },
      {
        stem: "Quieres saber si el input puede estar vacío.",
        answer: "Can I assume the input is never empty, or should I handle that?",
      },
      {
        stem: "Quieres pedir una pista sin admitir derrota.",
        answer: "Am I on the right track?",
        altAnswers: ["Could I get a nudge on this bit?"],
      },
      {
        stem: "Terminaste y quieres mencionar un caso límite pendiente.",
        answer:
          "There's an edge case I haven't handled: what if the list contains duplicates?",
      },
    ],
  },
  {
    id: "22F",
    unit: 22,
    kind: "correct",
    promptEs: "Corrige el error de cada frase.",
    items: [
      {
        stem: "I have 5 years of experience working as developer.",
        answer: "I have 5 years of experience working as a developer.",
      },
      {
        stem: "Actually I work in a fintech company. (quieres decir \"actualmente\")",
        answer: "Currently I work at/for a fintech company.",
      },
      {
        stem: "I am agree with that approach.",
        answer: "I agree with that approach.",
      },
      {
        stem: "Explain me the requirements please.",
        answer: "Could you explain the requirements to me?",
      },
      {
        stem: "I have experience in Python since 3 years.",
        answer: "I've had experience in Python for 3 years.",
      },
      {
        stem: "We were 5 people in the team.",
        answer: "There were 5 of us on the team.",
      },
      {
        stem: "I made a master in computer science.",
        answer: "I did a master's in computer science.",
      },
      {
        stem: "My last job I was responsible of the API.",
        answer: "In my last job I was responsible for the API.",
      },
      {
        stem: "Can you repeat, please? I didn't listen you.",
        answer: "Sorry, could you say that again? I didn't hear you.",
      },
      {
        stem: "In my actual company we use microservices.",
        answer: "In my current company we use microservices.",
      },
    ],
  },
  {
    id: "22G",
    unit: 22,
    kind: "translate",
    promptEs: "Traduce al inglés.",
    items: [
      {
        stem: "Para dar contexto, hace un año estaba en un equipo de cinco personas manteniendo el servicio de pagos.",
        answer:
          "For context, about a year ago I was on a team of five maintaining the payments service.",
      },
      {
        stem: "Mi preocupación era que ya teníamos cuatro responsabilidades distintas en ese archivo.",
        answer:
          "My concern was that we already had four different responsibilities in that file.",
      },
      {
        stem: "Así que lo que hice fue pasar una tarde escribiendo una pequeña prueba de concepto.",
        answer:
          "So what I did was spend an afternoon writing a small proof of concept.",
      },
      {
        stem: "El resultado fue que optamos por el adaptador; nos costó unos dos días más al principio.",
        answer:
          "The outcome was that we went with the adapter; it took about two days longer up front.",
      },
      {
        stem: "Lo que me llevé de ahí es que una prueba de concepto que funciona mueve una conversación más rápido que una discusión.",
        answer:
          "What I took away from it is that a working proof of concept moves a conversation faster than an argument does.",
      },
      {
        stem: "Antes de empezar, ¿puedo aclarar un par de cosas?",
        answer: "Before I start, can I clarify a couple of things?",
      },
      {
        stem: "¿Qué debería pasar si la lista está vacía?",
        answer: "What should happen if the list is empty?",
      },
      {
        stem: "Mi primera idea es una solución de fuerza bruta, y luego busco optimizarla.",
        answer:
          "My first thought is a brute-force approach, and then I'll look at optimising.",
      },
      {
        stem: "Eso es tiempo lineal y espacio constante.",
        answer: "That's linear time and constant space.",
      },
      {
        stem: "Vamos a hacer unos números aproximados a ojo.",
        answer: "Let's do some rough back-of-the-envelope numbers.",
      },
    ],
  },

  // ────────────────────────── UNIT 23 ──────────────────────────
  {
    id: "23A",
    unit: 23,
    kind: "transform",
    promptEs: "Convierte cada concesión en concesión condicional.",
    items: [
      {
        stem: "OK, 84 is fine.",
        answer:
          "I could work with 84 if we bring the salary review forward to six months.",
      },
      {
        stem: "Sure, I can start on the 1st.",
        answer:
          "I can start on the 1st as long as the offer is confirmed in writing this week.",
      },
      {
        stem: "Fine, we'll add the third feature.",
        answer:
          "We can add the third feature if the second one moves to next sprint.",
      },
      {
        stem: "Alright, I'll take it on.",
        answer: "I'll take it on, provided I can hand off the reporting work.",
      },
    ],
  },
  {
    id: "23B",
    unit: 23,
    kind: "transform",
    promptEs: "Reformula sin decir \"no\".",
    items: [
      {
        stem: "It's impossible to do all three by Friday.",
        answer:
          "I can't see a way to do all three by Friday. We've got room for two — which two matter most?",
      },
      {
        stem: "No, that's not my job.",
        answer:
          "That's outside what I'm able to pick up — the right person would be X.",
      },
      {
        stem: "I don't have time.",
        answer: "I don't have the capacity this sprint.",
      },
      {
        stem: "You're wrong about the estimate.",
        answer: "I'd push back on that estimate a little — here's what I'm seeing.",
      },
      {
        stem: "I already told you that.",
        answer: "As I mentioned earlier, …",
      },
    ],
  },
  {
    id: "23C",
    unit: 23,
    kind: "order",
    promptEs: "Ordena una negociación de oferta en secuencia lógica.",
    items: [
      {
        stem: "(a) Is there any flexibility on the base? (b) Thanks — I'm really pleased. (c) If you could get to 88, I'd sign today. (d) Can I be upfront about the number? (e) Based on this market, I was expecting closer to 92. (f) One other thing while we're here…",
        answer: "b→d→e→a→c→f",
      },
    ],
  },
  {
    id: "23D",
    unit: 23,
    kind: "choose",
    promptEs:
      "El base está bloqueado: escribe una frase para cada palanca alternativa.",
    items: [
      {
        stem: "Palanca: signing bonus.",
        answer: "Is there room in the signing bonus?",
        noteEs: MODELO,
      },
      {
        stem: "Palanca: revisión a 6 meses.",
        answer: "Could we agree a review at six months rather than twelve?",
        noteEs: MODELO,
      },
      {
        stem: "Palanca: nivel.",
        answer: "Would you consider me at the next level up?",
        noteEs: MODELO,
      },
      {
        stem: "Palanca: remoto.",
        answer: "Would four days remote be possible?",
        noteEs: MODELO,
      },
      {
        stem: "Palanca: vacaciones.",
        answer: "Is there any flexibility on holiday allowance?",
        noteEs: MODELO,
      },
    ],
  },
  {
    id: "23E",
    unit: 23,
    kind: "order",
    promptEs: "Gradúa el pushback de más suave a más firme.",
    items: [
      {
        stem: "(a) I can't commit to that. (b) I'd push back on that a little. (c) I want to flag a risk with that plan. (d) I'll do it, but I want to be on record that I think it's the wrong call. (e) I'm not sure that follows.",
        answer: "e→b→c→a→d",
      },
    ],
  },
  {
    id: "23F",
    unit: 23,
    kind: "correct",
    promptEs: "Corrige el error de cada frase.",
    items: [
      {
        stem: "I want that you increase the salary.",
        answer: "I'd like you to increase the salary.",
      },
      {
        stem: "Is possible to negotiate the base?",
        answer: "Is it possible to negotiate the base?",
      },
      {
        stem: "I am agree with 84 if you move the review.",
        answer: "I'd be OK with 84 if you move the review.",
      },
      {
        stem: "I have a compromise on Friday. (quieres decir \"un compromiso/una cita\")",
        answer: "I have a commitment on Friday.",
        altAnswers: ["I have a meeting on Friday."],
      },
      {
        stem: "Sorry, but it's impossible. (evita \"impossible\")",
        answer: "I can't see a way to do that by Friday.",
      },
      {
        stem: "I will can start in September.",
        answer: "I'll be able to start in September.",
      },
      {
        stem: "Let me to think about it.",
        answer: "Let me think about it.",
      },
      {
        stem: "I expect that you understand my position.",
        answer: "I hope you'll understand my position.",
      },
      {
        stem: "We must to decide today.",
        answer: "We must decide today.",
      },
      {
        stem: "I don't have capacity for do it.",
        answer: "I don't have capacity to do it.",
      },
    ],
  },
  {
    id: "23G",
    unit: 23,
    kind: "translate",
    promptEs: "Traduce al inglés.",
    items: [
      {
        stem: "Gracias, me alegra oírlo, y me entusiasma el equipo de verdad.",
        answer:
          "Thanks — I'm really pleased to hear that, and I'm genuinely excited about the team.",
      },
      {
        stem: "¿Puedo ser franco contigo sobre la cifra?",
        answer: "Can I be upfront with you about the number?",
      },
      {
        stem: "Por lo que he visto en este mercado, esperaba algo más cercano a 92.",
        answer:
          "Based on what I've seen in this market, I was expecting something closer to 92.",
      },
      {
        stem: "¿Hay algún margen en el salario base?",
        answer: "Is there any flexibility on the base?",
      },
      {
        stem: "Te agradezco que lo consultes.",
        answer: "I appreciate you looking into it.",
      },
      {
        stem: "Que quede claro que el base es lo que más me importa.",
        answer:
          "Let me be clear that base is the piece that matters most to me.",
      },
      {
        stem: "Si pudieras llegar a 88, firmaría hoy mismo.",
        answer: "If you could get to 88, I'd sign today.",
      },
      {
        stem: "Y si la banda realmente no llega a eso, querría entender cuál es el camino al siguiente nivel.",
        answer:
          "And if the band genuinely caps out below that, I'd want to understand what the path to the next level looks like.",
      },
      {
        stem: "Podemos hacerlo. Lo que necesitaría sacar del sprint para que quepa es X.",
        answer:
          "We can do that. What I'd need to move out of the sprint to fit it in is X.",
      },
      {
        stem: "Tenemos sitio para dos de las tres. ¿Cuáles dos importan más?",
        answer: "We've got room for two of the three. Which two matter most?",
      },
    ],
  },

  // ────────────────────────── UNIT 24 ──────────────────────────
  {
    id: "24A",
    unit: 24,
    kind: "transform",
    promptEs: "Convierte cada juicio de identidad en observación de conducta.",
    items: [
      {
        stem: "You're careless.",
        answer:
          "The last four PRs came back with comments about unused imports and formatting.",
      },
      {
        stem: "You're not a team player.",
        answer:
          "In the last two sprints, you've picked up work without flagging it in stand-up, and twice it overlapped with what Tom was doing.",
      },
      {
        stem: "You're too slow.",
        answer:
          "The last three tickets took about twice the estimate, and the estimates hadn't changed.",
      },
      {
        stem: "You're negative in meetings.",
        answer:
          "In the last two design reviews, the first thing you said about each proposal was why it wouldn't work.",
      },
      {
        stem: "You don't communicate.",
        answer:
          "I found out about the schema change from the migration file rather than from you.",
      },
    ],
  },
  {
    id: "24B",
    unit: 24,
    kind: "transform",
    promptEs:
      "Completa la estructura SBI (Situación, Conducta, Impacto, Pregunta) para alguien que no actualiza los tickets.",
    items: [
      {
        stem: "S: In the last three sprints… B: … I: … Q: …",
        answer:
          "In the last three sprints, about half the tickets you've worked on have stayed in \"In Progress\" until the day of the demo. The impact is that the board doesn't reflect reality, so I end up answering questions about your work with guesses — and twice we've had two people on the same thing. How does that land with you?",
        noteEs: MODELO,
      },
    ],
  },
  {
    id: "24C",
    unit: 24,
    kind: "classify",
    promptEs: "Clasifica el nivel de delegación (1–4).",
    items: [
      {
        stem: "Could you run the script on staging?",
        answer: "nivel 1",
      },
      {
        stem: "This is yours end to end.",
        answer: "nivel 4",
      },
      {
        stem: "Look into the options and come back with a recommendation.",
        answer: "nivel 2",
      },
      {
        stem: "Make the call and let me know what you decide.",
        answer: "nivel 3",
      },
    ],
  },
  {
    id: "24D",
    unit: 24,
    kind: "transform",
    promptEs:
      "Reescribe como delegación completa (qué, por qué, resultado, límites, apoyo, confianza).",
    items: [
      {
        stem: "Fix the caching.",
        answer:
          "I'd like you to take ownership of the caching layer. You've done the most work on the read path, and this is a good chance to own something end to end. What I care about is that p99 comes down below 200 ms — how you get there is up to you. Two constraints: no new infrastructure, and it needs to sit behind a flag. Come to me if you're blocked, and let's check in on Thursday. You don't need to run every decision past me.",
        noteEs: MODELO,
      },
    ],
  },
  {
    id: "24E",
    unit: 24,
    kind: "transform",
    promptEs: "Sustituye cada consejo directo por una pregunta de coaching.",
    items: [
      {
        stem: "You should use a queue for that.",
        answer: "What's making this slow — is it the volume or the ordering?",
      },
      {
        stem: "I'd add an index.",
        answer: "What does the query plan look like?",
      },
      {
        stem: "That won't work.",
        answer: "What would need to be true for that to work?",
      },
      {
        stem: "Just do it the way we did last time.",
        answer: "What's different about this case compared to last time?",
      },
    ],
  },
  {
    id: "24F",
    unit: 24,
    kind: "correct",
    promptEs: "Corrige el error de cada frase.",
    items: [
      {
        stem: "I want to give you a feedback.",
        answer: "I want to give you some feedback.",
      },
      {
        stem: "You are always making the same mistakes. (evita la acusación)",
        answer: "The last four PRs came back with the same comments.",
      },
      {
        stem: "I recommend you to run the tests.",
        answer: "I recommend running the tests.",
        altAnswers: ["I recommend that you run the tests."],
      },
      {
        stem: "Let me explain you the context.",
        answer: "Let me explain the context to you.",
      },
      {
        stem: "I need that you update the tickets.",
        answer: "I need you to update the tickets.",
      },
      {
        stem: "Everybody are saying the same.",
        answer: "Everybody is saying the same.",
      },
      {
        stem: "Thanks for take it well.",
        answer: "Thanks for taking it well.",
      },
      {
        stem: "He said me that he is blocked.",
        answer: "He told me that he was blocked.",
      },
      {
        stem: "I am agree with your decision.",
        answer: "I agree with your decision.",
      },
      {
        stem: "Can we to talk about it?",
        answer: "Can we talk about it?",
      },
    ],
  },
  {
    id: "24G",
    unit: 24,
    kind: "translate",
    promptEs: "Traduce al inglés.",
    items: [
      {
        stem: "Hay algo que quiero comentarte, y prefiero hacerlo directamente que dejarlo pasar.",
        answer:
          "There's something I want to raise, and I'd rather do it directly than let it sit.",
      },
      {
        stem: "Los últimos cuatro PRs han vuelto con quince o veinte comentarios cada uno.",
        answer:
          "The last four PRs have each come back with fifteen or twenty comments.",
      },
      {
        stem: "El impacto es que las revisiones tardan dos o tres días en lugar de unas horas.",
        answer:
          "The impact is that reviews are taking two or three days instead of a few hours.",
      },
      {
        stem: "¿Cómo te suena eso?",
        answer: "How does that land with you?",
      },
      {
        stem: "Tiene sentido, y entiendo la presión.",
        answer: "That makes sense, and I get the pressure.",
      },
      {
        stem: "Mi preocupación es que no nos está haciendo más rápidos.",
        answer: "My concern is that it's not actually making us faster.",
      },
      {
        stem: "¿Qué te ayudaría a ejecutar las comprobaciones en local antes de abrir un PR?",
        answer: "What would help you run the checks locally before you open a PR?",
      },
      {
        stem: "Lo que me importa es que el p99 baje de 200 ms; cómo lo consigas depende de ti.",
        answer:
          "What I care about is that p99 comes down below 200 ms; how you get there is up to you.",
      },
      {
        stem: "No necesitas consultarme cada decisión.",
        answer: "You don't need to run every decision past me.",
      },
      {
        stem: "¿Hay algo que quieras que yo haga de otra manera?",
        answer: "Anything you'd want me to be doing differently?",
      },
    ],
  },

  // ────────────────────────── UNIT 25 ──────────────────────────
  {
    id: "25A",
    unit: 25,
    kind: "transform",
    promptEs:
      "Añade signposting: inserta las señales que faltan en el esqueleto de la charla.",
    items: [
      {
        stem: "Deploys were slow. We measured it. We fixed the tests. We changed ownership. It worked.",
        answer:
          "Here's where we started: deploys were slow. First, we measured the problem — and we spent two months fixing the wrong thing. Second, we fixed the tests, which cut the time in half. And third — and this is the part I'd want you to take away — none of it stuck until we changed who owned the pipeline. So, to bring it back to where we started: it worked, but not for the reason we expected.",
        noteEs: MODELO,
      },
    ],
  },
  {
    id: "25B",
    unit: 25,
    kind: "translate",
    promptEs: "Describe la tendencia en inglés.",
    items: [
      {
        stem: "Baja bruscamente en marzo.",
        answer: "It drops off sharply in March.",
      },
      {
        stem: "Se estabiliza a partir de junio.",
        answer: "It levels off from June onwards.",
        altAnswers: ["It plateaus after June."],
      },
      {
        stem: "Hay un pico en diciembre.",
        answer: "There's a spike in December.",
      },
      {
        stem: "Sube de forma gradual todo el año.",
        answer: "It climbs steadily all year.",
      },
      {
        stem: "Es una mejora de cinco veces.",
        answer: "That's roughly a fivefold improvement.",
      },
    ],
  },
  {
    id: "25C",
    unit: 25,
    kind: "choose",
    promptEs: "Elige la frase para cada crisis de demo.",
    items: [
      {
        stem: "La página tarda diez segundos en cargar.",
        answer: "This normally takes about a second — give it a moment.",
      },
      {
        stem: "La demo falla del todo.",
        answer:
          "I'm not going to fight with it. Let me show you the recording instead.",
      },
      {
        stem: "Quieres saltarte el login.",
        answer: "I'll skip the login — assume I'm already authenticated.",
      },
      {
        stem: "Quieres que miren un contador.",
        answer: "Keep an eye on the counter in the corner.",
      },
    ],
  },
  {
    id: "25D",
    unit: 25,
    kind: "choose",
    promptEs: "Elige la respuesta adecuada para cada situación de Q&A.",
    items: [
      {
        stem: "No has entendido la pregunta.",
        answer: "Sorry, could you repeat the last part?",
      },
      {
        stem: "No sabes la respuesta.",
        answer: "I don't know. My guess would be X, but I'd want to check.",
      },
      {
        stem: "Alguien dice que tu enfoque está mal.",
        answer: "That's a fair challenge. Here's why we went the other way.",
      },
      {
        stem: "Alguien está dando un discurso en lugar de preguntar.",
        answer: "I think there's a question in there — is it about X?",
      },
      {
        stem: "La pregunta requiere media hora.",
        answer:
          "That's a bigger question than I can do justice to here — can we talk afterwards?",
      },
    ],
  },
  {
    id: "25E",
    unit: 25,
    kind: "correct",
    promptEs: "Corrige el error de cada frase.",
    items: [
      {
        stem: "In conclusion, I would like to thank you for your attention.",
        answer: "That's all I've got — thanks.",
      },
      {
        stem: "I will explain you the architecture.",
        answer: "I'll explain the architecture to you.",
      },
      {
        stem: "As you can see in the graphic… (quieres decir \"gráfico\")",
        answer: "As you can see in the chart…",
        altAnswers: ["As you can see in the graph…"],
      },
      {
        stem: "The x-axis represent the time.",
        answer: "The x-axis represents time.",
      },
      {
        stem: "I want to talk about of the pipeline.",
        answer: "I want to talk about the pipeline.",
      },
      {
        stem: "Any question?",
        answer: "Any questions?",
      },
      {
        stem: "Somebody has a question?",
        answer: "Does anyone have a question?",
      },
      {
        stem: "Let me to show you.",
        answer: "Let me show you.",
      },
      {
        stem: "I am going to speak about how we did it during 20 minutes.",
        answer: "I'm going to talk about how we did it for 20 minutes.",
      },
      {
        stem: "Sorry, I am very nervous, my English is bad.",
        answer: "Elimínalo por completo.",
      },
    ],
  },
  {
    id: "25F",
    unit: 25,
    kind: "translate",
    promptEs: "Traduce al inglés.",
    items: [
      {
        stem: "Gracias por invitarme.",
        answer: "Thanks for having me.",
      },
      {
        stem: "Durante los próximos veinte minutos quiero hablar de algo que hicimos muy mal y luego arreglamos.",
        answer:
          "For the next twenty minutes I want to talk about something we got badly wrong and then fixed.",
      },
      {
        stem: "Aquí es donde empezamos; aquí es donde acabamos.",
        answer: "Here's where we started. Here's where we ended up.",
      },
      {
        stem: "Lo que no voy a hacer es deciros qué herramientas usar; esa no es la parte interesante.",
        answer:
          "What I'm not going to do is tell you which tools to use — that's not the interesting part.",
      },
      {
        stem: "En lo que quiero centrarme es en las tres decisiones que de verdad importaron.",
        answer:
          "What I want to focus on instead is the three decisions that actually mattered.",
      },
      {
        stem: "Dos de ellas fueron organizativas más que técnicas.",
        answer: "Two of them were organisational rather than technical.",
      },
      {
        stem: "Y en tercer lugar, y esta es la parte que querría que os llevarais…",
        answer:
          "And third — and this is the part I'd want you to take away…",
      },
      {
        stem: "Volviendo a donde empezamos: el pipeline no era lento porque las herramientas fueran malas.",
        answer:
          "So, to bring it back to where we started: the pipeline wasn't slow because our tooling was bad.",
      },
      {
        stem: "Si os lleváis una sola cosa de esta charla, que sea esa.",
        answer: "If you take one thing from this talk, make it that.",
      },
      {
        stem: "No lo sé. Mi intuición sería X, pero querría comprobarlo.",
        answer: "I don't know. My instinct would be X, but I'd want to check.",
      },
    ],
  },

  // ────────────────────────── UNIT 26 ──────────────────────────
  {
    id: "26A",
    unit: 26,
    kind: "transform",
    promptEs: "Reescribe el mensaje con BLUF (lo importante primero).",
    items: [
      {
        stem: "Hi Tom, as you may know we've been looking at the caching layer for a while, and after various tests and discussion with the platform team about the trade-offs, we've come to the conclusion that it would probably be best to upgrade Redis. Could you approve it?",
        answer:
          "Hi Tom — could you approve the Redis upgrade by Thursday? It unblocks the caching work. We tested three options and Redis 7 is the only one that supports X. Details in the doc if you need them, and happy to walk through it on a call if that's easier.",
        noteEs: MODELO,
      },
    ],
  },
  {
    id: "26B",
    unit: 26,
    kind: "transform",
    promptEs: "Escribe la línea de asunto para cada situación.",
    items: [
      {
        stem: "Necesitas aprobación de un presupuesto antes del viernes.",
        answer: "Approval needed: Q3 tooling budget (by Fri)",
      },
      {
        stem: "Informas de que la migración va bien pero hay un riesgo.",
        answer: "Migration update: on track for Friday, one risk",
      },
      {
        stem: "Un certificado caduca hoy a las 18:00.",
        answer: "Action needed today: cert expires at 18:00",
      },
      {
        stem: "Quieres mover una reunión.",
        answer: "Can we move Thursday's design review to 15:00?",
      },
    ],
  },
  {
    id: "26C",
    unit: 26,
    kind: "transform",
    promptEs:
      "Ajusta el registro: escribe \"necesito esto para el jueves\" en los tres niveles.",
    items: [
      {
        stem: "Slack.",
        answer: "Need this by Thursday if possible — no rush before then.",
      },
      {
        stem: "Email interno.",
        answer: "Could you get this to me by Thursday? Happy to help if that's tight.",
      },
      {
        stem: "Formal externo.",
        answer:
          "I would be grateful if you could provide this by Thursday, 6 August.",
      },
    ],
  },
  {
    id: "26D",
    unit: 26,
    kind: "transform",
    promptEs:
      "Escribe un PR description de cinco bloques para un cambio real que hayas hecho.",
    items: [
      {
        stem: "Redacta la descripción del PR con los cinco bloques (What / Why / How / Testing / Risks).",
        answer: "Producción libre: no hay respuesta única.",
        noteEs:
          "Criterio de corrección del solucionario: los cinco bloques presentes, el Why con enlace al ticket, el How explicando por qué ese enfoque y no otro, el Testing incluyendo lo que no probaste, y el Risks con un plan de reversión concreto.",
      },
    ],
  },
  {
    id: "26E",
    unit: 26,
    kind: "transform",
    promptEs: "Reescribe estos mensajes de Slack.",
    items: [
      {
        stem: "Hi",
        answer: "Hi — quick one: is the staging DB meant to be read-only?",
      },
      {
        stem: "Does the API work?",
        answer:
          "Getting a 403 from /v2/orders with a token that worked yesterday — did something change?",
      },
      {
        stem: "URGENT!!! I need this now",
        answer:
          "This is blocking me, sorry to push — any chance you could look before 3?",
      },
      {
        stem: "No.",
        answer: "Not this one, I'm afraid — capacity's full this sprint.",
      },
      {
        stem: "Do it.",
        answer: "Could you pick this up when you get a chance?",
      },
    ],
  },
  {
    id: "26F",
    unit: 26,
    kind: "correct",
    promptEs: "Corrige el error de cada frase.",
    items: [
      {
        stem: "Dear Tom, I am writing you in order to request your approval.",
        answer: "Hi Tom, I'm writing to you to request your approval.",
        altAnswers: ["Hi Tom — could you approve X?"],
        noteEs: "la variante corta es la preferible",
      },
      {
        stem: "Please find attached the document that I have mentioned before.",
        answer: "I've attached the document I mentioned.",
      },
      {
        stem: "I remain at your disposal for any doubt.",
        answer: "Let me know if you have any questions.",
      },
      {
        stem: "Thanks for your attention, greetings.",
        answer: "Thanks — best,",
      },
      {
        stem: "I would be grateful if you can send me the numbers.",
        answer: "I would be grateful if you could send me the numbers.",
      },
      {
        stem: "Sorry for the inconvenients.",
        answer: "Sorry for the inconvenience.",
      },
      {
        stem: "I send you the report in attach.",
        answer: "I've attached the report.",
      },
      {
        stem: "Waiting for your answer.",
        answer: "Looking forward to hearing from you.",
      },
      {
        stem: "Please advise if you need any doubt clarified.",
        answer: "Let me know if anything needs clarifying.",
      },
      {
        stem: "According to my last email…",
        answer: "As I mentioned in my last email…",
      },
    ],
  },
  {
    id: "26G",
    unit: 26,
    kind: "translate",
    promptEs: "Traduce al inglés.",
    items: [
      {
        stem: "¿Podrías aprobar la actualización de Redis antes del jueves? Desbloquea el trabajo de caché.",
        answer:
          "Could you approve the Redis upgrade by Thursday? It unblocks the caching work.",
      },
      {
        stem: "Probamos tres opciones y Redis 7 es la única que soporta X.",
        answer: "We tested three options and Redis 7 is the only one that supports X.",
      },
      {
        stem: "Encantado de explicártelo por llamada si es más fácil.",
        answer: "Happy to walk you through it on a call if that's easier.",
      },
      {
        stem: "Si no me dices nada, doy por bueno y sigo adelante.",
        answer: "If I don't hear back, I'll assume it's fine and proceed.",
      },
      {
        stem: "Opté por Redis en lugar de contadores en memoria porque corremos seis réplicas.",
        answer:
          "I went with Redis rather than in-process counters because we run six replicas.",
      },
      {
        stem: "No probado: el comportamiento cuando Redis no está disponible.",
        answer: "Not tested: behaviour when Redis is unavailable.",
      },
      {
        stem: "Falla en abierto por diseño, y creo que es lo correcto, pero conviene una segunda opinión.",
        answer:
          "It fails open by design, which I think is right, but it's worth a second opinion.",
      },
      {
        stem: "La reversión es la feature flag, sin migración de por medio.",
        answer: "Rollback is the feature flag, no migration involved.",
      },
      {
        stem: "Aviso: hemos movido el despliegue al jueves.",
        answer: "Heads up: we've moved the deploy to Thursday.",
      },
      {
        stem: "Visto, lo estoy mirando ahora.",
        answer: "Seen this — looking now.",
      },
    ],
  },
];

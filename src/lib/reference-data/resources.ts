/**
 * Apéndice K del libro fuente — Recursos recomendados para seguir aprendiendo.
 * Transcripción fiel de la tabla de recursos, más la advertencia final como
 * recurso de categoría "advertencia".
 */

export interface LearningResource {
  category: string;
  name: string;
  noteEs: string;
}

export const LEARNING_RESOURCES: LearningResource[] = [
  // Diccionarios
  {
    category: "diccionarios",
    name: "Cambridge Dictionary online",
    noteEs: "IPA + audio US/UK + colocaciones. El mejor para aprendices.",
  },
  {
    category: "diccionarios",
    name: "Longman Dictionary of Contemporary English",
    noteEs: "Definiciones con vocabulario controlado.",
  },
  {
    category: "diccionarios",
    name: "Ozdic / Oxford Collocations Dictionary",
    noteEs: "Qué palabra va con qué.",
  },

  // Pronunciación
  {
    category: "pronunciación",
    name: "YouGlish",
    noteEs: "Busca una palabra y la oyes en cientos de vídeos reales.",
  },
  {
    category: "pronunciación",
    name: "Forvo",
    noteEs: "Palabras sueltas por nativos de distintas regiones.",
  },
  {
    category: "pronunciación",
    name: "Un sintetizador de voz + tu grabación",
    noteEs: "Comparar tu producción con la referencia.",
  },

  // Speech-to-text
  {
    category: "speech-to-text",
    name: "El dictado del sistema operativo, en inglés",
    noteEs: "Detector de errores de pronunciación gratuito y brutalmente honesto.",
  },

  // Repaso espaciado
  {
    category: "repaso espaciado",
    name: "Anki",
    noteEs: "Tarjetas cloze con las tablas de este libro.",
  },
  {
    category: "repaso espaciado",
    name: "Papel + caja de Leitner",
    noteEs: "Si prefieres no usar software.",
  },

  // Input técnico
  {
    category: "input técnico",
    name: "Podcasts de ingeniería (transcripción incluida)",
    noteEs: "Shadowing con contenido relevante.",
  },
  {
    category: "input técnico",
    name: "Charlas de conferencias con subtítulos",
    noteEs: "Signposting real.",
  },
  {
    category: "input técnico",
    name: "Postmortems públicos de empresas grandes",
    noteEs: "El registro exacto de la Unidad 19 y 26.",
  },
  {
    category: "input técnico",
    name: "ADRs en repositorios abiertos",
    noteEs: "El registro exacto de la Unidad 26.",
  },
  {
    category: "input técnico",
    name: "Hilos de code review en proyectos abiertos",
    noteEs: "El registro exacto de la Unidad 13.",
  },

  // Producción
  {
    category: "producción",
    name: "Un canal de Slack o Discord técnico en inglés",
    noteEs: "Output de bajo riesgo, diario.",
  },
  {
    category: "producción",
    name: "Escribir tus commits y PRs en inglés desde hoy",
    noteEs: "Práctica integrada en el trabajo.",
  },
  {
    category: "producción",
    name: "Un intercambio de conversación semanal",
    noteEs: "El único sustituto real del interlocutor.",
  },

  // Referencia gramatical
  {
    category: "gramática",
    name: "Practical English Usage, Michael Swan",
    noteEs: "La consulta definitiva cuando dudes.",
  },
  {
    category: "gramática",
    name: "English Grammar in Use, Raymond Murphy",
    noteEs: "Ejercicios adicionales de refuerzo.",
  },

  // Léxico
  {
    category: "léxico",
    name: "The Lexical Approach, Michael Lewis",
    noteEs: "El marco teórico del enfoque en chunks.",
  },

  // Aprendizaje
  {
    category: "aprendizaje",
    name: "Make It Stick, Brown, Roediger & McDaniel",
    noteEs: "La ciencia del repaso y la recuperación.",
  },
  {
    category: "aprendizaje",
    name: "Peak, Ericsson & Pool",
    noteEs: "Práctica deliberada.",
  },
  {
    category: "aprendizaje",
    name: "The Adult Learner, Malcolm Knowles",
    noteEs: "Andragogía, la base de la Parte 0.",
  },

  // Advertencia final del apéndice
  {
    category: "advertencia",
    name: "Lo único que no puede sustituirse: producción hablada con corrección",
    noteEs:
      "Si puedes permitirte una sola cosa de pago, que sea una hora semanal con un profesor que corrija tu pronunciación, no que converse contigo. Conversar sin corrección fosiliza los errores; es lo que produce la meseta de la que habla la sección 0.8.",
  },
];

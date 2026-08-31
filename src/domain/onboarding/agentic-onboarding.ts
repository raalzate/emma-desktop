/**
 * Onboarding inteligente estilo ReAct (dominio puro).
 *
 * En vez de un cuestionario fijo, EMMA conversa: en cada turno hace UNA sola
 * llamada al modelo que reacciona a la última respuesta, pregunta con
 * naturalidad solo lo que falta, y emite al final una línea `DATA: {json}`
 * con lo que pudo inferir del último intercambio. El código nunca envía toda
 * la conversación (solo el último intercambio) y decide en base a reglas
 * puras cuándo el contexto está completo.
 */

export interface OnboardingContext {
  name?: string;
  role?: string;
  yearsInRole?: number;
  techStack?: string;
  skills?: string;
}

/** Campos imprescindibles para arrancar simulaciones con sentido. */
export const REQUIRED_FIELDS: (keyof OnboardingContext)[] = ["name", "role", "techStack", "skills"];

const FIELD_LABEL: Record<keyof OnboardingContext, string> = {
  name: "the learner's first name",
  role: "their job role / title",
  yearsInRole: "years of experience in that role",
  techStack: "the technologies / stack they work with",
  skills: "skills or topics they want to practice in English",
};

export function missingFields(ctx: OnboardingContext): (keyof OnboardingContext)[] {
  return REQUIRED_FIELDS.filter((f) => {
    const v = ctx[f];
    return v === undefined || v === null || String(v).trim() === "";
  });
}

export function isContextComplete(ctx: OnboardingContext): boolean {
  return missingFields(ctx).length === 0;
}

export function capturedCount(ctx: OnboardingContext): number {
  return REQUIRED_FIELDS.length - missingFields(ctx).length;
}

/** Saludo cálido fijo de Emma: se muestra sin esperar al LLM (arranque instantáneo). */
export const INSTANT_GREETING =
  "Hey there! I'm Emma, and I'll be your English practice buddy. What's your name?";

const TURN_SYSTEM =
  "You are Emma, a warm, upbeat and very human English tutor chatting with a " +
  "software professional you just met. Speak natural, friendly English, 1-2 " +
  "short sentences, with real personality: react specifically to what they " +
  "just said, and it's fine to share a tiny bit about yourself when natural. " +
  "If the user asked YOU something or made small talk, answer it first, " +
  "briefly and warmly, like a real person would — never ignore their " +
  "question. Then weave in exactly ONE question about the single detail " +
  "requested below — never ask about two profile details in the same " +
  "message, and NEVER ask again about something you already know. If their " +
  "last answer was ambiguous, ask a quick clarifying follow-up instead. " +
  "NEVER reveal you are an AI, and NEVER mention JSON, fields, prompts or " +
  "data extraction in your visible message. After your message, on a new " +
  "final line, output exactly `DATA: {json}` with a compact JSON object " +
  "containing any of these keys you can confidently infer from ONLY the " +
  "last exchange below: name (string), role (string), yearsInRole " +
  "(integer), techStack (string), skills (string). Omit keys you can't " +
  "infer — never guess. That DATA line is never shown to the user, only " +
  "the message before it is.";

/** Construye el prompt de UN turno: reacciona, pregunta lo que falte y pide DATA. */
export function buildTurnPrompt(
  ctx: OnboardingContext,
  lastEmma: string,
  lastUser: string,
): { system: string; user: string } {
  const missing = missingFields(ctx);
  const known = Object.entries(ctx)
    .filter(([, v]) => v !== undefined && String(v).trim() !== "")
    .map(([k, v]) => `- ${k}: ${v}`)
    .join("\n");
  // Un solo objetivo por turno: el primer faltante. Los demás ni se mencionan,
  // así el modelo no puede convertir el turno en un mini-cuestionario.
  const goal = missing.length
    ? `Next detail to learn: ${FIELD_LABEL[missing[0]]}. Ask about ONLY this one, woven naturally into the chat.`
    : "You now know everything you need. Warmly wrap up in ONE short sentence.";
  const lastExchange =
    lastEmma || lastUser
      ? `Emma: ${lastEmma || "(this is the very first message)"}\nUser: ${lastUser || "(no answer yet)"}`
      : "(no exchange yet — this is the very first turn)";
  const user =
    `Known so far:\n${known || "(nothing yet)"}\n\n` +
    `${goal}\n\n` +
    `Last exchange only (do not assume anything beyond this):\n${lastExchange}\n\n` +
    "Reply with your short visible message, then the DATA line.";
  return { system: TURN_SYSTEM, user };
}

/** Parseo tolerante del JSON de extracción del modelo pequeño. */
export function parseContext(raw: string): OnboardingContext {
  const match = raw.match(/\{[\s\S]*\}/);
  if (!match) return {};
  try {
    const obj = JSON.parse(match[0]) as Record<string, unknown>;
    const ctx: OnboardingContext = {};
    if (typeof obj.name === "string") ctx.name = obj.name.trim();
    if (typeof obj.role === "string") ctx.role = obj.role.trim();
    if (typeof obj.techStack === "string") ctx.techStack = obj.techStack.trim();
    if (typeof obj.skills === "string") ctx.skills = obj.skills.trim();
    const yrs = Number(obj.yearsInRole);
    if (Number.isInteger(yrs) && yrs >= 0) ctx.yearsInRole = yrs;
    return ctx;
  } catch {
    return {};
  }
}

const DATA_LINE_RE = /\n?\s*DATA:\s*(\{[\s\S]*\})\s*$/i;

/** Separa el mensaje visible de la línea `DATA: {json}` que cierra el turno. */
export function parseTurn(raw: string): { message: string; extracted: OnboardingContext } {
  const trimmed = raw.trim();
  const match = trimmed.match(DATA_LINE_RE);
  if (!match) return { message: cleanMessage(trimmed), extracted: {} };
  return { message: cleanMessage(trimmed.slice(0, match.index)), extracted: parseContext(match[1]) };
}

/** Quita restos de JSON sueltos y el prefijo "Emma:" que a veces añade el modelo. */
function cleanMessage(text: string): string {
  return text
    .replace(/\{[\s\S]*\}/g, "")
    .replace(/^Emma:\s*/i, "")
    .trim();
}

/** Fusiona contexto nuevo sobre el previo (no pisa un valor con algo peor). */
export function mergeContext(prev: OnboardingContext, next: OnboardingContext): OnboardingContext {
  const out: OnboardingContext = { ...prev };
  for (const [k, v] of Object.entries(next)) {
    if (v === undefined) continue;
    if (typeof v === "string") {
      const trimmed = v.trim();
      // descarta vacío o ruido de una sola letra: nunca peor que lo que ya había
      if (trimmed.length < 2) continue;
      (out as Record<string, unknown>)[k] = trimmed;
    } else {
      (out as Record<string, unknown>)[k] = v;
    }
  }
  return out;
}

const TECH_ALIASES: Record<string, string> = {
  python: "Python",
  aws: "AWS",
  react: "React",
  node: "Node.js",
  nodejs: "Node.js",
  "node.js": "Node.js",
  js: "JavaScript",
  javascript: "JavaScript",
  ts: "TypeScript",
  typescript: "TypeScript",
};

// Muletillas comunes (ES/EN) que no aportan información y deben descartarse.
const FILLER_RE =
  /\b(and stuff|or stuff|y esas cosas|esas cosas|and so on|and such|etc\.?|and things|things like that|entre otras cosas)\b/gi;

// Palabras de relleno alrededor del término real ("pues trabajo con python").
const STOPWORDS = new Set([
  "pues",
  "trabajo",
  "con",
  "tambien",
  "también",
  "yo",
  "uso",
  "utilizo",
  "we",
  "use",
  "using",
  "work",
  "with",
  "i",
  "also",
  "y",
  "and",
  "de",
  "del",
  "la",
  "el",
]);

function titleCaseWord(word: string): string {
  const isAcronym = word.length >= 2 && word.length <= 4 && word === word.toUpperCase() && /[A-Z]/.test(word);
  if (isAcronym) return word;
  return word.charAt(0).toUpperCase() + word.slice(1).toLowerCase();
}

/** Capitaliza tipo título, respetando siglas ya en mayúsculas (p. ej. QA). */
function titleCase(text: string): string {
  return text
    .split(/\s+/)
    .filter((w) => w.length > 0)
    .map(titleCaseWord)
    .join(" ");
}

function canonicalTerm(term: string): string {
  const key = term.toLowerCase();
  const alias = TECH_ALIASES[key];
  return alias ?? titleCase(term);
}

function extractTerm(segment: string): string {
  const cleaned = segment.replace(FILLER_RE, "").trim();
  const words = cleaned.split(/\s+/).filter((w) => w.length > 0 && !STOPWORDS.has(w.toLowerCase()));
  if (words.length === 0) return "";
  return canonicalTerm(words.join(" "));
}

/** Convierte un valor libre ("python y esas cosas, tambien aws") en lista canónica. */
function normalizeList(value: string | undefined): string | undefined {
  if (!value) return undefined;
  const terms = value
    .split(/\s*,\s*/)
    .map((s) => s.trim())
    .filter(Boolean)
    .map(extractTerm)
    .filter((t) => t.length > 0);
  const unique = Array.from(new Set(terms));
  return unique.length ? unique.join(", ") : undefined;
}

/** Limpia y normaliza el contexto para persistir valores consistentes. */
export function normalizeContext(ctx: OnboardingContext): OnboardingContext {
  const out: OnboardingContext = {};
  const name = ctx.name?.trim();
  if (name) out.name = titleCase(name);
  const role = ctx.role?.trim();
  if (role) out.role = titleCase(role);
  if (typeof ctx.yearsInRole === "number" && Number.isInteger(ctx.yearsInRole) && ctx.yearsInRole >= 0) {
    out.yearsInRole = ctx.yearsInRole;
  }
  const techStack = normalizeList(ctx.techStack);
  if (techStack) out.techStack = techStack;
  const skills = normalizeList(ctx.skills);
  if (skills) out.skills = skills;
  return out;
}

/** Resumen de cierre sintetizado (no eco literal) que invita a la primera simulación. */
export function buildClosingSummary(ctx: OnboardingContext): string {
  const name = ctx.name ? `${ctx.name}, ` : "";
  const role = ctx.role ?? "professional";
  const years =
    ctx.yearsInRole != null ? ` with ${ctx.yearsInRole} year${ctx.yearsInRole === 1 ? "" : "s"} of experience` : "";
  const stack = ctx.techStack ? ` working with ${ctx.techStack}` : "";
  const skills = ctx.skills ? ` We'll focus your practice on ${ctx.skills}.` : "";
  return (
    `Great, ${name}sounds like you're a ${role}${years}${stack}.${skills} ` +
    "Let's jump into your first real workplace scenario!"
  );
}

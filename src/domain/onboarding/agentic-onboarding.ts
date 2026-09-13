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
  "data extraction in your visible message. Never write notes to yourself " +
  "about the task, and never use parentheses to comment on what you are " +
  "doing or on the response you expect. After your message, on a new " +
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
  skip: readonly (keyof OnboardingContext)[] = [],
): { system: string; user: string } {
  // `skip`: campos abandonados tras el tope de intentos — no se vuelven a pedir.
  const missing = missingFields(ctx).filter((f) => !skip.includes(f));
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

const DATA_LINE_RE = /DATA:/i;
const FENCE_RE = /```(?:json)?\s*\n?([\s\S]*?)```/i;

interface JsonSpan {
  before: string;
  after: string;
  json: string;
}

/** Busca el JSON balanceado (cuenta llaves) que arranca en `start`. */
function findBalancedJson(text: string, start: number): { json: string; end: number } | null {
  if (text[start] !== "{") return null;
  let depth = 0;
  for (let i = start; i < text.length; i++) {
    if (text[i] === "{") depth++;
    else if (text[i] === "}") {
      depth--;
      if (depth === 0) return { json: text.slice(start, i + 1), end: i + 1 };
    }
  }
  return null; // llave sin cerrar: no es JSON válido
}

/** Caso 1: línea `DATA: {json}` en cualquier posición del texto (no solo al final). */
function extractAfterDataPrefix(text: string): JsonSpan | null {
  const idx = text.search(DATA_LINE_RE);
  if (idx === -1) return null;
  const braceStart = text.indexOf("{", idx);
  if (braceStart === -1) return null;
  const balanced = findBalancedJson(text, braceStart);
  if (!balanced) return null;
  return { before: text.slice(0, idx).trimEnd(), after: text.slice(balanced.end).trimStart(), json: balanced.json };
}

/** Caso 2: JSON dentro de un fence ```json ... ``` sin prefijo `DATA:`. */
function extractFromFence(text: string): JsonSpan | null {
  const match = text.match(FENCE_RE);
  if (!match || match.index === undefined) return null;
  const inner = match[1].trim();
  const braceStart = inner.indexOf("{");
  const balanced = braceStart === -1 ? null : findBalancedJson(inner, braceStart);
  const json = balanced ? balanced.json : inner;
  return {
    before: text.slice(0, match.index).trimEnd(),
    after: text.slice(match.index + match[0].length).trimStart(),
    json,
  };
}

/** Caso 3: JSON desnudo, solo en su propia línea (sin `DATA:` ni fence). */
function extractBareJsonLine(text: string): JsonSpan | null {
  const lines = text.split("\n");
  let offset = 0;
  for (const line of lines) {
    const trimmedLine = line.trim();
    if (trimmedLine.startsWith("{") && trimmedLine.endsWith("}")) {
      const braceStart = text.indexOf("{", offset);
      const balanced = findBalancedJson(text, braceStart);
      if (balanced) {
        return {
          before: text.slice(0, offset).trimEnd(),
          after: text.slice(balanced.end).trimStart(),
          json: balanced.json,
        };
      }
    }
    offset += line.length + 1; // +1 por el "\n" que se pierde al hacer split
  }
  return null;
}

/** Separa el mensaje visible del JSON de extracción, sin importar cómo lo formateó el modelo. */
export function parseTurn(raw: string): { message: string; extracted: OnboardingContext } {
  const trimmed = raw.trim();
  const found = extractAfterDataPrefix(trimmed) ?? extractFromFence(trimmed) ?? extractBareJsonLine(trimmed);
  if (!found) return { message: cleanMessage(trimmed), extracted: {} };
  const message = cleanMessage([found.before, found.after].filter((s) => s.length > 0).join("\n"));
  return { message, extracted: parseContext(found.json) };
}

// Marcas de que un paréntesis es una nota del modelo sobre su tarea, no charla.
const META_NOTE_RE =
  /\((?=[^)]*\b(?:placeholder|actual response|real goal|prompt|instruction|extraction|json|data line|as an ai|note to self)\b)[^)]*\)/gi;

/** Quita restos de JSON, fences, notas meta y el prefijo "Emma:" que añade el modelo. */
function cleanMessage(text: string): string {
  return text
    .replace(/```[a-z]*\n?/gi, "")
    .replace(/```/g, "")
    .replace(/\{[\s\S]*\}/g, "")
    .replace(META_NOTE_RE, "")
    .replace(/^Emma:\s*/i, "")
    .replace(/\n{3,}/g, "\n\n")
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

/**
 * Cierre honesto cuando el contexto quedó incompleto (tope de turnos): ni
 * inventa perfil ni promete la primera escena — anuncia que se retoma.
 */
export function buildPauseSummary(ctx: OnboardingContext): string {
  const name = ctx.name ? `, ${ctx.name}` : "";
  return (
    `No worries${name} — let's pick this up in a moment and finish getting you set up. ` +
    "I'll remember what you've told me so far."
  );
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

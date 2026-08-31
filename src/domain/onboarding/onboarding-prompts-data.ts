/**
 * Plantillas de preguntas del onboarding — versión primaria y de reintento
 * (portado VERBATIM de onboarding_prompts_data.py). Los textos en inglés se
 * preservan tal cual para no alterar el tono del coach.
 */

/** Contexto de campos ya recogidos (claves = nombres de paso, snake_case). */
export type QuestionContext = Record<string, string | number | undefined>;

type Template = (ctx: QuestionContext) => string;
export type TemplatePair = readonly [primary: Template, retry: Template];

// ctx.get(key, default) de Python: valor si existe, si no el fallback.
function get(ctx: QuestionContext, key: string, fallback: string): string {
  const value = ctx[key];
  return value === undefined || value === null || value === "" ? fallback : String(value);
}

function skillsQuestion(ctx: QuestionContext): string {
  const name = get(ctx, "name", "there");
  const role = get(ctx, "role", "tech professional");
  const techStack = ctx.tech_stack ? String(ctx.tech_stack) : "";
  const firstTech = techStack ? techStack.split(",")[0].trim() : "";
  if (firstTech) {
    return (
      `Love it, ${name}! Beyond ${firstTech}, ` +
      `what technical skills do you consider your strongest as a ${role}?`
    );
  }
  return `Love it, ${name}! What technical skills do you consider your strongest as a ${role}?`;
}

export function buildErrorNote(errorCount: number): string {
  if (errorCount <= 0) return "";
  return "\n💬 I noticed a few things we can work on together — that's exactly what I'm here for!\n";
}

export const TEMPLATES: Record<string, TemplatePair> = {
  name: [
    () =>
      "Hi there! Welcome to EMMA — I'm really excited to start working with you. " +
      "To kick things off, what's your name?",
    () => "No worries at all! Just your first name — what should I call you?",
  ],
  age: [
    (ctx) => `Great to meet you, ${get(ctx, "name", "there")}! How old are you?`,
    (ctx) =>
      `That's totally fine, ${get(ctx, "name", "there")}! ` +
      "Just a rough age works perfectly — how old are you?",
  ],
  role: [
    (ctx) =>
      `Awesome, ${get(ctx, "name", "there")}! ` +
      "What's your current professional role — developer, engineer, " +
      "architect, or something else?",
    (ctx) =>
      `No worries, ${get(ctx, "name", "there")}! ` +
      "Just a broad title is great — what kind of tech work do you do day to day?",
  ],
  years_in_role: [
    (ctx) =>
      `That's great, ${get(ctx, "name", "there")}! ` +
      `How many years have you been working as a ${get(ctx, "role", "professional")}?`,
    (ctx) =>
      `Totally fine to estimate, ${get(ctx, "name", "there")} — ` +
      "roughly how long have you been in that role?",
  ],
  tech_stack: [
    (ctx) =>
      `Nice! As a ${get(ctx, "role", "tech professional")}, ${get(ctx, "name", "there")}, ` +
      "what's your primary technology stack — for example Python, React, or Go?",
    (ctx) =>
      `No pressure, ${get(ctx, "name", "there")} — ` +
      "just name one or two technologies you use most at work?",
  ],
  skills: [
    (ctx) => skillsQuestion(ctx),
    (ctx) =>
      `That's totally fine, ${get(ctx, "name", "there")} — ` +
      "just mention a skill or two you're proud of, even something small?",
  ],
  resume: [
    (ctx) => `Welcome back, ${get(ctx, "name", "there")}! Let's pick up right where we left off.`,
    (ctx) => `Welcome back, ${get(ctx, "name", "there")}! Let's pick up right where we left off.`,
  ],
};

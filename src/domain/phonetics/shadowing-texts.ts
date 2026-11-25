/**
 * Textos de shadowing según el nivel (#357, T6).
 *
 * El "why": el único texto era el del libro («Before we ship this release…»,
 * «The cache invalidation still fails intermittently under load…»), pensado
 * para B2+. Para A1–A2 era inalcanzable y la práctica frustraba en vez de
 * entrenar. Cada banda tiene su texto, del mismo mundo de trabajo, con frases
 * cortas y vocabulario frecuente en los niveles bajos. Dominio puro.
 */

import type { CefrLevel } from "@/domain/cefr/cefr-ladder";

export interface ShadowingText {
  sentences: string[];
  text: string;
}

const BOOK_TEXT_SENTENCES = [
  "Before we ship this release, I'd like to check a couple of things.",
  "The cache invalidation still fails intermittently under load, and I haven't been able to reproduce it locally.",
  "If it's a race condition, we should be seeing it in the staging logs, so I'll add a bit more instrumentation and run the batch again.",
];

const BY_BAND: Record<"A1" | "A2" | "B1", string[]> = {
  A1: [
    "I work on the login page.",
    "I fix small bugs every day.",
    "My team is very nice.",
    "We have a meeting every morning.",
  ],
  A2: [
    "Today I am testing the new feature.",
    "Yesterday I fixed two bugs in the API.",
    "I need some help with the database.",
    "Can we talk after the meeting?",
  ],
  B1: [
    "Before the demo, I want to check the main features.",
    "The tests passed, but one page is still very slow.",
    "I will look at the logs this afternoon and tell you.",
  ],
};

function build(sentences: string[]): ShadowingText {
  return { sentences, text: sentences.join(" ") };
}

export function shadowingTextFor(level: CefrLevel): ShadowingText {
  if (level === "A1" || level === "A2" || level === "B1") return build(BY_BAND[level]);
  return build(BOOK_TEXT_SENTENCES);
}

/**
 * Un tip enseñable por etiqueta de la taxonomía (domain/chat/error-taxonomy).
 * Va en inglés (Artículo 9): la UI es inmersiva; los ejemplos contrastan con
 * la interferencia típica del hispanohablante.
 */

import type { ErrorLabel } from "@/domain/chat/error-taxonomy";

export const LESSON_TIPS: Record<ErrorLabel, string> = {
  article:
    "In English almost every noun takes an article: *I am **a** developer*, " +
    "*join **the** meeting*. And *the* never changes for gender or number.",
  preposition:
    "Prepositions don't translate 1 to 1: *depende de* → *depends **on***, " +
    "*en lunes* → ***on** Monday*. Learn verb + preposition as one unit.",
  word_form:
    "Mind the word form: third person (*she work**s***), " +
    "plural (*two task**s***) and past (*yesterday I work**ed***).",
  word_order:
    "English word order is fixed: subject + verb + object, and the adjective goes " +
    "before the noun (*a **big** problem*).",
  punctuation:
    "End every sentence with `.` `!` or `?` — and remember: English has no " +
    "opening question or exclamation marks.",
  capitalization:
    "Always capitalize **I**, as well as languages, days and proper " +
    "nouns (*English*, *Monday*).",
  spacing: "One single space between words and none before a comma or period.",
  grammar:
    "Compare your version with the suggested one word by word and spot " +
    "what changed and why.",
};

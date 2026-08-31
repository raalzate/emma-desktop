/**
 * Un tip enseñable por etiqueta de la taxonomía (domain/chat/error-taxonomy),
 * escrito en español — la primera lengua del aprendiz es donde aterrizan las
 * explicaciones gramaticales.
 */

import type { ErrorLabel } from "@/domain/chat/error-taxonomy";

export const LESSON_TIPS: Record<ErrorLabel, string> = {
  article:
    "En inglés casi todo sustantivo lleva artículo: *I am **a** developer*, " +
    "*join **the** meeting*. Y *the* nunca cambia por género ni número.",
  preposition:
    "Las preposiciones no se traducen 1 a 1: *depende de* → *depends **on***, " +
    "*en lunes* → ***on** Monday*. Aprende verbo + preposición como una unidad.",
  word_form:
    "Cuida la forma de la palabra: tercera persona (*she work**s***), " +
    "plural (*two task**s***) y pasado (*yesterday I work**ed***).",
  word_order:
    "El orden en inglés es fijo: sujeto + verbo + objeto, y el adjetivo va " +
    "antes del sustantivo (*a **big** problem*).",
  punctuation:
    "Cierra cada oración con `.` `!` o `?` — y recuerda: en inglés no " +
    "existen los signos de apertura ¿ ¡.",
  capitalization:
    "Escribe **I** siempre en mayúscula, igual que idiomas, días y nombres " +
    "propios (*English*, *Monday*).",
  spacing: "Un solo espacio entre palabras y ninguno antes de coma o punto.",
  grammar:
    "Compara palabra por palabra tu versión con la sugerida e identifica " +
    "qué cambió y por qué.",
};

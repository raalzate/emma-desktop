"use client";

/**
 * Chips de respuesta sugerida sobre el composer: andamiaje de SOLO LECTURA.
 *
 * El "why": inyectar la frase en el input con un clic convertía la práctica en
 * copiar y pegar — el aprendiz enviaba inglés que no produjo. Las sugerencias se
 * leen como modelo y se teclean a mano (output forzado, Swain); el atajo de un
 * clic anulaba justo el esfuerzo que consolida la estructura.
 */

import type { ReplySuggestion } from "@/domain/coaching/reply-suggestion";

const HINT_STYLE: Record<string, string> = {
  easy: "border-emerald-500/40 text-emerald-600 dark:text-emerald-400",
  mid: "border-amber-500/40 text-amber-600 dark:text-amber-400",
  advanced: "border-rose-500/40 text-rose-600 dark:text-rose-400",
};

// Globo de ayuda en español (andamiaje); la sugerencia en sí queda en inglés (inmersión).
const HINT_TOOLTIP: Record<string, string> = {
  easy: "Ejemplo de respuesta — nivel sencillo. Escríbela tú con tus palabras.",
  mid: "Ejemplo de respuesta — nivel intermedio. Escríbela tú con tus palabras.",
  advanced: "Ejemplo de respuesta — nivel avanzado. Escríbela tú con tus palabras.",
};

export function SuggestionChips({ suggestions }: { suggestions: ReplySuggestion[] }) {
  if (!suggestions.length) return null;
  return (
    <div className="mb-2 flex flex-wrap gap-2" aria-label="Ejemplos de respuesta">
      {suggestions.map((s) => (
        <span
          key={s.levelHint}
          className={`select-text rounded-full border px-3 py-1 text-left text-xs ${HINT_STYLE[s.levelHint] ?? ""}`}
          title={HINT_TOOLTIP[s.levelHint]}
        >
          {s.text}
        </span>
      ))}
    </div>
  );
}

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

// Clases LITERALES completas (el purge de Tailwind no ve clases compuestas):
// semáforo del andamiaje con los tokens scaffold (FR-019).
const HINT_STYLE: Record<string, { chip: string; dot: string }> = {
  easy: { chip: "bg-scaffold-easy-bg text-scaffold-easy", dot: "bg-scaffold-easy" },
  mid: { chip: "bg-scaffold-mid-bg text-scaffold-mid", dot: "bg-scaffold-mid" },
  advanced: { chip: "bg-scaffold-hard-bg text-scaffold-hard", dot: "bg-scaffold-hard" },
};

// Globo de ayuda en español (andamiaje); la sugerencia en sí queda en inglés (inmersión).
const HINT_TOOLTIP: Record<string, string> = {
  easy: "Ejemplo de respuesta — nivel sencillo. Escríbela tú con tus palabras.",
  mid: "Ejemplo de respuesta — nivel intermedio. Escríbela tú con tus palabras.",
  advanced: "Ejemplo de respuesta — nivel avanzado. Escríbela tú con tus palabras.",
};

export function SuggestionChips({ suggestions }: { suggestions: ReplySuggestion[] }) {
  if (!suggestions.length) return null;
  const style = (hint: string) => HINT_STYLE[hint] ?? { chip: "", dot: "bg-border" };
  return (
    <div className="mb-2 flex flex-wrap items-center gap-2" aria-label="Ejemplos de respuesta">
      {/* Tag del grupo: marca visible de que esto es andamiaje, en español (FR-020). */}
      <span className="rounded-md border border-dashed border-border px-2 py-0.5 font-code text-[10px] tracking-[0.15em] text-muted-foreground">
        ANDAMIAJE · ES
      </span>
      {suggestions.map((s) => (
        <span
          key={s.levelHint}
          className={`flex select-text items-center gap-1.5 rounded-full px-3 py-1.5 text-left text-xs ${style(s.levelHint).chip}`}
          title={HINT_TOOLTIP[s.levelHint]}
        >
          <span className={`h-1.5 w-1.5 shrink-0 rounded-full ${style(s.levelHint).dot}`} aria-hidden />
          {s.text}
        </span>
      ))}
    </div>
  );
}

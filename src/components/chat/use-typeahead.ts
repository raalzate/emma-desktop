"use client";

/**
 * Typeahead inline estilo Gmail: mientras el aprendiz teclea cerca del inicio de
 * frase (≤4 palabras, mín. 6 caracteres) pide a `complete()` la continuación y
 * la muestra como sufijo fantasma. Debounce de 600 ms para no saturar el LLM.
 *
 * El "why" del guardia de cancelación: `complete()` tarda cientos de ms y el
 * aprendiz sigue tecleando. Sin descartar las respuestas en vuelo, la de un
 * prefijo viejo llegaba tarde y se pintaba sobre el texto nuevo — el fantasma
 * mostraba una frase que no continuaba lo escrito.
 */

import { useEffect, useState } from "react";
import type { EmmaRuntime } from "@/interface/emma-runtime";
import type { CefrLevel } from "@/domain/cefr/cefr-ladder";
import { hintForLevel } from "@/domain/coaching/typeahead-hint";

const DEBOUNCE_MS = 600;
const MIN_LEN = 6;
const MAX_WORDS = 4;

// Sólo sugerimos al principio de una frase y con algo escrito, no en medio.
function eligible(text: string): boolean {
  const segment = text.split(/[.!?]\s+/).pop() ?? text;
  const words = segment.trim().split(/\s+/).filter(Boolean);
  return text.trim().length >= MIN_LEN && words.length <= MAX_WORDS;
}

/**
 * El modelo a veces devuelve la continuación repitiendo lo ya escrito o
 * arrancando una frase nueva; se recorta el solape y se separa con un espacio
 * salvo que continúe la palabra en curso.
 */
export function joinSuffix(text: string, suffix: string): string {
  const clean = suffix.trim();
  if (!clean) return "";
  // El modelo repitió el prefijo: quédate sólo con lo que sigue.
  if (clean.toLowerCase().startsWith(text.trim().toLowerCase())) {
    const rest = clean.slice(text.trim().length);
    return rest.trimStart() ? ` ${rest.trimStart()}` : "";
  }
  const needsSpace = !/\s$/.test(text) && !/^[,.;:!?'’)]/.test(clean);
  return needsSpace ? ` ${clean}` : clean;
}

export function useTypeahead(
  runtime: EmmaRuntime,
  context: string,
  text: string,
  busy: boolean,
  level: CefrLevel,
) {
  const [ghost, setGhost] = useState("");

  useEffect(() => {
    setGhost("");
    if (busy || !eligible(text)) return;
    // `stale` invalida la respuesta si el efecto se rehace (texto nuevo, envío…).
    let stale = false;
    const id = setTimeout(async () => {
      const suffix = await runtime.complete(context, text);
      if (stale) return;
      // A partir de B1 solo se muestra una pista: la frase la produce el aprendiz.
      setGhost(hintForLevel(joinSuffix(text, suffix), level));
    }, DEBOUNCE_MS);
    return () => {
      stale = true;
      clearTimeout(id);
    };
  }, [runtime, context, text, busy, level]);

  return { ghost, clearGhost: () => setGhost("") };
}

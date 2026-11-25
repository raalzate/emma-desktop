/**
 * Guardia anti-fuga de identidad (BUG-001): el modelo local pequeño a veces
 * rompe personaje y se declara IA ("As a large language model…"). Este módulo
 * detecta esas frases y las elimina oración por oración, conservando el resto
 * de la respuesta en personaje. Dominio puro: solo texto.
 */

const LEAK_PATTERNS: RegExp[] = [
  /\bas a (?:large )?language model\b/i,
  /\bas an (?:ai|artificial intelligence)\b/i,
  /\bi(?:'m| am) (?:just )?(?:an? )?(?:ai|artificial intelligence|language model|virtual assistant|chatbot)\b/i,
  /\bi (?:do not|don't) have (?:access to )?real[- ]time\b/i,
  /\bmy (?:training|knowledge) (?:data|cut-?off)\b/i,
];

/** ¿Contiene el texto una auto-revelación de IA? */
export function hasIdentityLeak(text: string): boolean {
  return LEAK_PATTERNS.some((p) => p.test(text));
}

/**
 * Elimina las oraciones con fuga de identidad y devuelve el resto. Si todo era
 * fuga devuelve cadena vacía: el caller decide el reemplazo en personaje.
 */
export function removeIdentityLeak(text: string): string {
  if (!hasIdentityLeak(text)) return text;
  const sentences = text.split(/(?<=[.!?…])\s+/);
  return sentences
    .filter((s) => !hasIdentityLeak(s))
    .join(" ")
    .trim();
}

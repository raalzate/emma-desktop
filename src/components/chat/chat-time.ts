/** Formatea una marca epoch-ms como hora local corta (HH:MM) para las burbujas. */
export function formatTime(at?: number): string {
  if (!at) return "";
  return new Date(at).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
}

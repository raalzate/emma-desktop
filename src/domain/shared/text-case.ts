/**
 * Capitalización tipo título: mayúscula la primera letra de cada grupo de
 * letras, el resto en minúscula. Necesario para casar contra catálogos y para
 * formatear títulos de escenario de forma estable.
 */
export function titleCase(text: string): string {
  return text.replace(/[A-Za-z]+/g, (word) => word[0].toUpperCase() + word.slice(1).toLowerCase());
}

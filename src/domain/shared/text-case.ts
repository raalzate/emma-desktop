/**
 * Réplica de `str.title()` de Python: pone en mayúscula la primera letra de cada
 * grupo de letras y el resto en minúscula. Necesario para casar contra catálogos
 * y para formatear títulos de escenario 1:1 con el original.
 */
export function titleCase(text: string): string {
  return text.replace(/[A-Za-z]+/g, (word) => word[0].toUpperCase() + word.slice(1).toLowerCase());
}

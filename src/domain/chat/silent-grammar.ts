/**
 * SilentError — desviación gramatical capturada en silencio durante la simulación
 * (nunca se muestra a media conversación; alimenta la lección final).
 *
 * Tipo canónico único: re-exporta `SilentError` de silent-error.ts para que el
 * checker de gramática, el histograma de patrones y el reporte compartan la misma
 * forma. El campo `turn` es opcional allí y el checker de gramática lo rellena.
 */

export type { SilentError } from "./silent-error";

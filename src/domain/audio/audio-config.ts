/**
 * Umbrales de captura de audio (port de config/audio_config.py).
 * Dominio puro: números crudos, sin Web APIs.
 */

/** Por debajo de -40 dBFS se considera silencio. */
export const SILENCE_THRESHOLD_DBFS = -40.0;

/** Tras 1500 ms de silencio con voz previa, auto-envío. */
export const SILENCE_TIMEOUT_MS = 1500;

/** Grabaciones más cortas que 500 ms se descartan. */
export const MIN_DURATION_MS = 500;

/** Corte duro de la grabación a los 60 s. */
export const MAX_DURATION_MS = 60_000;

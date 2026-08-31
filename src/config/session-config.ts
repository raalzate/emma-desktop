/**
 * Configuración de sesión + runtime de chat (portado de src/config/session_config.py).
 * Topes de turnos y presupuestos de tiempo de espera.
 */

/** Máximo de turnos (par usuario+asistente) que se conservan en el historial. */
export const MAX_HISTORY_TURNS = 20;

export const ASK_USER_TIMEOUT_SECONDS = 120;
export const SUMMARY_TIMEOUT_SECONDS = 300;
export const LONG_ASK_USER_TIMEOUT_SECONDS = 3600;

export const SQLITE_CONNECT_TIMEOUT_SECONDS = 10;
export const SQLITE_BUSY_TIMEOUT_MS = 10_000;

export const END_BUTTON_LOOKAHEAD_TURNS = 2;

// Presupuesto de un turno de chat: si el LLM se pasa, se degrada con un mensaje
// amable (portado de src/interface/chat_runner.py → LLM_TIMEOUT_SECONDS).
export const LLM_TIMEOUT_SECONDS = 60;

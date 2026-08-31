/**
 * Colecciones válidas del almacén JSON (una por archivo).
 *
 * Vive aparte de `store.ts` (que importa `electron`) para que el renderer y las
 * pruebas puedan verificar sin arrancar Electron que toda clave usada por un
 * repositorio está registrada aquí: una clave no registrada hace fallar
 * `assertKey` en tiempo de ejecución y la persistencia se pierde en silencio.
 */

export type StoreKey =
  | 'profiles'
  | 'chatSettings'
  | 'progression'
  | 'errorStats'
  | 'pathway'
  | 'goals'
  | 'welcomeEvents'
  | 'sessions'
  | 'preferences'
  | 'chatConversations'
  | 'personaTunings'
  | 'srs'
  | 'selfAssessment'
  | 'challenges'
  | 'sessionMetrics';

export const STORE_KEYS: StoreKey[] = [
  'profiles', 'chatSettings', 'progression', 'errorStats',
  'pathway', 'goals', 'welcomeEvents', 'sessions', 'preferences',
  'chatConversations', 'personaTunings', 'srs', 'selfAssessment',
  'challenges', 'sessionMetrics',
];

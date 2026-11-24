/** Puerto de persistencia del historial del chequeo (tope en `SETUP_HISTORY_MAX`). */
import type { SetupCheckRecord } from "./setup-check-record";

export interface ISetupCheckRepository {
  last(): Promise<SetupCheckRecord | null>;
  /** Más nuevo primero. */
  history(): Promise<SetupCheckRecord[]>;
  append(record: SetupCheckRecord): Promise<void>;
  /** Marca reconocido el más nuevo en su lugar (sin sumar entrada); null si no hay. */
  acknowledgeLast(): Promise<SetupCheckRecord | null>;
}

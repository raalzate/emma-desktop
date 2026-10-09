/** Contrato de persistencia de los eventos de XP (#216). */

import type { XpEvent } from "./xp-event";

export interface IGamificationRepository {
  load(): Promise<XpEvent[]>;
  append(events: XpEvent[]): Promise<void>;
}

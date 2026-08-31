/** Contrato de persistencia para las tarjetas del sistema de repaso espaciado. */

import type { SrsCard } from "./srs-card";

export interface ISrsRepository {
  loadCards(): Promise<SrsCard[]>;
  saveCards(cards: SrsCard[]): Promise<void>;
}

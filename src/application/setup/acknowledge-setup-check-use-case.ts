/**
 * «Continue anyway» (FR-032): reconoce el último chequeo con advertencias.
 * Se marca en su lugar: no suma entrada al historial acotado.
 */
import type { ISetupCheckRepository } from "@/domain/setup/i-setup-check-repository";
import { canContinue, type SetupCheckRecord } from "@/domain/setup/setup-check-record";

export async function acknowledgeSetupCheck(a: { repo: ISetupCheckRepository }): Promise<SetupCheckRecord | null> {
  try {
    const last = await a.repo.last();
    if (!last || !canContinue(last.diagnosis)) return null;
    return await a.repo.acknowledgeLast();
  } catch {
    return null;
  }
}

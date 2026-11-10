import { describe, expect, it } from "vitest";
import { SETUP_CHECK_VERSION, type SetupCheckRecord } from "@/domain/setup/setup-check-record";
import { acknowledgeSetupCheck } from "../acknowledge-setup-check-use-case";
import { repoFalso } from "./fakes";

const aviso: SetupCheckRecord = {
  version: SETUP_CHECK_VERSION, at: 7, trigger: "first-run", acknowledged: false,
  diagnosis: { verdict: "warn", probes: [] },
};

describe("acknowledgeSetupCheck", () => {
  it("marca el último registro como reconocido", async () => {
    const repo = repoFalso([aviso]);
    const r = await acknowledgeSetupCheck({ repo });
    expect(r?.acknowledged).toBe(true);
    expect((await repo.last())?.acknowledged).toBe(true);
    expect(aviso.acknowledged).toBe(false); // no muta el original
  });
  it("reconoce en su lugar: no agrega una entrada al historial (tope de 20)", async () => {
    const repo = repoFalso([aviso]);
    await acknowledgeSetupCheck({ repo });
    expect(repo.registros).toHaveLength(1);
  });
  it("sin registro no hace nada", async () => {
    const repo = repoFalso();
    expect(await acknowledgeSetupCheck({ repo })).toBeNull();
    expect(repo.registros).toHaveLength(0);
  });
  it("un registro bloqueado no se puede reconocer (no hay «Continue anyway»)", async () => {
    const repo = repoFalso([{ ...aviso, diagnosis: { verdict: "blocked", probes: [] } }]);
    expect(await acknowledgeSetupCheck({ repo })).toBeNull();
    expect(repo.registros).toHaveLength(1);
  });
  it("un repositorio que falla devuelve null sin lanzar", async () => {
    const repo = { ...repoFalso(), last: async () => { throw new Error("x"); } };
    expect(await acknowledgeSetupCheck({ repo })).toBeNull();
  });
});

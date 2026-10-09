import { describe, it, expect } from "vitest";
import { EvaluateProgressionUseCase } from "../evaluate-progression-use-case";
import type { IProgressionRepository } from "@/domain/progression/i-progression-repository";
import type { ProgressionState } from "@/domain/progression/progression-state";
import type { IProfileLevelRepository } from "@/domain/profile/i-profile-level-repository";
import type { CefrLevel } from "@/domain/cefr/cefr-ladder";

/** Puerto falso en memoria; registra el último upsert. */
class FakeProgressionRepo implements IProgressionRepository {
  saved: ProgressionState | null = null;
  constructor(private readonly prior: ProgressionState | null = null) {}
  async get(): Promise<ProgressionState | null> {
    return this.prior;
  }
  async upsert(state: ProgressionState): Promise<void> {
    this.saved = state;
  }
}

/** Perfil falso: registra cada escritura de nivel. */
class FakeProfileLevel implements IProfileLevelRepository {
  writes: Array<{ level: CefrLevel; at: string }> = [];
  async setEnglishLevel(level: CefrLevel, at: string): Promise<void> {
    this.writes.push({ level, at });
  }
}

const NOW = "2026-10-09T10:00:00.000Z";

/** Archivador falso: registra los niveles superados. */
class FakeArchive {
  calls: string[] = [];
  async execute(fromLevel: string): Promise<number> {
    this.calls.push(fromLevel);
    return 0;
  }
}

function build(repo: IProgressionRepository) {
  const profile = new FakeProfileLevel();
  const archive = new FakeArchive();
  const useCase = new EvaluateProgressionUseCase(repo, profile, archive, () => NOW);
  return { useCase, profile, archive };
}

// A1: barra 0.45. turns:10/errors:0 => 0 <= 0.45 aprueba; errors:5 => 0.5 > 0.45 falla.
const passMetric = { turns: 10, errors: 0 };
const failMetric = { turns: 10, errors: 5 };

describe("EvaluateProgressionUseCase", () => {
  it("arranca la racha en 1 cuando no hay estado previo y la sesión aprueba", async () => {
    const { useCase } = build(new FakeProgressionRepo(null));
    const result = await useCase.execute(1, "A1", passMetric);
    expect(result.streak).toBe(1);
    expect(result.promoted).toBe(false);
    expect(result.oldLevel).toBe("A1");
    expect(result.newLevel).toBe("A1");
  });

  it("persiste el estado nuevo vía upsert", async () => {
    const repo = new FakeProgressionRepo(null);
    await build(repo).useCase.execute(7, "A1", passMetric);
    expect(repo.saved).toEqual({ userId: 7, level: "A1", streak: 1 });
  });

  it("reinicia la racha a 0 cuando la sesión falla", async () => {
    const { useCase } = build(new FakeProgressionRepo({ userId: 1, level: "A1", streak: 2 }));
    const result = await useCase.execute(1, "A1", failMetric);
    expect(result.streak).toBe(0);
    expect(result.promoted).toBe(false);
  });

  it("no cuenta como aprobada una sesión con muy pocos turnos", async () => {
    const { useCase } = build(new FakeProgressionRepo({ userId: 1, level: "A1", streak: 2 }));
    // turns:3 < MIN_TURNS_TO_COUNT (5) => isPass falso => racha se reinicia.
    const result = await useCase.execute(1, "A1", { turns: 3, errors: 0 });
    expect(result.streak).toBe(0);
  });

  it("promueve al siguiente nivel al alcanzar la racha requerida", async () => {
    // racha previa 2 + aprobar => 3 == PROMOTION_STREAK => promueve A1 -> A2.
    const { useCase } = build(new FakeProgressionRepo({ userId: 1, level: "A1", streak: 2 }));
    const result = await useCase.execute(1, "A1", passMetric);
    expect(result.promoted).toBe(true);
    expect(result.oldLevel).toBe("A1");
    expect(result.newLevel).toBe("A2");
    expect(result.streak).toBe(0); // racha reiniciada tras promover
  });

  it("no promueve en el tope del escalafón pero conserva la racha", async () => {
    // C1: barra 0.12. turns:10/errors:1 => 0.1 <= 0.12 aprueba.
    // racha previa 2 + aprobar => 3, pero nextLevel(C1) es null => sin promoción.
    const { useCase } = build(new FakeProgressionRepo({ userId: 1, level: "C1", streak: 2 }));
    const result = await useCase.execute(1, "C1", { turns: 10, errors: 1 });
    expect(result.promoted).toBe(false);
    expect(result.newLevel).toBe("C1");
    expect(result.streak).toBe(3); // no se reinicia porque no hubo promoción
  });
});

describe("EvaluateProgressionUseCase — la promoción alcanza al perfil y al historial (T3/T4)", () => {
  it("al promover escribe el nivel nuevo en el perfil con la fecha inyectada", async () => {
    const { useCase, profile } = build(new FakeProgressionRepo({ userId: 1, level: "A1", streak: 2 }));
    await useCase.execute(1, "A1", passMetric);
    expect(profile.writes).toEqual([{ level: "A2", at: NOW }]);
  });

  it("sin promoción no toca el perfil", async () => {
    const { useCase, profile } = build(new FakeProgressionRepo({ userId: 1, level: "A1", streak: 0 }));
    await useCase.execute(1, "A1", passMetric);
    expect(profile.writes).toEqual([]);
  });

  it("al promover archiva el historial del nivel superado", async () => {
    const { useCase, archive } = build(new FakeProgressionRepo({ userId: 1, level: "A1", streak: 2 }));
    await useCase.execute(1, "A1", passMetric);
    expect(archive.calls).toEqual(["A1"]);
  });

  it("sin promoción no archiva nada", async () => {
    const { useCase, archive } = build(new FakeProgressionRepo({ userId: 1, level: "A1", streak: 0 }));
    await useCase.execute(1, "A1", failMetric);
    expect(archive.calls).toEqual([]);
  });
});

import { describe, it, expect } from "vitest";
import { RecordSessionErrorsUseCase } from "../record-session-errors-use-case";
import type { IErrorStatsRepository } from "@/domain/progression/i-error-stats-repository";
import type { ErrorStat } from "@/domain/progression/error-stats";
import type { SilentError } from "@/domain/chat/silent-error";
import type { ErrorLabel } from "@/domain/chat/error-taxonomy";

/** Puerto falso; registra cada llamada a record. */
class FakeErrorStatsRepo implements IErrorStatsRepository {
  calls: Array<{ userId: number; stats: ErrorStat[] }> = [];
  async record(userId: number, stats: ErrorStat[]): Promise<void> {
    this.calls.push({ userId, stats });
  }
  async getRecentStats(): Promise<ErrorStat[]> {
    return [];
  }
}

function err(label: ErrorLabel): SilentError {
  return { label, original: "x", corrected: "y" };
}

describe("RecordSessionErrorsUseCase", () => {
  it("colapsa los errores y los agrega al repositorio", async () => {
    const repo = new FakeErrorStatsRepo();
    await new RecordSessionErrorsUseCase(repo).execute(3, [err("article"), err("article"), err("grammar")]);
    expect(repo.calls).toHaveLength(1);
    expect(repo.calls[0].userId).toBe(3);
    expect(repo.calls[0].stats).toEqual([
      { errorType: "article", count: 2 },
      { errorType: "grammar", count: 1 },
    ]);
  });

  it("no llama al repositorio cuando el buffer está vacío", async () => {
    const repo = new FakeErrorStatsRepo();
    await new RecordSessionErrorsUseCase(repo).execute(3, []);
    expect(repo.calls).toHaveLength(0);
  });
});

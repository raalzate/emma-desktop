import { describe, it, expect } from "vitest";
import { captureSessionErrors } from "../capture-session-errors-use-case";
import type { SrsCard } from "@/domain/srs/srs-card";
import type { ISrsRepository } from "@/domain/srs/i-srs-repository";
import type { SilentError } from "@/domain/chat/silent-error";

/** Repositorio fake en memoria (sin mockear imports). */
function createFakeRepo(initial: SrsCard[] = []): ISrsRepository {
  let cards = [...initial];
  return {
    async loadCards() {
      return cards;
    },
    async saveCards(next) {
      cards = [...next];
    },
  };
}

const error = (overrides: Partial<SilentError> = {}): SilentError => ({
  label: "grammar",
  original: "I go yesterday",
  corrected: "I went yesterday",
  ...overrides,
});

describe("captureSessionErrors", () => {
  it("crea tarjetas SRS a partir de los errores de la sesión y las persiste", async () => {
    const repo = createFakeRepo();

    const added = await captureSessionErrors({
      repo,
      errors: [error()],
      today: 5,
    });

    expect(added).toBe(1);
    const persisted = await repo.loadCards();
    expect(persisted).toHaveLength(1);
    expect(persisted[0].back).toBe("I went yesterday");
  });

  it("no añade tarjetas cuando no hay errores", async () => {
    const repo = createFakeRepo();

    const added = await captureSessionErrors({ repo, errors: [], today: 5 });

    expect(added).toBe(0);
    expect(await repo.loadCards()).toEqual([]);
  });

  it("no duplica tarjetas ya existentes con el mismo id generado", async () => {
    const repo = createFakeRepo();
    await captureSessionErrors({ repo, errors: [error()], today: 5, idPrefix: "s1" });

    const added = await captureSessionErrors({ repo, errors: [error()], today: 6, idPrefix: "s1" });

    expect(added).toBe(0);
  });
});

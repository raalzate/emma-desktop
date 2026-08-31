import { describe, expect, it } from "vitest";

import { relevantCommonErrors } from "../common-error-catalog";
import type { SilentError } from "@/domain/chat/silent-error";

describe("relevantCommonErrors", () => {
  it("hace match simple por texto entre el error de sesión y COMMON_ERRORS", () => {
    const errors: SilentError[] = [
      { label: "grammar", original: "It's depending on the config.", corrected: "It depends on the config." },
    ];
    const matches = relevantCommonErrors(errors);
    expect(matches.some((m) => m.wrong === "It's depending on the config.")).toBe(true);
  });

  it("devuelve como máximo 3 coincidencias", () => {
    const errors: SilentError[] = [
      { label: "grammar", original: "Is a bug.", corrected: "It's a bug." },
      { label: "grammar", original: "Is important to test.", corrected: "It's important to test." },
      { label: "grammar", original: "There is many errors.", corrected: "There are many errors." },
      { label: "grammar", original: "Depends of the load.", corrected: "It depends on the load." },
    ];
    const matches = relevantCommonErrors(errors);
    expect(matches.length).toBeLessThanOrEqual(3);
  });

  it("devuelve [] si nada coincide", () => {
    expect(
      relevantCommonErrors([{ label: "grammar", original: "zzz qqq", corrected: "www rrr" }]),
    ).toEqual([]);
  });
});

import { describe, expect, it } from "vitest";
import { buildWelcome } from "../welcome-use-case";
import { emptyProfile } from "@/domain/profile/user-profile";

describe("buildWelcome", () => {
  it("genera el saludo sin briefing (retrocompatible)", async () => {
    const llm = async () => "Hi there, welcome back!";
    const text = await buildWelcome({ llm, profile: emptyProfile("u1") });
    expect(text).toBe("Hi there, welcome back!");
  });

  it("si viene tutorBriefingEs, lo incluye en el prompt del sistema con la instrucción de mencionarlo en español", async () => {
    let capturedSystem = "";
    const llm = async (args: { system?: string }) => {
      capturedSystem = args.system ?? "";
      return "Hi!";
    };
    await buildWelcome({
      llm,
      profile: emptyProfile("u1"),
      tutorBriefingEs: "Semana 4 del plan · 3 tarjetas pendientes",
    });

    expect(capturedSystem).toContain("Semana 4 del plan · 3 tarjetas pendientes");
    expect(capturedSystem).toMatch(/Spanish/i);
  });

  it("sin tutorBriefingEs, el system prompt no menciona la guía en español", async () => {
    let capturedSystem = "";
    const llm = async (args: { system?: string }) => {
      capturedSystem = args.system ?? "";
      return "Hi!";
    };
    await buildWelcome({ llm, profile: emptyProfile("u1") });
    expect(capturedSystem).not.toMatch(/Spanish/i);
  });
});

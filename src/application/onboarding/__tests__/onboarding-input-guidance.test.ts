import { describe, it, expect } from "vitest";
import type { OnboardingIo } from "@/domain/onboarding/i-onboarding-repository";
import { STEP_GUIDANCE } from "@/domain/onboarding/onboarding-state";
import { sendGuidance } from "../onboarding-input-guidance";

describe("onboarding-input-guidance — sendGuidance", () => {
  it("notifica el mensaje de expectativa del paso", async () => {
    const notified: string[] = [];
    const io: OnboardingIo = {
      ask: async () => "",
      notify: (m) => {
        notified.push(m);
      },
    };
    await sendGuidance("age", io);
    expect(notified).toEqual([STEP_GUIDANCE.age]);
  });

  it("no falla si el canal de UI no implementa notify", async () => {
    const io: OnboardingIo = { ask: async () => "" };
    await expect(sendGuidance("role", io)).resolves.toBeUndefined();
  });
});

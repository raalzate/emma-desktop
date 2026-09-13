/**
 * BUG: «Could you explain it to me better?» se clasificaba como `in-scene`. La
 * persona no recibía la directiva de reparación, generaba una línea parecida a
 * la anterior, los guardias anti-repetición la vetaban dos veces y la escena
 * caía en la recuperación amnésica («I lost my train of thought») — justo el
 * síntoma de «perder el hilo».
 */

import { describe, expect, it } from "vitest";
import { classifyLearnerIntent } from "@/domain/chat/learner-intent";

describe("classifyLearnerIntent — pedidos de aclaración", () => {
  const meta = [
    "Could you explain it to me better?",
    "Can you explain it better?",
    "What do you mean?",
    "I didn't catch that.",
    "One more time, please?",
    "Sorry, I'm lost.",
    "Could you repeat that?",
  ];
  it.each(meta)("«%s» es meta (pide reparación)", (m) => {
    expect(classifyLearnerIntent(m)).toBe("meta");
  });

  const escena = [
    "Yesterday I wrapped up the user profile update task.",
    "I plan to finish the API integration by noon.",
    "I don't understand the ticket the PM wrote.",
    "Let me explain the migration plan to you.",
  ];
  it.each(escena)("«%s» sigue siendo contenido de escena", (m) => {
    expect(classifyLearnerIntent(m)).toBe("in-scene");
  });
});

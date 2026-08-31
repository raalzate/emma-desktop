import { describe, it, expect } from "vitest";
import { splitSentences, stripMetaText, capSentences, polishChatReply } from "../chat-brevity";

describe("splitSentences", () => {
  it("segmenta oraciones simples terminadas en . ! ?", () => {
    expect(splitSentences("Hola. ¿Cómo estás? Bien!")).toEqual([
      "Hola.",
      "¿Cómo estás?",
      "Bien!",
    ]);
  });

  it("no parte en abreviaturas comunes", () => {
    expect(splitSentences("I met Dr. Smith and Mrs. Lee, e.g. at the clinic.")).toEqual([
      "I met Dr. Smith and Mrs. Lee, e.g. at the clinic.",
    ]);
  });

  it("no parte en decimales", () => {
    expect(splitSentences("The price is 3.5 dollars. That is cheap.")).toEqual([
      "The price is 3.5 dollars.",
      "That is cheap.",
    ]);
  });

  it("incluye la última oración sin puntuación final", () => {
    expect(splitSentences("Hello there. And this one has no period")).toEqual([
      "Hello there.",
      "And this one has no period",
    ]);
  });

  it("tolera cierre de comillas o paréntesis adyacente al final", () => {
    expect(splitSentences('She said "hello." Then left.')).toEqual([
      'She said "hello."',
      "Then left.",
    ]);
  });
});

describe("stripMetaText", () => {
  it("elimina líneas de interpretación de la situación", () => {
    const raw = "My interpretation of the situation: you need help. Let's practice ordering coffee.";
    expect(stripMetaText(raw)).toBe("Let's practice ordering coffee.");
  });

  it("elimina listas numeradas de plantilla con rótulos entre paréntesis", () => {
    const raw = "1. (Current State) 2. (Goal) Great, let's continue the roleplay.";
    expect(stripMetaText(raw)).toBe("Great, let's continue the roleplay.");
  });

  it("elimina marcador de respuesta final", () => {
    const raw = "(Final Answer) Sure, I can help you order a coffee.";
    expect(stripMetaText(raw)).toBe("Sure, I can help you order a coffee.");
  });

  it("elimina frases de auto-referencia al proceso de redacción", () => {
    const raw =
      "I've refined the language to be more professional. Here is your coffee order confirmed.";
    expect(stripMetaText(raw)).toBe("Here is your coffee order confirmed.");
  });

  it("no borra contenido conversacional legítimo", () => {
    const raw = "That sounds great! What would you like to order today?";
    expect(stripMetaText(raw)).toBe(raw);
  });
});

describe("capSentences", () => {
  it("conserva solo las primeras max oraciones completas", () => {
    const text = "Uno. Dos. Tres. Cuatro. Cinco.";
    expect(capSentences(text, 3)).toBe("Uno. Dos. Tres.");
  });

  it("no corta si hay menos oraciones que el tope", () => {
    const text = "Solo una oración.";
    expect(capSentences(text, 3)).toBe("Solo una oración.");
  });

  it("sustituye la última oración conservada por la primera pregunta descartada", () => {
    const text = "Uno. Dos. Tres. ¿Cuatro? Cinco.";
    expect(capSentences(text, 3)).toBe("Uno. Dos. ¿Cuatro?");
  });

  it("no sustituye si ya hay una pregunta entre las conservadas", () => {
    const text = "Uno. ¿Dos? Tres. ¿Cuatro? Cinco.";
    expect(capSentences(text, 3)).toBe("Uno. ¿Dos? Tres.");
  });
});

describe("polishChatReply", () => {
  it("compone stripMetaText y capSentences, colapsando espacios", () => {
    const raw =
      "My interpretation of the situation:   you want to order coffee.   Sure, let's start.   What would you like?   Then I'll bring it.   Enjoy your day.";
    expect(polishChatReply(raw, 3)).toBe(
      "Sure, let's start. What would you like? Then I'll bring it.",
    );
  });

  it("respeta el tope por defecto de 3 oraciones", () => {
    const raw = "Uno. Dos. Tres. Cuatro.";
    expect(polishChatReply(raw)).toBe("Uno. Dos. Tres.");
  });

  it("deja intacta una respuesta corta sin meta-texto", () => {
    const raw = "Hi! How can I help you today?";
    expect(polishChatReply(raw)).toBe(raw);
  });

  it("devuelve cadena vacía cuando el texto es 100% meta-monólogo", () => {
    const raw =
      "My interpretation of the situation: none. 1. (Current State) 2. (Goal) (Final Answer)";
    expect(polishChatReply(raw)).toBe("");
  });

  it("elimina paréntesis de auto-instrucción del modelo (tono/registro)", () => {
    const raw =
      "So far, I've been working on the report. (I'll adjust the tone and complexity " +
      "of the response to be more appropriate for a professional setting, while " +
      "keeping the language simple and direct.)";
    expect(polishChatReply(raw)).toBe("So far, I've been working on the report.");
  });

  it("conserva paréntesis con contenido conversacional legítimo", () => {
    const raw = "Let's sync later today (around 3 PM). Does that work for you?";
    expect(polishChatReply(raw)).toBe(raw);
  });

  it("elimina el meta-análisis de lo que el usuario 'quiso decir'", () => {
    const raw =
      '(I\'m assuming you meant "I" as in "I" am the one who is working on it, and ' +
      "you are the one who is asking for the update. Let's proceed with the " +
      "assumption that you are the one who will be working on it, and we will " +
      "adjust the language to be more appropriate for the context) Great, tell me more!";
    expect(polishChatReply(raw)).toBe("Great, tell me more!");
  });

  it("elimina corchetes condicionales de plantilla aunque sean largos", () => {
    const raw =
      "[If you are the one who is currently working on it] I'm ready to hear more " +
      "about the progress! [If you are the one who wants to know more] Sounds good.";
    expect(polishChatReply(raw)).toBe(
      "I'm ready to hear more about the progress! Sounds good.",
    );
  });

  it("la respuesta degenerada real de la captura queda vacía (fallback)", () => {
    const raw =
      '(I\'m assuming you meant "I" as in "I" am the one who is working on it, and you ' +
      "are the one who is asking for the update. Let's proceed with the assumption " +
      "that you are the one who will be working on it, and we will adjust the language " +
      "to be more appropriate for the context) [If you are the one who is currently " +
      "working on it] [If you are the one who wants to know more]";
    expect(polishChatReply(raw)).toBe("");
  });
});

describe("polishChatReply — run-ons y andamiaje de etiquetas (BUG-001)", () => {
  it("recorta por palabras las respuestas run-on sin puntuación", () => {
    const runOn = Array.from({ length: 80 }, (_, i) => `word${i}`).join(" ");
    const out = polishChatReply(runOn, 3);
    expect(out.split(/\s+/).length).toBeLessThanOrEqual(61);
  });

  it("elimina el andamiaje de etiquetas del modelo (What I need to know / Goal / (now))", () => {
    const raw =
      "Great, the plan is moving forward. What I need to know: (now) What I need to " +
      "know: Goal: could you elaborate on the next step?";
    const out = polishChatReply(raw, 3);
    expect(out).not.toMatch(/what i need to know/i);
    expect(out).not.toMatch(/\(\s*now\s*\)/i);
    expect(out).not.toMatch(/\bgoal:/i);
    expect(out).toContain("could you elaborate on the next step?");
  });

  it("elimina muñones de lista numerada ('1. What 2.')", () => {
    const out = polishChatReply("What about the data? 1. What 2.", 3);
    expect(out).toBe("What about the data?");
  });

  it("elimina paréntesis de planificación ('Here is the next step in the conversation…')", () => {
    const raw =
      "Great, that's a good start! (Here is the next step in the conversation, where " +
      "I'll focus on the next part of the day, and then the next steps) 1. what is the next step?";
    const out = polishChatReply(raw, 3);
    expect(out).not.toMatch(/here is the next step in the conversation/i);
    expect(out).not.toMatch(/1\./);
    expect(out).toContain("Great, that's a good start!");
  });
});

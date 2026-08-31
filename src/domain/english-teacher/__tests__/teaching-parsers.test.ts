import { describe, it, expect } from "vitest";
import {
  parseGrammarPoints,
  parseReplies,
  parsePhonetics,
} from "../teaching-parsers";

describe("parseGrammarPoints", () => {
  it("parsea un bloque con prefijo STRUCTURE: y sus tres campos", () => {
    const raw = [
      "STRUCTURE: Imperative",
      "PATTERN: Base verb + object",
      "EXAMPLE: Close the door",
      "WHY: Se usa para dar órdenes.",
    ].join("\n");
    expect(parseGrammarPoints(raw)).toEqual([
      {
        label: "Imperative",
        pattern: "Base verb + object",
        example: "Close the door",
        explanation: "Se usa para dar órdenes.",
      },
    ]);
  });

  it("acepta un header Markdown en negrita como etiqueta de bloque", () => {
    const raw = "**Imperative**\nPATTERN: verb + object";
    const points = parseGrammarPoints(raw);
    expect(points).toHaveLength(1);
    expect(points[0].label).toBe("Imperative");
    expect(points[0].pattern).toBe("verb + object");
  });

  it("extrae la etiqueta de un header numerado 'Structure 1: X'", () => {
    const raw = "**Structure 1: Imperative**\nEXAMPLE: Close it";
    const points = parseGrammarPoints(raw);
    expect(points[0].label).toBe("Imperative");
    expect(points[0].example).toBe("Close it");
  });

  it("separa múltiples bloques y conserva el orden", () => {
    const raw = [
      "STRUCTURE: Question",
      "PATTERN: Do you + verb",
      "",
      "STRUCTURE: Conditional",
      "PATTERN: If + present, will + verb",
    ].join("\n");
    const points = parseGrammarPoints(raw);
    expect(points.map((p) => p.label)).toEqual(["Question", "Conditional"]);
  });

  it("limita a 4 estructuras como máximo", () => {
    const raw = Array.from({ length: 6 }, (_, i) => `STRUCTURE: S${i}`).join("\n");
    expect(parseGrammarPoints(raw)).toHaveLength(4);
  });

  it("ignora campos que aparecen antes de cualquier etiqueta de bloque", () => {
    const raw = "PATTERN: huérfano\nSTRUCTURE: Imperative\nWHY: razón";
    const points = parseGrammarPoints(raw);
    expect(points).toHaveLength(1);
    expect(points[0].pattern).toBe(""); // el PATTERN previo no tiene bloque dueño
    expect(points[0].explanation).toBe("razón");
  });

  it("no trata las líneas de campo (PATTERN/EXAMPLE/WHY) como etiquetas", () => {
    const raw = "STRUCTURE: Imperative\nPATTERN: x\nEXAMPLE: y\nWHY: z";
    expect(parseGrammarPoints(raw)).toHaveLength(1);
  });

  it("devuelve lista vacía cuando no hay ningún header de estructura", () => {
    expect(parseGrammarPoints("solo texto suelto\nsin etiquetas")).toEqual([]);
  });

  it("devuelve lista vacía para entrada vacía", () => {
    expect(parseGrammarPoints("")).toEqual([]);
  });
});

describe("parseReplies", () => {
  it("parsea líneas REPLY: con separador de nota '::'", () => {
    const raw = [
      "REPLY: Sure, on it :: casual",
      "REPLY: I'll take care of it :: neutral",
      "REPLY: I will handle it right away :: formal",
    ].join("\n");
    expect(parseReplies(raw)).toEqual([
      { english: "Sure, on it", note: "casual" },
      { english: "I'll take care of it", note: "neutral" },
      { english: "I will handle it right away", note: "formal" },
    ]);
  });

  it("prefiere las líneas etiquetadas REPLY: e ignora las sueltas", () => {
    const raw = "- suelta ignorada\nREPLY: Hola mundo :: nota";
    expect(parseReplies(raw)).toEqual([{ english: "Hola mundo", note: "nota" }]);
  });

  it("cae a líneas con viñeta cuando no hay ninguna REPLY:", () => {
    const raw = "- First option\n* Second option\n• Third option";
    expect(parseReplies(raw)).toEqual([
      { english: "First option", note: "" },
      { english: "Second option", note: "" },
      { english: "Third option", note: "" },
    ]);
  });

  it("acepta listas numeradas como respuestas sueltas", () => {
    const raw = "1. Primera\n2) Segunda";
    expect(parseReplies(raw)).toEqual([
      { english: "Primera", note: "" },
      { english: "Segunda", note: "" },
    ]);
  });

  it("separa la nota con guion cuando falta el '::'", () => {
    expect(parseReplies("REPLY: See you soon - despedida")).toEqual([
      { english: "See you soon", note: "despedida" },
    ]);
  });

  it("limita a 3 respuestas como máximo", () => {
    const raw = Array.from({ length: 5 }, (_, i) => `REPLY: r${i}`).join("\n");
    expect(parseReplies(raw)).toHaveLength(3);
  });

  it("descarta una línea REPLY: sin cuerpo en inglés", () => {
    expect(parseReplies("REPLY:  :: solo nota")).toEqual([]);
  });

  it("devuelve lista vacía cuando no hay líneas parseables", () => {
    expect(parseReplies("texto sin viñeta ni prefijo")).toEqual([]);
  });
});

describe("parsePhonetics", () => {
  it("parsea filas 'frase | suena | traducción'", () => {
    const raw = "hello there | jelou der | hola ahí";
    expect(parsePhonetics(raw)).toEqual([
      { word: "hello there", sounds: "jelou der", translation: "hola ahí" },
    ]);
  });

  it("es leniente cuando falta la traducción", () => {
    expect(parsePhonetics("today | tudéi")).toEqual([
      { word: "today", sounds: "tudéi", translation: "" },
    ]);
  });

  it("descarta una línea sin ningún campo de pronunciación", () => {
    // sin pipe → sounds y translation vacíos → se ignora
    expect(parsePhonetics("solo la frase")).toEqual([]);
  });

  it("salta filas de encabezado (WORD/INGL/PRON/IPA)", () => {
    const raw = "WORD | SOUNDS | TRANSLATION\nhi | jai | hola";
    expect(parsePhonetics(raw)).toEqual([
      { word: "hi", sounds: "jai", translation: "hola" },
    ]);
  });

  it("quita viñetas y numeración del inicio de la frase", () => {
    expect(parsePhonetics("- hello | jelou | hola")[0].word).toBe("hello");
    expect(parsePhonetics("1. hello | jelou | hola")[0].word).toBe("hello");
  });

  it("limpia markdown y reemplaza pipes internos por barras", () => {
    // celdas rodeadas de asteriscos/backticks se limpian en los extremos
    const row = parsePhonetics("*hello* | `jelou` | hola")[0];
    expect(row.word).toBe("hello");
    expect(row.sounds).toBe("jelou");
  });

  it("limita a 10 filas como máximo", () => {
    const raw = Array.from({ length: 12 }, (_, i) => `w${i} | s${i} | t${i}`).join("\n");
    expect(parsePhonetics(raw)).toHaveLength(10);
  });

  it("devuelve lista vacía para entrada vacía", () => {
    expect(parsePhonetics("")).toEqual([]);
  });
});

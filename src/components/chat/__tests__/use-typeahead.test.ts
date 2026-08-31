import { describe, expect, it } from "vitest";
import { joinSuffix } from "../use-typeahead";

describe("joinSuffix", () => {
  it("separa con espacio la continuación de una palabra terminada", () => {
    expect(joinSuffix("I need access", "to the shared drive.")).toBe(" to the shared drive.");
  });

  it("no duplica el espacio si el texto ya termina en uno", () => {
    expect(joinSuffix("I need access ", "to the drive.")).toBe("to the drive.");
  });

  it("recorta el prefijo cuando el modelo repite lo ya escrito", () => {
    expect(joinSuffix("I need access", "I need access to the API key.")).toBe(" to the API key.");
  });

  it("no añade espacio antes de un signo de puntuación", () => {
    expect(joinSuffix("I am blocked", ", so I need help.")).toBe(", so I need help.");
  });

  it("devuelve vacío si el modelo no aporta nada nuevo", () => {
    expect(joinSuffix("I need access", "   ")).toBe("");
    expect(joinSuffix("I need access", "I need access")).toBe("");
  });
});

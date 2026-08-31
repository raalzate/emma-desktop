/**
 * Las diez reglas del método (0.7) y los cinco errores de método a evitar
 * (0.8), transcritos del libro. Sirven de base para coaching/UI: mensajes de
 * refuerzo o advertencias contextuales sin duplicar el texto en la interfaz.
 */

export interface MethodRule {
  readonly id: number;
  readonly rule: string;
  readonly detail: string;
}

export const METHOD_RULES: readonly MethodRule[] = [
  {
    id: 1,
    rule: "40 minutos al día vencen a 4 horas el sábado.",
    detail: "El espaciado es más importante que el volumen total.",
  },
  {
    id: 2,
    rule: "Nunca estudies una palabra suelta.",
    detail: "Siempre en un chunk, siempre con su colocación.",
  },
  {
    id: 3,
    rule: "Si no lo has dicho en voz alta, no lo sabes.",
    detail: "La pronunciación se aprende con los músculos, no con los ojos.",
  },
  {
    id: 4,
    rule: "Traduce del español al inglés, no al revés.",
    detail:
      "La traducción inversa (ES→EN) fuerza producción; la directa (EN→ES) solo comprueba comprensión.",
  },
  {
    id: 5,
    rule: "Comete el error en voz alta.",
    detail: "El error silenciado no se corrige. Ericsson necesita algo que corregir.",
  },
  {
    id: 6,
    rule: "Escribe primero, habla después.",
    detail:
      "Escribir te da tiempo de procesar la estructura; hablar la automatiza. En ese orden, la misma frase.",
  },
  {
    id: 7,
    rule: "Prohibido el subtítulo en español.",
    detail: "Sin subtítulos o subtítulos en inglés. Tu cerebro leerá y apagará el oído.",
  },
  {
    id: 8,
    rule: "Un solo objetivo por sesión.",
    detail: "Carga cognitiva: no puedes atender a pronunciación, gramática y vocabulario a la vez.",
  },
  {
    id: 9,
    rule: "La incomodidad es la señal de que funciona.",
    detail: "Si el repaso te resulta fácil, el intervalo es demasiado corto.",
  },
  {
    id: 10,
    rule: "Usa el inglés en tu trabajo hoy mismo.",
    detail:
      "Cambia el idioma del IDE, escribe tus commits en inglés, comenta tu código en inglés, lee las release notes en inglés.",
  },
] as const;

export const METHOD_MISTAKES: readonly MethodRule[] = [
  {
    id: 1,
    rule: "Ver series sin estructura y llamarlo estudio.",
    detail:
      "Input sin noticing ni output no produce adquisición productiva. Hazlo con input + tarea + producción.",
  },
  {
    id: 2,
    rule: "Estudiar listas de vocabulario.",
    detail:
      "Palabras sin colocación y sin contexto no se recuperan al hablar. Usa chunks en tarjetas cloze.",
  },
  {
    id: 3,
    rule: "Aprender gramática por gramática.",
    detail:
      "Genera conocimiento declarativo inerte. Pon la gramática al servicio de una tarea.",
  },
  {
    id: 4,
    rule: 'Esperar a "estar listo" para hablar.',
    detail: "La fluidez no precede al uso; es consecuencia del uso. Habla mal y en voz alta desde el día 1.",
  },
  {
    id: 5,
    rule: "Perseguir el acento nativo.",
    detail: "Objetivo inalcanzable y desmotivador. Persigue inteligibilidad.",
  },
] as const;

/** La respuesta correcta con las palabras que el aprendiz no acertó resaltadas. */
import { wordDiff } from "@/domain/srs/recall-check";

export function CorrectionLine({ expected, given }: { expected: string; given: string }) {
  const parts = wordDiff(expected, given);
  const allOk = parts.every((p) => p.ok);
  return (
    <p className="flex flex-wrap gap-1 rounded-md bg-primary-soft p-2 text-primary">
      {parts.map((part, i) => (
        <span
          key={`${part.word}-${i}`}
          className={part.ok || allOk ? "" : "rounded bg-scaffold-hard-bg px-1 font-semibold text-scaffold-hard"}
        >
          {part.word}
        </span>
      ))}
    </p>
  );
}

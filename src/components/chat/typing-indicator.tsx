"use client";

/**
 * Burbuja "escribiendo…" estilo WhatsApp en la burbuja de Emma. Con `text`
 * muestra la respuesta parcial mientras se genera (SC-001 de #323): sin esto
 * el aprendiz miraba los tres puntos hasta el final de la generación.
 */

export function TypingIndicator({ text }: { text?: string }) {
  const partial = text?.trim();
  return (
    <div className="flex gap-2" data-testid={partial ? "emma-streaming" : "emma-typing"}>
      <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-primary font-semibold text-primary-foreground">
        E
      </div>
      {partial ? (
        <div className="max-w-[75%] rounded-2xl rounded-tl-sm bg-card px-4 py-3 text-foreground shadow-sm">
          {partial}
        </div>
      ) : (
        <div className="flex items-center gap-1 rounded-2xl rounded-tl-sm bg-muted px-4 py-3 shadow-sm">
          {[0, 1, 2].map((i) => (
            <span
              key={i}
              className="h-2 w-2 animate-bounce rounded-full bg-foreground/40"
              style={{ animationDelay: `${i * 150}ms` }}
            />
          ))}
        </div>
      )}
    </div>
  );
}

"use client";

import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";

/**
 * Render de Markdown (con tablas GFM) para las salidas de IA: reporte de feedback,
 * secciones del "Teach me" y pares bilingües de traducción. Estilos prose ligeros.
 */
export function Markdown({ children }: { children: string }) {
  return (
    <div className="prose prose-sm dark:prose-invert max-w-none prose-table:text-xs prose-pre:bg-muted">
      <ReactMarkdown remarkPlugins={[remarkGfm]}>{children}</ReactMarkdown>
    </div>
  );
}

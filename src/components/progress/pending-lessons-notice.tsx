"use client";

/**
 * Mensaje compartido de FR-006: se repite en el trazado, la recomendación y
 * la entrada por deep-link, así que vive en un solo sitio.
 */

import Link from "next/link";

export function PendingLessonsNotice() {
  return (
    <p className="text-center text-sm text-muted-foreground">
      Finish your pending lessons to unlock the next scene.{" "}
      <Link
        href="/practice"
        title="Abre Mis lecciones para terminar tu práctica pendiente"
        className="font-medium text-primary underline-offset-4 hover:underline"
      >
        My lessons
      </Link>
    </p>
  );
}

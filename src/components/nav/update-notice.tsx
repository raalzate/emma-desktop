"use client";

/**
 * Aviso de versión nueva en la barra lateral (#383). El chequeo de arranque
 * sólo lo veía quien tuviera Ajustes abierto en ese momento; ahora queda
 * visible en toda la app y lleva a Ajustes, donde están descargar/instalar.
 */

import Link from "next/link";
import { ArrowUpCircle } from "lucide-react";
import { updateNoticeOf } from "@/domain/updates/update-status";
import { useUpdateStatus } from "@/components/settings/use-update-status";

export function UpdateNotice() {
  const notice = updateNoticeOf(useUpdateStatus());
  if (!notice) return null;
  return (
    <Link
      // La tarjeta Updates vive en la pestaña System (verificado con la 0.13.3 instalada).
      href="/settings/?tab=system"
      title={
        notice.ready
          ? `La versión ${notice.version} ya está descargada: reinicia EMMA desde Ajustes para instalarla`
          : `Hay una versión nueva de EMMA (${notice.version}): ábrela en Ajustes para descargarla`
      }
      className="flex items-center gap-2 rounded-[10px] bg-primary-soft px-3 py-2.5 text-sm font-medium text-primary-deep hover:bg-primary-soft/80"
    >
      <ArrowUpCircle className="h-4 w-4 shrink-0" aria-hidden />
      {notice.ready ? `EMMA ${notice.version} ready to install` : `EMMA ${notice.version} is available`}
    </Link>
  );
}

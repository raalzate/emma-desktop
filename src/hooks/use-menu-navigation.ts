"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";

/**
 * Escucha las órdenes de navegación del menú nativo (main → 'navigate') y las
 * enruta con el router de Next. Se monta una vez en el layout cliente raíz.
 */
export function useMenuNavigation(): void {
  const router = useRouter();
  useEffect(() => {
    const off = window.emmaAPI?.navigate((route) => router.push(route));
    return () => off?.();
  }, [router]);
}

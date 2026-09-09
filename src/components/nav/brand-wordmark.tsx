import { cn } from "@/lib/utils";

/**
 * Wordmark de la marca: «emma» en minúscula con la tipografía display y un
 * punto final en ámbar (--accent). Identidad del rediseño «Café sereno».
 */
export function BrandWordmark({ className }: { className?: string }) {
  return (
    <span className={cn("font-headline text-xl font-bold lowercase tracking-tight", className)}>
      emma<span className="text-accent">.</span>
    </span>
  );
}

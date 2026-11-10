"use client";
import { usePathname } from "next/navigation";

/** Muestra su contenido en el sitio público y lo oculta dentro del panel del hotel. */
export function SoloSitioPublico({ children }: { children: React.ReactNode }) {
  const ruta = usePathname();
  const esPanel = ruta.startsWith("/panel") || ruta === "/ingresar";
  return esPanel ? null : <>{children}</>;
}

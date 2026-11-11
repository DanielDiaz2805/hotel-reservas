"use client";
import type { ComponentType } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { IconoAjustes, IconoCalendario, IconoCama, IconoInicio, IconoReservas } from "@/components/panel/Iconos";

type Seccion = {
  texto: string;
  href: string;
  icono: ComponentType<{ className?: string }>;
  /** false = la sección aún no existe: se muestra con la etiqueta "Pronto" y no se puede abrir */
  lista: boolean;
};

// A medida que se construye cada sección, se cambia `lista` a true
const SECCIONES: Seccion[] = [
  { texto: "Inicio", href: "/panel", icono: IconoInicio, lista: true },
  { texto: "Reservas", href: "/panel/reservas", icono: IconoReservas, lista: true },
  { texto: "Calendario", href: "/panel/calendario", icono: IconoCalendario, lista: true },
  { texto: "Habitaciones", href: "/panel/habitaciones", icono: IconoCama, lista: true },
  { texto: "Configuración", href: "/panel/configuracion", icono: IconoAjustes, lista: true },
];

/**
 * Menú del panel.
 * - "lateral": columna a la izquierda en computador.
 * - "inferior": barra fija abajo en celular, al alcance del pulgar.
 */
export function NavegacionPanel({ variante }: { variante: "lateral" | "inferior" }) {
  const ruta = usePathname();
  const activa = (s: Seccion) => (s.href === "/panel" ? ruta === "/panel" : ruta.startsWith(s.href));

  if (variante === "lateral") {
    return (
      <nav aria-label="Secciones del panel" className="flex flex-col gap-1">
        {SECCIONES.map((s) => {
          const Icono = s.icono;
          const actual = activa(s);
          const base = "relative flex items-center gap-3 rounded-xl px-3.5 py-2.5 text-sm font-medium transition-colors";
          if (!s.lista) {
            return (
              <span key={s.href} aria-disabled="true" className={`${base} cursor-default text-white/35`}>
                <Icono />
                {s.texto}
                <span className="ml-auto rounded-full bg-white/10 px-2 py-0.5 text-[0.65rem] font-semibold text-white/55">Pronto</span>
              </span>
            );
          }
          return (
            <Link
              key={s.href}
              href={s.href}
              aria-current={actual ? "page" : undefined}
              className={`${base} ${actual ? "bg-white/10 text-white" : "text-white/70 hover:bg-white/5 hover:text-white"}`}
            >
              {actual && <span aria-hidden className="absolute -left-3 top-1/2 h-5 w-1 -translate-y-1/2 rounded-full bg-sol animate-escala" />}
              <Icono />
              {s.texto}
            </Link>
          );
        })}
      </nav>
    );
  }

  return (
    <nav
      aria-label="Secciones del panel"
      className="fixed inset-x-0 bottom-0 z-30 border-t border-linea bg-white/95 backdrop-blur lg:hidden"
    >
      <ul className="mx-auto grid max-w-md" style={{ gridTemplateColumns: `repeat(${SECCIONES.length}, minmax(0, 1fr))` }}>
        {SECCIONES.map((s) => {
          const Icono = s.icono;
          const actual = activa(s);
          const contenido = (
            <>
              {actual && <span aria-hidden className="absolute top-0 h-0.5 w-9 rounded-full bg-sol animate-escala" />}
              <Icono />
              <span className="text-[0.7rem] font-medium">{s.texto}</span>
            </>
          );
          const base = "relative flex flex-col items-center gap-1 px-2 pb-3 pt-3";
          return (
            <li key={s.href}>
              {s.lista ? (
                <Link href={s.href} aria-current={actual ? "page" : undefined} className={`${base} ${actual ? "text-rio" : "text-niebla"}`}>
                  {contenido}
                </Link>
              ) : (
                <span aria-disabled="true" className={`${base} text-niebla/40`}>
                  {contenido}
                </span>
              )}
            </li>
          );
        })}
      </ul>
    </nav>
  );
}

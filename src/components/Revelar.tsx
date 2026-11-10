"use client";
import { useEffect, useRef } from "react";

/**
 * Hace aparecer su contenido con un desplazamiento suave cuando entra en
 * pantalla. `retraso` permite escalonar varios elementos (efecto cascada).
 */
export function Revelar({
  children,
  retraso = 0,
  className = "",
}: {
  children: React.ReactNode;
  retraso?: number;
  className?: string;
}) {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const observador = new IntersectionObserver(
      ([entrada]) => {
        if (entrada.isIntersecting) {
          el.dataset.revelar = "visible";
          observador.disconnect();
        }
      },
      { threshold: 0.15 }
    );
    observador.observe(el);
    return () => observador.disconnect();
  }, []);

  return (
    <div ref={ref} data-revelar="" className={className} style={{ "--retraso": `${retraso}ms` } as React.CSSProperties}>
      {children}
    </div>
  );
}

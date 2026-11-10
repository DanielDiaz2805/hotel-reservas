"use client";
import { useEffect, useState } from "react";

/** Número que cuenta desde 0 hasta su valor al aparecer en pantalla. */
export function Contador({ valor, duracion = 900, retraso = 0 }: { valor: number; duracion?: number; retraso?: number }) {
  const [actual, setActual] = useState(0);

  useEffect(() => {
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches || valor === 0) {
      setActual(valor);
      return;
    }
    let cuadro = 0;
    const iniciar = setTimeout(() => {
      const inicio = performance.now();
      const paso = (ahora: number) => {
        const t = Math.min(1, (ahora - inicio) / duracion);
        setActual(Math.round(valor * (1 - Math.pow(1 - t, 3))));
        if (t < 1) cuadro = requestAnimationFrame(paso);
      };
      cuadro = requestAnimationFrame(paso);
    }, retraso);
    return () => {
      clearTimeout(iniciar);
      cancelAnimationFrame(cuadro);
    };
  }, [valor, duracion, retraso]);

  return <span className="tabular-nums">{actual}</span>;
}

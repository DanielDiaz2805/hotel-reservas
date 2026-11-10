"use client";
import { useEffect, useState } from "react";
import { Contador } from "@/components/Contador";

/** Anillo que se llena hasta el porcentaje de ocupación de esta noche. */
export function AnilloOcupacion({ ocupadas, total }: { ocupadas: number; total: number }) {
  const porcentaje = total ? ocupadas / total : 0;
  const [progreso, setProgreso] = useState(0);
  useEffect(() => {
    const t = setTimeout(() => setProgreso(porcentaje), 150);
    return () => clearTimeout(t);
  }, [porcentaje]);

  const radio = 42;
  const circunferencia = 2 * Math.PI * radio;
  return (
    <div className="relative h-28 w-28 shrink-0">
      <svg viewBox="0 0 100 100" className="h-full w-full -rotate-90" aria-hidden>
        <circle cx="50" cy="50" r={radio} fill="none" strokeWidth="9" className="stroke-white/12" />
        <circle
          cx="50"
          cy="50"
          r={radio}
          fill="none"
          strokeWidth="9"
          strokeLinecap="round"
          className="stroke-sol transition-[stroke-dashoffset] duration-[1400ms] ease-out"
          strokeDasharray={circunferencia}
          strokeDashoffset={circunferencia * (1 - progreso)}
        />
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <span className="font-display text-2xl font-semibold">
          <Contador valor={Math.round(porcentaje * 100)} duracion={1400} />%
        </span>
      </div>
    </div>
  );
}

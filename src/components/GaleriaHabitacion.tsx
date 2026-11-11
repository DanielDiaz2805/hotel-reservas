"use client";
import { useState } from "react";
import Image from "next/image";
import { VisualHabitacion } from "@/components/VisualHabitacion";

type Props = { imagenes: string[]; nombre: string; tipo: string; capacidad: number };

/** Foto principal con miniaturas. Sin fotos, muestra la ilustración de la habitación. */
export function GaleriaHabitacion({ imagenes, nombre, tipo, capacidad }: Props) {
  const [actual, setActual] = useState(0);

  if (imagenes.length === 0) {
    return (
      <div className="relative aspect-[4/3] overflow-hidden rounded-3xl border border-linea">
        <VisualHabitacion nombre={nombre} tipo={tipo} capacidad={capacidad} prioridad />
      </div>
    );
  }

  const total = imagenes.length;
  const ir = (paso: number) => setActual((a) => (a + paso + total) % total);

  return (
    <div>
      <div className="relative aspect-[4/3] overflow-hidden rounded-3xl border border-linea bg-papel">
        <Image
          key={imagenes[actual]}
          src={imagenes[actual]}
          alt={`${nombre}, foto ${actual + 1} de ${total}`}
          fill
          priority={actual === 0}
          sizes="(min-width: 1024px) 60vw, 100vw"
          className="object-cover animate-aparecer"
        />
        {total > 1 && (
          <>
            <button
              type="button"
              onClick={() => ir(-1)}
              aria-label="Foto anterior"
              className="absolute left-3 top-1/2 grid h-10 w-10 -translate-y-1/2 place-items-center rounded-full bg-white/90 text-lg shadow transition-transform hover:scale-110 active:scale-95"
            >
              ←
            </button>
            <button
              type="button"
              onClick={() => ir(1)}
              aria-label="Foto siguiente"
              className="absolute right-3 top-1/2 grid h-10 w-10 -translate-y-1/2 place-items-center rounded-full bg-white/90 text-lg shadow transition-transform hover:scale-110 active:scale-95"
            >
              →
            </button>
            <span className="absolute bottom-3 right-3 rounded-full bg-black/55 px-3 py-1 text-xs font-medium text-white tabular-nums">
              {actual + 1} / {total}
            </span>
          </>
        )}
      </div>

      {total > 1 && (
        <ul className="mt-3 flex gap-2.5 overflow-x-auto pb-1">
          {imagenes.map((url, i) => (
            <li key={url} className="shrink-0">
              <button
                type="button"
                onClick={() => setActual(i)}
                aria-label={`Ver la foto ${i + 1}`}
                aria-current={i === actual}
                className={`relative block h-16 w-24 overflow-hidden rounded-xl border-2 transition-all duration-200 ${
                  i === actual ? "border-rio" : "border-transparent opacity-70 hover:opacity-100"
                }`}
              >
                <Image src={url} alt="" fill sizes="96px" className="object-cover" />
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

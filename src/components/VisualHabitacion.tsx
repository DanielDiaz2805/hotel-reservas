import Image from "next/image";

// Color de fondo por tipo cuando la habitación aún no tiene foto
const tonos: Record<string, string> = {
  sencilla: "bg-[#dce9e2]",
  doble: "bg-[#cfe3da]",
  familiar: "bg-[#f6e3b8]",
  suite: "bg-[#1e6b5a]",
};

/**
 * Muestra la primera foto de la habitación. Si aún no tiene fotos,
 * dibuja una ilustración con una cama por cada huésped que admite.
 */
export function VisualHabitacion({
  nombre,
  tipo,
  capacidad,
  imagen,
  prioridad = false,
}: {
  nombre: string;
  tipo: string;
  capacidad: number;
  imagen?: string;
  prioridad?: boolean;
}) {
  if (imagen) {
    return (
      <Image
        src={imagen}
        alt={`Habitación ${nombre}`}
        fill
        sizes="(min-width: 1024px) 33vw, (min-width: 640px) 50vw, 100vw"
        className="object-cover"
        priority={prioridad}
      />
    );
  }

  const oscuro = tipo === "suite";
  return (
    <div className={`flex h-full w-full items-center justify-center ${tonos[tipo] ?? tonos.doble}`} aria-hidden>
      <div className="flex gap-4">
        {Array.from({ length: Math.min(capacidad, 4) }).map((_, i) => (
          <svg key={i} width="64" height="52" viewBox="0 0 44 36" fill="none">
            <rect x="2" y="12" width="40" height="16" rx="3" className={oscuro ? "fill-white/15" : "fill-white/70"} />
            <rect x="6" y="5" width="13" height="9" rx="3" className={oscuro ? "fill-sol" : "fill-rio"} />
            <rect x="2" y="27" width="4" height="7" rx="1" className={oscuro ? "fill-white/40" : "fill-rio-oscuro/40"} />
            <rect x="38" y="27" width="4" height="7" rx="1" className={oscuro ? "fill-white/40" : "fill-rio-oscuro/40"} />
          </svg>
        ))}
      </div>
    </div>
  );
}

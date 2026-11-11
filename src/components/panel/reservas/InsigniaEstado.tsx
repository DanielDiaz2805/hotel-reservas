import { ETIQUETA_ESTADO, type EstadoReserva } from "@/lib/reservas-estados";

const estilos: Record<EstadoReserva, { insignia: string; punto: string }> = {
  pendiente: { insignia: "bg-sol/20 text-[#7a5300]", punto: "bg-sol animate-pulse" },
  confirmada: { insignia: "bg-rio/12 text-rio-oscuro", punto: "bg-rio" },
  en_casa: { insignia: "bg-sky-100 text-sky-800", punto: "bg-sky-500" },
  finalizada: { insignia: "bg-papel text-niebla ring-1 ring-inset ring-linea", punto: "bg-niebla/60" },
  cancelada: { insignia: "bg-red-100 text-red-800", punto: "bg-red-500" },
};

export function InsigniaEstado({ estado }: { estado: EstadoReserva }) {
  const e = estilos[estado];
  return (
    <span className={`inline-flex items-center gap-1.5 whitespace-nowrap rounded-full px-2.5 py-1 text-xs font-semibold ${e.insignia}`}>
      <span className={`h-1.5 w-1.5 rounded-full ${e.punto}`} />
      {ETIQUETA_ESTADO[estado]}
    </span>
  );
}

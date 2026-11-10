"use client";
import { useState } from "react";
import { sumarDias } from "@/lib/fechas";

type Props = {
  hoy: string;
  inicial?: { llegada?: string; salida?: string; huespedes?: number };
};

/**
 * Buscador de disponibilidad. Es un formulario GET normal: al enviarlo, las
 * fechas quedan en la URL (/?llegada=…&salida=…), así la búsqueda se puede
 * compartir o recargar. El estado solo sirve para ajustar las fechas mínimas.
 */
export function BuscadorFechas({ hoy, inicial }: Props) {
  const [llegada, setLlegada] = useState(inicial?.llegada ?? hoy);
  const [salida, setSalida] = useState(inicial?.salida ?? sumarDias(hoy, 1));

  const cambiarLlegada = (valor: string) => {
    setLlegada(valor);
    // Si la salida queda antes o igual a la nueva llegada, se mueve al día siguiente
    if (valor && salida <= valor) setSalida(sumarDias(valor, 1));
  };

  const campo =
    "mt-1 w-full rounded-xl border border-white/20 bg-white px-3 py-2.5 text-tinta focus:border-sol focus:outline-none";

  return (
    <form
      action="/#habitaciones"
      method="get"
      className="mt-10 grid max-w-3xl gap-3 rounded-2xl bg-white/10 p-4 backdrop-blur sm:grid-cols-[1fr_1fr_0.7fr_auto] sm:items-end"
    >
      <label className="text-sm font-medium text-white/90">
        Llegada
        <input
          type="date"
          name="llegada"
          required
          min={hoy}
          value={llegada}
          onChange={(e) => cambiarLlegada(e.target.value)}
          className={campo}
        />
      </label>
      <label className="text-sm font-medium text-white/90">
        Salida
        <input
          type="date"
          name="salida"
          required
          min={sumarDias(llegada || hoy, 1)}
          value={salida}
          onChange={(e) => setSalida(e.target.value)}
          className={campo}
        />
      </label>
      <label className="text-sm font-medium text-white/90">
        Huéspedes
        <select name="huespedes" defaultValue={inicial?.huespedes ?? 2} className={campo}>
          {[1, 2, 3, 4].map((n) => (
            <option key={n} value={n}>
              {n}
            </option>
          ))}
        </select>
      </label>
      <button
        type="submit"
        className="rounded-xl bg-sol px-6 py-3 font-semibold text-rio-oscuro transition-colors hover:bg-white"
      >
        Ver disponibilidad
      </button>
    </form>
  );
}

"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { Boton } from "@/components/panel/ui/Boton";
import { useAvisos } from "@/components/panel/ui/Proveedor";

type Props = {
  habitaciones: { id: string; nombre: string }[];
  hoy: string;
  /** Datos con los que se abre el formulario (por ejemplo, al tocar un día libre del calendario) */
  inicial?: { habitacion?: string; desde?: string };
};

const MOTIVOS = ["Mantenimiento", "Uso del dueño", "Temporada cerrada", "Limpieza profunda"];

const entrada =
  "mt-1.5 w-full rounded-xl border border-linea bg-white px-4 py-3 transition-shadow focus:border-rio focus:shadow-[0_0_0_4px_rgba(30,107,90,0.12)] focus:outline-none";

export function BloquearFechas({ habitaciones, hoy, inicial }: Props) {
  const router = useRouter();
  const avisos = useAvisos();
  const [abierto, setAbierto] = useState(Boolean(inicial?.habitacion));
  const [habitacion, setHabitacion] = useState(inicial?.habitacion ?? habitaciones[0]?.id ?? "");
  const [desde, setDesde] = useState(inicial?.desde ?? hoy);
  const [ultimoDia, setUltimoDia] = useState(inicial?.desde ?? hoy);
  const [motivo, setMotivo] = useState("Mantenimiento");
  const [guardando, setGuardando] = useState(false);
  const [errores, setErrores] = useState<Record<string, string>>({});

  async function guardar(e: React.FormEvent) {
    e.preventDefault();
    if (guardando) return;
    setGuardando(true);
    setErrores({});
    try {
      const r = await fetch("/api/panel/bloqueos", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ habitacion, desde, ultimoDia, motivo }),
      });
      if (r.status === 401) {
        router.push("/ingresar");
        return;
      }
      const datos = await r.json().catch(() => ({}));
      if (!r.ok) {
        if (datos.errores) setErrores(datos.errores);
        avisos.error(datos.mensaje ?? "No se pudo bloquear");
        return;
      }
      avisos.exito("Fechas bloqueadas", "Esa habitación no se ofrecerá en la web en esos días.");
      setAbierto(false);
      router.replace("/panel/calendario");
      router.refresh();
    } catch {
      avisos.error("No se pudo bloquear", "Revisa tu conexión e inténtalo otra vez.");
    } finally {
      setGuardando(false);
    }
  }

  if (!abierto) {
    return (
      <Boton variante="secundario" onClick={() => setAbierto(true)}>
        Bloquear fechas
      </Boton>
    );
  }

  return (
    <form onSubmit={guardar} noValidate className="w-full rounded-3xl border border-linea bg-white p-6 animate-escala">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h2 className="font-display text-lg font-semibold">Bloquear fechas</h2>
          <p className="mt-1 text-sm text-niebla">La habitación no se podrá reservar en esos días, ni por la web ni desde el panel.</p>
        </div>
        <button type="button" onClick={() => setAbierto(false)} className="text-sm font-medium text-niebla hover:text-tinta">
          Cerrar
        </button>
      </div>

      <div className="mt-5 grid gap-5 sm:grid-cols-3">
        <div>
          <label htmlFor="bl-habitacion" className="text-sm font-medium">Habitación</label>
          <select id="bl-habitacion" value={habitacion} onChange={(e) => setHabitacion(e.target.value)} className={entrada}>
            {habitaciones.map((h) => (
              <option key={h.id} value={h.id}>{h.nombre}</option>
            ))}
          </select>
          {errores.habitacion && <p role="alert" className="mt-1.5 text-sm text-red-700">{errores.habitacion}</p>}
        </div>
        <div>
          <label htmlFor="bl-desde" className="text-sm font-medium">Desde el día</label>
          <input
            id="bl-desde"
            type="date"
            min={hoy}
            value={desde}
            onChange={(e) => {
              setDesde(e.target.value);
              if (e.target.value && ultimoDia < e.target.value) setUltimoDia(e.target.value);
            }}
            className={entrada}
          />
          {errores.desde && <p role="alert" className="mt-1.5 text-sm text-red-700">{errores.desde}</p>}
        </div>
        <div>
          <label htmlFor="bl-hasta" className="text-sm font-medium">Hasta el día (incluido)</label>
          <input id="bl-hasta" type="date" min={desde} value={ultimoDia} onChange={(e) => setUltimoDia(e.target.value)} className={entrada} />
          {errores.ultimoDia && <p role="alert" className="mt-1.5 text-sm text-red-700">{errores.ultimoDia}</p>}
        </div>
      </div>

      <div className="mt-5">
        <label htmlFor="bl-motivo" className="text-sm font-medium">Motivo</label>
        <div className="mt-2 flex flex-wrap gap-2">
          {MOTIVOS.map((m) => (
            <button
              key={m}
              type="button"
              onClick={() => setMotivo(m)}
              className={`rounded-full border px-3.5 py-1.5 text-xs font-semibold transition-colors ${motivo === m ? "border-rio bg-rio/10 text-rio-oscuro" : "border-linea hover:border-rio"}`}
            >
              {m}
            </button>
          ))}
        </div>
        <input id="bl-motivo" value={motivo} maxLength={80} onChange={(e) => setMotivo(e.target.value)} className={entrada} placeholder="Escribe otro motivo" />
        {errores.motivo && <p role="alert" className="mt-1.5 text-sm text-red-700">{errores.motivo}</p>}
      </div>

      <div className="mt-6 flex flex-wrap gap-2">
        <Boton type="submit" cargando={guardando}>Bloquear</Boton>
        <Boton variante="secundario" onClick={() => setAbierto(false)}>Cancelar</Boton>
      </div>
    </form>
  );
}

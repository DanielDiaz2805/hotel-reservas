"use client";
import { useEffect, useState } from "react";
import { contarNoches, fechaLegible, sumarDias } from "@/lib/fechas";
import { formatearPrecio } from "@/lib/formato";

type Props = {
  habitacion: { id: string; slug: string; nombre: string; precioNoche: number; capacidad: number };
  hoy: string;
  inicial: { llegada?: string; salida?: string; huespedes?: number };
};

type Confirmacion = {
  codigo: string;
  habitacion: string;
  llegada: string;
  salida: string;
  noches: number;
  total: number;
  huespedes: number;
  estado: string;
};

type Disponibilidad = "desconocida" | "consultando" | "disponible" | "ocupada";

export function FormularioReserva({ habitacion, hoy, inicial }: Props) {
  const [llegada, setLlegada] = useState(inicial.llegada ?? "");
  const [salida, setSalida] = useState(inicial.salida ?? "");
  const [huespedes, setHuespedes] = useState(Math.min(inicial.huespedes ?? 1, habitacion.capacidad));
  const [disponibilidad, setDisponibilidad] = useState<Disponibilidad>("desconocida");
  const [errores, setErrores] = useState<Record<string, string>>({});
  const [mensaje, setMensaje] = useState("");
  const [enviando, setEnviando] = useState(false);
  const [confirmacion, setConfirmacion] = useState<Confirmacion | null>(null);

  const fechasCompletas = Boolean(llegada && salida && salida > llegada);
  const noches = fechasCompletas ? contarNoches(llegada, salida) : 0;

  // Consulta la disponibilidad de esta habitación cada vez que cambian las fechas.
  // Espera 300 ms para no consultar en cada clic y cancela la consulta anterior.
  useEffect(() => {
    if (!fechasCompletas) {
      setDisponibilidad("desconocida");
      return;
    }
    const control = new AbortController();
    const temporizador = setTimeout(async () => {
      setDisponibilidad("consultando");
      try {
        const consulta = new URLSearchParams({ llegada, salida, huespedes: String(huespedes) });
        const r = await fetch(`/api/disponibilidad?${consulta}`, { signal: control.signal });
        if (!r.ok) return setDisponibilidad("desconocida");
        const datos: { habitaciones: { slug: string }[] } = await r.json();
        setDisponibilidad(datos.habitaciones.some((h) => h.slug === habitacion.slug) ? "disponible" : "ocupada");
      } catch {
        if (!control.signal.aborted) setDisponibilidad("desconocida");
      }
    }, 300);
    return () => {
      clearTimeout(temporizador);
      control.abort();
    };
  }, [llegada, salida, huespedes, fechasCompletas, habitacion.slug]);

  const cambiarLlegada = (valor: string) => {
    setLlegada(valor);
    if (valor && (!salida || salida <= valor)) setSalida(sumarDias(valor, 1));
  };

  async function enviar(evento: React.FormEvent<HTMLFormElement>) {
    evento.preventDefault();
    setErrores({});
    setMensaje("");
    setEnviando(true);

    const formulario = new FormData(evento.currentTarget);
    try {
      const r = await fetch("/api/reservas", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          habitacion: habitacion.id,
          llegada,
          salida,
          huespedes,
          nombre: formulario.get("nombre"),
          telefono: formulario.get("telefono"),
          notas: formulario.get("notas"),
        }),
      });
      const datos = await r.json();
      if (r.status === 201) {
        setConfirmacion(datos);
      } else {
        setErrores(datos.errores ?? {});
        setMensaje(datos.mensaje ?? "No se pudo crear la reserva.");
        if (r.status === 409) setDisponibilidad("ocupada");
      }
    } catch {
      setMensaje("No hay conexión con el servidor. Revisa tu internet e inténtalo de nuevo.");
    } finally {
      setEnviando(false);
    }
  }

  if (confirmacion) {
    return (
      <div role="status" className="rounded-2xl border border-rio/30 bg-white p-6">
        <p className="text-sm font-medium text-rio">Solicitud de reserva recibida</p>
        <p className="mt-2 font-display text-3xl font-semibold tracking-wide">{confirmacion.codigo}</p>
        <p className="mt-1 text-sm text-niebla">Guarda este código: lo necesitarás para cualquier consulta.</p>
        <dl className="mt-6 grid grid-cols-2 gap-y-3 text-[0.95rem]">
          <dt className="text-niebla">Habitación</dt>
          <dd>{confirmacion.habitacion}</dd>
          <dt className="text-niebla">Llegada</dt>
          <dd>{fechaLegible(confirmacion.llegada)}</dd>
          <dt className="text-niebla">Salida</dt>
          <dd>{fechaLegible(confirmacion.salida)}</dd>
          <dt className="text-niebla">Huéspedes</dt>
          <dd>{confirmacion.huespedes}</dd>
          <dt className="text-niebla">Total</dt>
          <dd className="font-semibold">
            {formatearPrecio(confirmacion.total)} ({confirmacion.noches} {confirmacion.noches === 1 ? "noche" : "noches"})
          </dd>
        </dl>
        <p className="mt-6 rounded-xl bg-papel p-4 text-sm">
          Tu reserva está <strong>pendiente</strong>. El hotel la confirmará por WhatsApp.
        </p>
      </div>
    );
  }

  const campo =
    "mt-1 w-full rounded-xl border border-linea bg-white px-3 py-2.5 focus:border-rio focus:outline-none aria-[invalid=true]:border-red-400";
  const error = (nombre: string) =>
    errores[nombre] ? (
      <span id={`error-${nombre}`} className="mt-1 block text-sm text-red-700">
        {errores[nombre]}
      </span>
    ) : null;
  const atributosError = (nombre: string) => ({
    "aria-invalid": errores[nombre] ? true : undefined,
    "aria-describedby": errores[nombre] ? `error-${nombre}` : undefined,
  });

  return (
    <form onSubmit={enviar} noValidate className="rounded-2xl border border-linea bg-white p-6">
      <p>
        <span className="font-display text-3xl font-semibold">{formatearPrecio(habitacion.precioNoche)}</span>
        <span className="text-niebla"> por noche</span>
      </p>

      <div className="mt-6 grid grid-cols-2 gap-3">
        <label className="text-sm font-medium">
          Llegada
          <input
            type="date"
            required
            min={hoy}
            value={llegada}
            onChange={(e) => cambiarLlegada(e.target.value)}
            className={campo}
            {...atributosError("llegada")}
          />
          {error("llegada")}
        </label>
        <label className="text-sm font-medium">
          Salida
          <input
            type="date"
            required
            min={sumarDias(llegada || hoy, 1)}
            value={salida}
            onChange={(e) => setSalida(e.target.value)}
            className={campo}
            {...atributosError("salida")}
          />
          {error("salida")}
        </label>
      </div>

      <p aria-live="polite" className="mt-3 min-h-6 text-sm">
        {disponibilidad === "consultando" && <span className="text-niebla">Consultando disponibilidad…</span>}
        {disponibilidad === "disponible" && (
          <span className="font-medium text-rio">
            Disponible: {noches} {noches === 1 ? "noche" : "noches"} por {formatearPrecio(noches * habitacion.precioNoche)}
          </span>
        )}
        {disponibilidad === "ocupada" && (
          <span className="font-medium text-red-700">No está disponible en esas fechas. Prueba con otras.</span>
        )}
      </p>

      <label className="mt-3 block text-sm font-medium">
        Huéspedes
        <select value={huespedes} onChange={(e) => setHuespedes(Number(e.target.value))} className={campo}>
          {Array.from({ length: habitacion.capacidad }, (_, i) => i + 1).map((n) => (
            <option key={n} value={n}>
              {n}
            </option>
          ))}
        </select>
      </label>

      <label className="mt-4 block text-sm font-medium">
        Nombre completo
        <input name="nombre" autoComplete="name" required className={campo} {...atributosError("nombre")} />
        {error("nombre")}
      </label>

      <label className="mt-4 block text-sm font-medium">
        Celular con WhatsApp
        <input
          name="telefono"
          type="tel"
          inputMode="tel"
          autoComplete="tel"
          placeholder="300 123 4567"
          required
          className={campo}
          {...atributosError("telefono")}
        />
        {error("telefono")}
      </label>

      <label className="mt-4 block text-sm font-medium">
        Notas <span className="font-normal text-niebla">(opcional)</span>
        <textarea
          name="notas"
          rows={2}
          maxLength={300}
          placeholder="Hora aproximada de llegada, cama extra, etc."
          className={campo}
        />
      </label>

      {mensaje && (
        <p role="alert" className="mt-4 rounded-xl bg-red-50 p-3 text-sm text-red-800">
          {mensaje}
        </p>
      )}

      <button
        type="submit"
        disabled={enviando || disponibilidad === "ocupada" || !fechasCompletas}
        className="mt-6 w-full rounded-full bg-rio px-6 py-3 font-semibold text-white transition-colors hover:bg-rio-oscuro disabled:cursor-not-allowed disabled:opacity-50"
      >
        {enviando ? "Enviando…" : "Solicitar reserva"}
      </button>
      <p className="mt-3 text-center text-xs text-niebla">No se cobra nada ahora. El hotel confirma por WhatsApp.</p>
    </form>
  );
}

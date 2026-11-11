"use client";
import { useEffect, useMemo, useState, type ReactNode } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { contarNoches, fechaLegible } from "@/lib/fechas";
import { formatearPrecio, personas } from "@/lib/formato";
import type { ReservaAdmin } from "@/lib/panel";
import type { HabitacionParaReserva } from "@/lib/reservas-panel";
import { Boton, clasesBoton } from "@/components/panel/ui/Boton";
import { useAvisos } from "@/components/panel/ui/Proveedor";

type Props = {
  /** Si viene, se está modificando esa reserva; si no, se crea una nueva */
  reserva?: ReservaAdmin;
  hoy: string;
  /** Mañana, como salida sugerida en una reserva nueva */
  manana: string;
};

const entrada =
  "mt-1.5 w-full rounded-xl border bg-white px-4 py-3 transition-shadow focus:border-rio focus:shadow-[0_0_0_4px_rgba(30,107,90,0.12)] focus:outline-none";

function Seccion({ titulo, ayuda, children }: { titulo: string; ayuda?: string; children: ReactNode }) {
  return (
    <section className="rounded-3xl border border-linea bg-white p-6 sm:p-7">
      <h2 className="font-display text-lg font-semibold">{titulo}</h2>
      {ayuda && <p className="mt-1 text-sm text-niebla">{ayuda}</p>}
      <div className="mt-5 space-y-5">{children}</div>
    </section>
  );
}

function Campo({ id, etiqueta, error, ayuda, children }: { id: string; etiqueta: string; error?: string; ayuda?: string; children: ReactNode }) {
  return (
    <div id={`campo-${id}`}>
      <label htmlFor={id} className="text-sm font-medium">
        {etiqueta}
      </label>
      {children}
      {error ? (
        <p role="alert" className="mt-1.5 text-sm text-red-700">
          {error}
        </p>
      ) : (
        ayuda && <p className="mt-1.5 text-xs text-niebla">{ayuda}</p>
      )}
    </div>
  );
}

export function FormularioReservaPanel({ reserva, hoy, manana }: Props) {
  const router = useRouter();
  const avisos = useAvisos();
  const edicion = Boolean(reserva);

  const [llegada, setLlegada] = useState(reserva?.llegada ?? hoy);
  const [salida, setSalida] = useState(reserva?.salida ?? manana);
  const [huespedes, setHuespedes] = useState(reserva?.huespedes ?? 2);
  const [habitacionId, setHabitacionId] = useState(reserva?.habitacionId ?? "");
  const [nombre, setNombre] = useState(reserva?.nombre ?? "");
  const [telefono, setTelefono] = useState(reserva?.telefono ?? "");
  const [notas, setNotas] = useState(reserva?.notas ?? "");
  const [estado, setEstado] = useState<"confirmada" | "pendiente">("confirmada");
  const [precioTexto, setPrecioTexto] = useState(reserva ? String(reserva.precioNoche) : "");
  const [precioEditado, setPrecioEditado] = useState(false);

  const [habitaciones, setHabitaciones] = useState<HabitacionParaReserva[] | null>(null);
  const [cargando, setCargando] = useState(false);
  const [errorDisponibilidad, setErrorDisponibilidad] = useState("");
  const [errores, setErrores] = useState<Record<string, string>>({});
  const [guardando, setGuardando] = useState(false);

  const minLlegada = reserva && reserva.llegada < hoy ? reserva.llegada : hoy;
  const rangoValido = /^\d{4}-\d{2}-\d{2}$/.test(llegada) && /^\d{4}-\d{2}-\d{2}$/.test(salida) && salida > llegada;
  const noches = rangoValido ? contarNoches(llegada, salida) : 0;

  // Cada vez que cambian fechas o huéspedes se consulta qué habitaciones están libres
  useEffect(() => {
    if (!rangoValido || noches > 30 || huespedes < 1 || huespedes > 10) {
      setHabitaciones(null);
      setErrorDisponibilidad(rangoValido && noches > 30 ? "Máximo 30 noches por reserva" : "");
      return;
    }
    const control = new AbortController();
    setCargando(true);
    setErrorDisponibilidad("");
    const consulta = new URLSearchParams({ llegada, salida, huespedes: String(huespedes) });
    if (reserva) consulta.set("excluir", reserva.id);
    fetch(`/api/panel/disponibilidad?${consulta}`, { signal: control.signal })
      .then(async (r) => {
        if (r.status === 401) {
          router.push("/ingresar");
          return;
        }
        const datos = await r.json();
        if (!r.ok) throw new Error(datos.mensaje ?? "No se pudo consultar la disponibilidad");
        const lista = datos as HabitacionParaReserva[];
        setHabitaciones(lista);
        setHabitacionId((actual) => (lista.some((h) => h.id === actual && h.libre) ? actual : ""));
      })
      .catch((e: unknown) => {
        if ((e as Error).name === "AbortError") return;
        setErrorDisponibilidad((e as Error).message || "No se pudo consultar la disponibilidad");
        setHabitaciones(null);
      })
      .finally(() => {
        if (!control.signal.aborted) setCargando(false);
      });
    return () => control.abort();
  }, [llegada, salida, huespedes, rangoValido, noches, reserva, router]);

  const elegida = habitaciones?.find((h) => h.id === habitacionId);
  const precioNumero = precioTexto.trim() === "" ? NaN : Number(precioTexto.replace(/[.\s]/g, ""));
  const precioEfectivo = useMemo(() => {
    if (precioEditado && Number.isFinite(precioNumero)) return precioNumero;
    if (reserva && elegida && elegida.id === reserva.habitacionId) return reserva.precioNoche;
    return elegida?.precioNoche ?? reserva?.precioNoche ?? 0;
  }, [precioEditado, precioNumero, reserva, elegida]);
  const total = precioEfectivo * noches;

  function limpiar(campo: string) {
    setErrores((e) => {
      if (!(campo in e)) return e;
      const { [campo]: _q, ...resto } = e;
      void _q;
      return resto;
    });
  }

  async function guardar(e: React.FormEvent) {
    e.preventDefault();
    if (guardando) return;
    if (!habitacionId) {
      setErrores({ habitacion: "Elige una habitación libre para esas fechas" });
      document.getElementById("campo-habitacion")?.scrollIntoView({ behavior: "smooth", block: "center" });
      return;
    }
    setGuardando(true);
    setErrores({});
    const cuerpo: Record<string, unknown> = { llegada, salida, huespedes, habitacion: habitacionId, nombre, telefono, notas };
    if (precioEditado) cuerpo.precioNoche = precioNumero;
    if (!edicion) cuerpo.estado = estado;
    try {
      const r = await fetch(edicion ? `/api/panel/reservas/${reserva!.id}` : "/api/panel/reservas", {
        method: edicion ? "PUT" : "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(cuerpo),
      });
      if (r.status === 401) {
        router.push("/ingresar");
        return;
      }
      const datos = await r.json().catch(() => ({}));
      if (!r.ok) {
        if (datos.errores) {
          setErrores(datos.errores);
          const primero = Object.keys(datos.errores)[0];
          document.getElementById(`campo-${primero}`)?.scrollIntoView({ behavior: "smooth", block: "center" });
        }
        avisos.error(datos.mensaje ?? "No se pudo guardar la reserva");
        // Si otra persona tomó la habitación mientras tanto, se refresca la lista
        if (r.status === 409) setLlegada((v) => v);
        return;
      }
      if (edicion) {
        avisos.exito("Reserva modificada", "El cambio quedó en el historial.");
        router.push(`/panel/reservas/${reserva!.id}`);
      } else {
        avisos.exito("Reserva creada", `Código ${datos.codigo}`);
        router.push(datos.id ? `/panel/reservas/${datos.id}` : "/panel/reservas");
      }
      router.refresh();
    } catch {
      avisos.error("No se pudo guardar", "Revisa tu conexión e inténtalo otra vez.");
    } finally {
      setGuardando(false);
    }
  }

  const libres = habitaciones?.filter((h) => h.libre).length ?? 0;

  return (
    <form onSubmit={guardar} noValidate className="grid gap-6 lg:grid-cols-[1.4fr_1fr]">
      <div className="space-y-6">
        <Seccion titulo="Fechas y huéspedes" ayuda="Al cambiarlas se actualizan las habitaciones libres.">
          <div className="grid gap-5 sm:grid-cols-2">
            <Campo id="llegada" etiqueta="Llegada" error={errores.llegada}>
              <input
                id="llegada"
                type="date"
                min={minLlegada}
                value={llegada}
                onChange={(e) => {
                  const nueva = e.target.value;
                  setLlegada(nueva);
                  // Si la salida queda antes de la llegada, se mueve al día siguiente
                  if (nueva && salida <= nueva) setSalida(new Date(new Date(`${nueva}T00:00:00Z`).getTime() + 86400000).toISOString().slice(0, 10));
                  limpiar("llegada");
                }}
                className={`${entrada} ${errores.llegada ? "border-red-400" : "border-linea"}`}
              />
            </Campo>
            <Campo id="salida" etiqueta="Salida" error={errores.salida}>
              <input
                id="salida"
                type="date"
                min={llegada}
                value={salida}
                onChange={(e) => {
                  setSalida(e.target.value);
                  limpiar("salida");
                }}
                className={`${entrada} ${errores.salida ? "border-red-400" : "border-linea"}`}
              />
            </Campo>
          </div>
          <Campo id="huespedes" etiqueta="Número de huéspedes" error={errores.huespedes}>
            <input
              id="huespedes"
              type="number"
              inputMode="numeric"
              min={1}
              max={10}
              value={huespedes}
              onChange={(e) => {
                setHuespedes(Number(e.target.value));
                limpiar("huespedes");
              }}
              className={`${entrada} sm:max-w-40 ${errores.huespedes ? "border-red-400" : "border-linea"}`}
            />
          </Campo>
        </Seccion>

        <Seccion
          titulo="Habitación"
          ayuda={
            !rangoValido
              ? "Elige primero las fechas."
              : cargando
                ? "Buscando habitaciones libres…"
                : habitaciones
                  ? `${libres} ${libres === 1 ? "habitación libre" : "habitaciones libres"} del ${fechaLegible(llegada)} al ${fechaLegible(salida)}.`
                  : undefined
          }
        >
          <div id="campo-habitacion">
            {errorDisponibilidad && (
              <p role="alert" className="rounded-xl bg-red-50 px-4 py-3 text-sm text-red-700">
                {errorDisponibilidad}
              </p>
            )}
            {habitaciones && habitaciones.length === 0 && (
              <p className="rounded-xl bg-papel px-4 py-3 text-sm text-niebla">No hay habitaciones activas. Crea una en la sección Habitaciones.</p>
            )}
            <div className={`grid gap-3 sm:grid-cols-2 ${cargando ? "opacity-60" : ""}`} role="radiogroup" aria-label="Habitación">
              {habitaciones?.map((h) => {
                const activa = h.id === habitacionId;
                return (
                  <button
                    key={h.id}
                    type="button"
                    role="radio"
                    aria-checked={activa}
                    disabled={!h.libre}
                    onClick={() => {
                      setHabitacionId(h.id);
                      limpiar("habitacion");
                    }}
                    className={`rounded-2xl border p-4 text-left transition-all duration-200 ${
                      activa
                        ? "border-rio bg-rio/5 shadow-[0_0_0_3px_rgba(30,107,90,0.15)]"
                        : h.libre
                          ? "border-linea bg-white hover:-translate-y-0.5 hover:border-rio"
                          : "cursor-not-allowed border-linea bg-papel text-niebla"
                    }`}
                  >
                    <span className="flex items-start justify-between gap-2">
                      <span className="font-display font-semibold">{h.nombre}</span>
                      {activa && <span className="text-rio">✓</span>}
                    </span>
                    <span className="mt-0.5 block text-sm text-niebla">
                      Hasta {personas(h.capacidad)} · {formatearPrecio(h.precioNoche)} por noche
                    </span>
                    {!h.libre && <span className="mt-2 inline-block rounded-full bg-white px-2.5 py-0.5 text-xs font-medium text-red-700">{h.motivo}</span>}
                  </button>
                );
              })}
            </div>
            {errores.habitacion && (
              <p role="alert" className="mt-2 text-sm text-red-700">
                {errores.habitacion}
              </p>
            )}
          </div>
        </Seccion>

        <Seccion titulo="El huésped">
          <Campo id="nombre" etiqueta="Nombre completo" error={errores.nombre}>
            <input
              id="nombre"
              value={nombre}
              onChange={(e) => {
                setNombre(e.target.value);
                limpiar("nombre");
              }}
              autoComplete="off"
              className={`${entrada} ${errores.nombre ? "border-red-400" : "border-linea"}`}
            />
          </Campo>
          <Campo id="telefono" etiqueta="Celular" error={errores.telefono} ayuda="Para escribirle por WhatsApp. Ejemplo: 300 123 4567">
            <input
              id="telefono"
              type="tel"
              inputMode="tel"
              value={telefono}
              onChange={(e) => {
                setTelefono(e.target.value);
                limpiar("telefono");
              }}
              autoComplete="off"
              className={`${entrada} ${errores.telefono ? "border-red-400" : "border-linea"}`}
            />
          </Campo>
          <Campo id="notas" etiqueta="Notas del huésped (opcional)" error={errores.notas} ayuda="Lo que pidió: hora de llegada, cuna, aire, etc.">
            <textarea
              id="notas"
              rows={3}
              maxLength={300}
              value={notas}
              onChange={(e) => {
                setNotas(e.target.value);
                limpiar("notas");
              }}
              className={`${entrada} resize-y ${errores.notas ? "border-red-400" : "border-linea"}`}
            />
          </Campo>
        </Seccion>
      </div>

      <aside className="space-y-6 lg:sticky lg:top-6 lg:self-start">
        <Seccion titulo="Resumen">
          <dl className="space-y-3 text-sm">
            <div className="flex justify-between gap-4">
              <dt className="text-niebla">Habitación</dt>
              <dd className="text-right font-medium">{elegida?.nombre ?? "Sin elegir"}</dd>
            </div>
            <div className="flex justify-between gap-4">
              <dt className="text-niebla">Estadía</dt>
              <dd className="text-right font-medium">{noches > 0 ? `${noches} ${noches === 1 ? "noche" : "noches"}` : "—"}</dd>
            </div>
            <div className="flex justify-between gap-4">
              <dt className="text-niebla">Huéspedes</dt>
              <dd className="text-right font-medium">{huespedes >= 1 ? personas(huespedes) : "—"}</dd>
            </div>
          </dl>

          <Campo
            id="precioNoche"
            etiqueta="Precio por noche"
            error={errores.precioNoche}
            ayuda={precioEditado ? "Precio acordado con el huésped." : "Se usa el precio de la habitación. Escríbelo solo si acordaron otro."}
          >
            <input
              id="precioNoche"
              inputMode="numeric"
              value={precioEditado ? precioTexto : precioEfectivo ? String(precioEfectivo) : ""}
              placeholder="0"
              onChange={(e) => {
                setPrecioEditado(true);
                setPrecioTexto(e.target.value.replace(/[^\d]/g, ""));
                limpiar("precioNoche");
              }}
              className={`${entrada} ${errores.precioNoche ? "border-red-400" : "border-linea"}`}
            />
          </Campo>

          <div className="flex items-baseline justify-between border-t border-linea pt-4">
            <span className="text-niebla">Total</span>
            <span className="font-display text-2xl font-semibold">{noches > 0 && precioEfectivo > 0 ? formatearPrecio(total) : "—"}</span>
          </div>

          {!edicion && (
            <fieldset>
              <legend className="text-sm font-medium">¿Cómo queda la reserva?</legend>
              <div className="mt-2 grid grid-cols-2 gap-2">
                {(
                  [
                    ["confirmada", "Confirmada", "Ya está acordada"],
                    ["pendiente", "Por confirmar", "Falta confirmarla"],
                  ] as const
                ).map(([valor, titulo, detalle]) => (
                  <label
                    key={valor}
                    className={`cursor-pointer rounded-2xl border p-3 text-sm transition-colors ${estado === valor ? "border-rio bg-rio/5" : "border-linea hover:border-rio"}`}
                  >
                    <input type="radio" name="estado" className="sr-only" checked={estado === valor} onChange={() => setEstado(valor)} />
                    <span className="block font-semibold">{titulo}</span>
                    <span className="block text-xs text-niebla">{detalle}</span>
                  </label>
                ))}
              </div>
            </fieldset>
          )}

          <div className="flex flex-col gap-2 pt-1">
            <Boton type="submit" cargando={guardando} disabled={cargando}>
              {edicion ? "Guardar cambios" : "Crear reserva"}
            </Boton>
            <Link href={edicion ? `/panel/reservas/${reserva!.id}` : "/panel/reservas"} className={clasesBoton("secundario")}>
              Cancelar
            </Link>
          </div>
        </Seccion>
      </aside>
    </form>
  );
}

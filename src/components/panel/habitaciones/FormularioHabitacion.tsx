"use client";
import { useCallback, useEffect, useState, type Dispatch, type ReactNode, type SetStateAction } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { LIMITES, TIPOS, esquemaHabitacion, type TipoHabitacion } from "@/lib/habitacion-reglas";
import { formatearPrecio, personas } from "@/lib/formato";
import { erroresPorCampo } from "@/lib/validacion";
import type { HabitacionAdmin } from "@/lib/habitaciones-admin";
import { VisualHabitacion } from "@/components/VisualHabitacion";
import { Boton, clasesBoton } from "@/components/panel/ui/Boton";
import { useAvisos, useConfirmar } from "@/components/panel/ui/Proveedor";
import { SelectorComodidades } from "@/components/panel/habitaciones/SelectorComodidades";
import { SubidaFotos } from "@/components/panel/habitaciones/SubidaFotos";

type Valores = {
  nombre: string;
  tipo: TipoHabitacion | "";
  descripcion: string;
  capacidad: number;
  camas: string;
  precioNoche: number | null;
  comodidades: string[];
  imagenes: string[];
  activa: boolean;
};

const VACIO: Valores = {
  nombre: "",
  tipo: "",
  descripcion: "",
  capacidad: 2,
  camas: "",
  precioNoche: null,
  comodidades: [],
  imagenes: [],
  activa: true,
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

/** La tarjeta tal como la verá el huésped en la web. */
function VistaPrevia({ v }: { v: Valores }) {
  const nombre = v.nombre.trim() || "Nombre de la habitación";
  const tipo: TipoHabitacion = v.tipo || "doble";
  return (
    <div className="overflow-hidden rounded-3xl border border-linea bg-white shadow-[0_18px_40px_-24px_rgba(13,58,49,0.5)]">
      <div className="relative aspect-[4/3]">
        <VisualHabitacion nombre={nombre} tipo={tipo} capacidad={v.capacidad} imagen={v.imagenes[0]} />
      </div>
      <div className="p-5">
        <h3 className="font-display text-lg font-semibold">{nombre}</h3>
        <p className="mt-1 text-sm text-niebla">
          Hasta {personas(v.capacidad)}
          {v.camas.trim() && `, ${v.camas.trim()}`}
        </p>
        {v.comodidades.length > 0 && (
          <p className="mt-3 line-clamp-2 text-sm text-niebla">{v.comodidades.slice(0, 4).join(" · ")}</p>
        )}
        <p className="mt-4 font-display text-xl font-semibold">
          {v.precioNoche ? formatearPrecio(v.precioNoche) : "$ 0"}
          <span className="text-sm font-normal text-niebla"> por noche</span>
        </p>
        {!v.activa && <p className="mt-3 rounded-xl bg-papel px-3 py-2 text-xs text-niebla">Oculta: no aparece en la web.</p>}
      </div>
    </div>
  );
}

export function FormularioHabitacion({ inicial, subidaDisponible }: { inicial?: HabitacionAdmin; subidaDisponible: boolean }) {
  const router = useRouter();
  const avisos = useAvisos();
  const confirmar = useConfirmar();
  const edicion = Boolean(inicial);

  const [valores, setValores] = useState<Valores>(() =>
    inicial
      ? {
          nombre: inicial.nombre,
          tipo: inicial.tipo,
          descripcion: inicial.descripcion,
          capacidad: inicial.capacidad,
          camas: inicial.camas,
          precioNoche: inicial.precioNoche,
          comodidades: inicial.comodidades,
          imagenes: inicial.imagenes,
          activa: inicial.activa,
        }
      : VACIO
  );
  const [errores, setErrores] = useState<Record<string, string>>({});
  const [guardando, setGuardando] = useState(false);
  const [eliminando, setEliminando] = useState(false);
  const [subiendo, setSubiendo] = useState(0);
  const [modificado, setModificado] = useState(false);

  // Avisa antes de cerrar la pestaña si hay cambios sin guardar
  useEffect(() => {
    if (!modificado) return;
    const avisar = (e: BeforeUnloadEvent) => e.preventDefault();
    window.addEventListener("beforeunload", avisar);
    return () => window.removeEventListener("beforeunload", avisar);
  }, [modificado]);

  function cambiar<K extends keyof Valores>(campo: K, valor: Valores[K]) {
    setValores((v) => ({ ...v, [campo]: valor }));
    setModificado(true);
    setErrores((e) => {
      if (!(campo in e)) return e;
      const { [campo]: _quitado, ...resto } = e;
      void _quitado;
      return resto;
    });
  }

  const setImagenes: Dispatch<SetStateAction<string[]>> = useCallback((actualizar) => {
    setValores((v) => ({ ...v, imagenes: typeof actualizar === "function" ? actualizar(v.imagenes) : actualizar }));
    setModificado(true);
    setErrores((e) => {
      if (!("imagenes" in e)) return e;
      const { imagenes: _quitado, ...resto } = e;
      void _quitado;
      return resto;
    });
  }, []);

  function irAlPrimerError(lista: Record<string, string>) {
    const orden = ["nombre", "tipo", "descripcion", "capacidad", "camas", "precioNoche", "comodidades", "imagenes"];
    const primero = orden.find((c) => c in lista);
    if (primero) document.getElementById(`campo-${primero}`)?.scrollIntoView({ behavior: "smooth", block: "center" });
  }

  async function guardar(evento: React.FormEvent) {
    evento.preventDefault();
    const revision = esquemaHabitacion.safeParse(valores);
    if (!revision.success) {
      const lista = erroresPorCampo(revision.error);
      setErrores(lista);
      avisos.error("Revisa los campos marcados", "Hay datos que faltan o no son válidos.");
      irAlPrimerError(lista);
      return;
    }

    setGuardando(true);
    try {
      const r = await fetch(edicion ? `/api/panel/habitaciones/${inicial!.id}` : "/api/panel/habitaciones", {
        method: edicion ? "PATCH" : "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(revision.data),
      });
      if (r.status === 401) {
        router.replace("/ingresar");
        return;
      }
      const cuerpo = await r.json().catch(() => ({}));
      if (!r.ok) {
        if (cuerpo.errores) {
          setErrores(cuerpo.errores);
          irAlPrimerError(cuerpo.errores);
        }
        avisos.error(cuerpo.mensaje ?? "No se pudo guardar la habitación", "Intenta de nuevo.");
        return;
      }
      setModificado(false);
      avisos.exito(edicion ? "Cambios guardados" : "Habitación creada", `${revision.data.nombre} ya está al día en la web.`);
      router.push("/panel/habitaciones");
      router.refresh();
    } catch {
      avisos.error("No hay conexión con el servidor", "Revisa tu internet e intenta de nuevo.");
    } finally {
      setGuardando(false);
    }
  }

  async function eliminar() {
    if (!inicial) return;
    const seguro = await confirmar({
      titulo: `¿Eliminar ${inicial.nombre}?`,
      mensaje: "Se borra por completo y no se puede recuperar. Si solo quieres que deje de aparecer en la web, mejor ocúltala.",
      textoConfirmar: "Sí, eliminar",
      textoCancelar: "No, conservarla",
      peligro: true,
    });
    if (!seguro) return;

    setEliminando(true);
    try {
      const r = await fetch(`/api/panel/habitaciones/${inicial.id}`, { method: "DELETE" });
      if (r.status === 401) {
        router.replace("/ingresar");
        return;
      }
      const cuerpo = await r.json().catch(() => ({}));
      if (!r.ok) {
        avisos.error(cuerpo.mensaje ?? "No se pudo eliminar la habitación");
        return;
      }
      setModificado(false);
      avisos.exito("Habitación eliminada");
      router.push("/panel/habitaciones");
      router.refresh();
    } catch {
      avisos.error("No hay conexión con el servidor", "Revisa tu internet e intenta de nuevo.");
    } finally {
      setEliminando(false);
    }
  }

  const borde = (campo: string) => (errores[campo] ? "border-red-400" : "border-linea");
  const ocupado = guardando || eliminando;

  return (
    <form onSubmit={guardar} noValidate className="grid gap-8 lg:grid-cols-[1fr_21rem]">
      <div className="space-y-6">
        <Seccion titulo="Información" ayuda="Lo primero que lee el huésped. Escribe como si se la contaras en persona.">
          <Campo id="nombre" etiqueta="Nombre" error={errores.nombre}>
            <input
              id="nombre"
              value={valores.nombre}
              onChange={(e) => cambiar("nombre", e.target.value)}
              maxLength={LIMITES.nombre.max}
              placeholder="Ej.: Suite con vista al mar"
              className={`${entrada} ${borde("nombre")}`}
            />
          </Campo>

          <Campo id="tipo" etiqueta="Tipo de habitación" error={errores.tipo} ayuda="Define el dibujo que se muestra mientras no haya fotos.">
            <div id="tipo" role="radiogroup" aria-label="Tipo de habitación" className="mt-2 grid grid-cols-2 gap-2 sm:grid-cols-4">
              {TIPOS.map((t) => {
                const elegido = valores.tipo === t.valor;
                return (
                  <button
                    key={t.valor}
                    type="button"
                    role="radio"
                    aria-checked={elegido}
                    onClick={() => cambiar("tipo", t.valor)}
                    className={`rounded-xl border px-3 py-2.5 text-sm font-semibold transition-all duration-200 active:scale-95 ${
                      elegido ? "border-rio bg-rio text-white" : `${errores.tipo ? "border-red-400" : "border-linea"} bg-white hover:border-rio hover:text-rio`
                    }`}
                  >
                    {t.texto}
                  </button>
                );
              })}
            </div>
          </Campo>

          <Campo id="descripcion" etiqueta="Descripción" error={errores.descripcion}>
            <textarea
              id="descripcion"
              value={valores.descripcion}
              onChange={(e) => cambiar("descripcion", e.target.value)}
              maxLength={LIMITES.descripcion.max}
              rows={5}
              placeholder="Qué la hace especial: la vista, la luz, el silencio, a quién le queda mejor…"
              className={`${entrada} resize-y ${borde("descripcion")}`}
            />
            <p className="mt-1 text-right text-xs text-niebla tabular-nums">
              {valores.descripcion.length} / {LIMITES.descripcion.max}
            </p>
          </Campo>
        </Seccion>

        <Seccion titulo="Capacidad y precio">
          <div className="grid gap-5 sm:grid-cols-2">
            <Campo id="capacidad" etiqueta="¿Cuántas personas caben?" error={errores.capacidad}>
              <div className="mt-1.5 flex items-center gap-3">
                <button
                  type="button"
                  aria-label="Una persona menos"
                  onClick={() => cambiar("capacidad", Math.max(LIMITES.capacidad.min, valores.capacidad - 1))}
                  disabled={valores.capacidad <= LIMITES.capacidad.min}
                  className="grid h-12 w-12 place-items-center rounded-xl border border-linea bg-white text-xl transition-all hover:border-rio hover:text-rio active:scale-95 disabled:opacity-40"
                >
                  −
                </button>
                <output id="capacidad" className="min-w-24 text-center font-display text-lg font-semibold tabular-nums">
                  {personas(valores.capacidad)}
                </output>
                <button
                  type="button"
                  aria-label="Una persona más"
                  onClick={() => cambiar("capacidad", Math.min(LIMITES.capacidad.max, valores.capacidad + 1))}
                  disabled={valores.capacidad >= LIMITES.capacidad.max}
                  className="grid h-12 w-12 place-items-center rounded-xl border border-linea bg-white text-xl transition-all hover:border-rio hover:text-rio active:scale-95 disabled:opacity-40"
                >
                  +
                </button>
              </div>
            </Campo>

            <Campo id="camas" etiqueta="Camas" error={errores.camas}>
              <input
                id="camas"
                value={valores.camas}
                onChange={(e) => cambiar("camas", e.target.value)}
                maxLength={LIMITES.camas.max}
                placeholder="Ej.: 1 cama doble"
                className={`${entrada} ${borde("camas")}`}
              />
            </Campo>
          </div>

          <Campo
            id="precioNoche"
            etiqueta="Precio por noche (COP)"
            error={errores.precioNoche}
            ayuda="El cambio aplica a las reservas nuevas. Las que ya existen conservan el precio con el que se hicieron."
          >
            <div className="relative">
              <span aria-hidden className="pointer-events-none absolute left-4 top-1/2 mt-[0.1rem] -translate-y-1/2 text-niebla">
                $
              </span>
              <input
                id="precioNoche"
                inputMode="numeric"
                autoComplete="off"
                value={valores.precioNoche === null ? "" : valores.precioNoche.toLocaleString("es-CO")}
                onChange={(e) => {
                  const digitos = e.target.value.replace(/\D/g, "").slice(0, 8);
                  cambiar("precioNoche", digitos ? Number(digitos) : null);
                }}
                placeholder="150.000"
                className={`${entrada} pl-8 tabular-nums ${borde("precioNoche")}`}
              />
            </div>
          </Campo>
        </Seccion>

        <Seccion titulo="Comodidades" ayuda="Toca las que incluye. Si falta alguna, escríbela.">
          <div id="campo-comodidades">
            <SelectorComodidades valor={valores.comodidades} onChange={(c) => cambiar("comodidades", c)} />
            {errores.comodidades && (
              <p role="alert" className="mt-2 text-sm text-red-700">
                {errores.comodidades}
              </p>
            )}
          </div>
        </Seccion>

        <Seccion titulo="Fotos" ayuda="Las buenas fotos venden la habitación. Usa luz natural y muestra la cama, el baño y la vista.">
          <div id="campo-imagenes">
            <SubidaFotos
              fotos={valores.imagenes}
              setFotos={setImagenes}
              disponible={subidaDisponible}
              error={errores.imagenes}
              alCambiarSubidas={setSubiendo}
            />
          </div>
        </Seccion>

        <Seccion titulo="Visibilidad">
          <div className="flex items-center justify-between gap-4">
            <div>
              <p className="font-medium">{valores.activa ? "Visible en la web" : "Oculta en la web"}</p>
              <p className="text-sm text-niebla">
                {valores.activa ? "Los huéspedes pueden verla y reservarla." : "Nadie puede verla ni reservarla. Las reservas que ya existen siguen en pie."}
              </p>
            </div>
            <button
              type="button"
              role="switch"
              aria-checked={valores.activa}
              aria-label="Visible en la web"
              onClick={() => cambiar("activa", !valores.activa)}
              className={`relative h-8 w-14 shrink-0 rounded-full transition-colors duration-200 ${valores.activa ? "bg-rio" : "bg-linea"}`}
            >
              <span
                className={`absolute left-1 top-1 h-6 w-6 rounded-full bg-white shadow transition-transform duration-200 ${valores.activa ? "translate-x-6" : ""}`}
              />
            </button>
          </div>
        </Seccion>

        {/* Vista previa en el celular: plegable para no alargar el formulario */}
        <details className="group rounded-3xl border border-linea bg-white p-5 lg:hidden">
          <summary className="cursor-pointer list-none font-display font-semibold">
            Ver cómo se verá en la web <span className="text-niebla transition-transform group-open:rotate-180 inline-block">⌄</span>
          </summary>
          <div className="mt-4">
            <VistaPrevia v={valores} />
          </div>
        </details>

        <div className="sticky bottom-20 z-10 flex flex-wrap items-center gap-3 rounded-2xl border border-linea bg-white/95 p-3 shadow-[0_18px_40px_-18px_rgba(13,58,49,0.45)] backdrop-blur lg:bottom-4">
          <Boton type="submit" cargando={guardando} disabled={ocupado || subiendo > 0}>
            {subiendo > 0 ? "Subiendo fotos…" : edicion ? "Guardar cambios" : "Crear habitación"}
          </Boton>
          <Link href="/panel/habitaciones" className={clasesBoton("secundario")}>
            {modificado ? "Descartar" : "Volver"}
          </Link>
          {edicion && (
            <Boton variante="secundario" onClick={eliminar} cargando={eliminando} disabled={ocupado} className="ml-auto hover:!border-red-400 hover:!text-red-700">
              Eliminar
            </Boton>
          )}
        </div>
      </div>

      <aside className="hidden lg:block">
        <div className="sticky top-8">
          <p className="mb-3 font-display font-semibold">Así se verá en la web</p>
          <VistaPrevia v={valores} />
          <p className="mt-3 text-xs text-niebla">Se actualiza mientras escribes. Aún no se guarda nada.</p>
        </div>
      </aside>
    </form>
  );
}


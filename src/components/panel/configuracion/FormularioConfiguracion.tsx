"use client";
import { useEffect, useState, type ReactNode } from "react";
import { useRouter } from "next/navigation";
import { LIMITES_CONFIGURACION, horaLegible, iniciales, type DatosConfiguracion } from "@/lib/configuracion-reglas";
import { Boton } from "@/components/panel/ui/Boton";
import { useAvisos } from "@/components/panel/ui/Proveedor";

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

function Campo({ id, etiqueta, error, ayuda, contador, children }: { id: string; etiqueta: string; error?: string; ayuda?: string; contador?: string; children: ReactNode }) {
  return (
    <div id={`campo-${id}`}>
      <div className="flex items-baseline justify-between gap-3">
        <label htmlFor={id} className="text-sm font-medium">{etiqueta}</label>
        {contador && <span className="text-xs text-niebla">{contador}</span>}
      </div>
      {children}
      {error ? <p role="alert" className="mt-1.5 text-sm text-red-700">{error}</p> : ayuda && <p className="mt-1.5 text-xs text-niebla">{ayuda}</p>}
    </div>
  );
}

export function FormularioConfiguracion({ inicial }: { inicial: DatosConfiguracion }) {
  const router = useRouter();
  const avisos = useAvisos();
  const [v, setV] = useState<DatosConfiguracion>(inicial);
  const [errores, setErrores] = useState<Record<string, string>>({});
  const [guardando, setGuardando] = useState(false);
  const [modificado, setModificado] = useState(false);

  useEffect(() => {
    if (!modificado) return;
    const avisar = (e: BeforeUnloadEvent) => e.preventDefault();
    window.addEventListener("beforeunload", avisar);
    return () => window.removeEventListener("beforeunload", avisar);
  }, [modificado]);

  function cambiar<K extends keyof DatosConfiguracion>(campo: K, valor: DatosConfiguracion[K]) {
    setV((x) => ({ ...x, [campo]: valor }));
    setModificado(true);
    setErrores((e) => {
      if (!(campo in e)) return e;
      const { [campo]: _q, ...resto } = e;
      void _q;
      return resto;
    });
  }

  const borde = (campo: string) => (errores[campo] ? "border-red-400" : "border-linea");

  async function guardar(e: React.FormEvent) {
    e.preventDefault();
    if (guardando) return;
    setGuardando(true);
    setErrores({});
    try {
      const r = await fetch("/api/panel/configuracion", { method: "PUT", headers: { "Content-Type": "application/json" }, body: JSON.stringify(v) });
      if (r.status === 401) {
        router.push("/ingresar");
        return;
      }
      const datos = await r.json().catch(() => ({}));
      if (!r.ok) {
        if (datos.errores) {
          setErrores(datos.errores);
          document.getElementById(`campo-${Object.keys(datos.errores)[0]}`)?.scrollIntoView({ behavior: "smooth", block: "center" });
        }
        avisos.error(datos.mensaje ?? "No se pudo guardar");
        return;
      }
      setModificado(false);
      avisos.exito("Configuración guardada", "Ya se ve en la web y en los mensajes de WhatsApp.");
      router.refresh();
    } catch {
      avisos.error("No se pudo guardar", "Revisa tu conexión e inténtalo otra vez.");
    } finally {
      setGuardando(false);
    }
  }

  return (
    <form onSubmit={guardar} noValidate className="grid gap-6 lg:grid-cols-[1.4fr_1fr]">
      <div className="space-y-6">
        <Seccion titulo="El hotel" ayuda="Aparece en el encabezado, el pie de la web y los mensajes a tus huéspedes.">
          <Campo id="nombre" etiqueta="Nombre del hotel" error={errores.nombre} contador={`${v.nombre.length}/${LIMITES_CONFIGURACION.nombre}`}>
            <input id="nombre" value={v.nombre} maxLength={LIMITES_CONFIGURACION.nombre} onChange={(e) => cambiar("nombre", e.target.value)} className={`${entrada} ${borde("nombre")}`} />
          </Campo>
          <Campo id="nombreCorto" etiqueta="Nombre corto" error={errores.nombreCorto} ayuda="Para el encabezado y el menú, donde no cabe el nombre completo." contador={`${v.nombreCorto.length}/${LIMITES_CONFIGURACION.nombreCorto}`}>
            <input id="nombreCorto" value={v.nombreCorto} maxLength={LIMITES_CONFIGURACION.nombreCorto} onChange={(e) => cambiar("nombreCorto", e.target.value)} className={`${entrada} ${borde("nombreCorto")}`} />
          </Campo>
          <Campo id="ciudad" etiqueta="Ciudad y departamento" error={errores.ciudad} ayuda="Ejemplo: Tolú, Sucre">
            <input id="ciudad" value={v.ciudad} maxLength={LIMITES_CONFIGURACION.ciudad} onChange={(e) => cambiar("ciudad", e.target.value)} className={`${entrada} ${borde("ciudad")}`} />
          </Campo>
        </Seccion>

        <Seccion titulo="Contacto y horarios">
          <Campo id="whatsapp" etiqueta="WhatsApp del hotel" error={errores.whatsapp} ayuda="Celular de 10 dígitos. Si lo dejas vacío, no aparece el botón de WhatsApp en la web.">
            <input id="whatsapp" type="tel" inputMode="tel" value={v.whatsapp} onChange={(e) => cambiar("whatsapp", e.target.value)} placeholder="300 123 4567" className={`${entrada} ${borde("whatsapp")}`} />
          </Campo>
          <div className="grid gap-5 sm:grid-cols-2">
            <Campo id="checkIn" etiqueta="Hora de check-in" error={errores.checkIn} ayuda={`Los huéspedes pueden llegar desde las ${horaLegible(v.checkIn)}.`}>
              <input id="checkIn" type="time" value={v.checkIn} onChange={(e) => cambiar("checkIn", e.target.value)} className={`${entrada} ${borde("checkIn")}`} />
            </Campo>
            <Campo id="checkOut" etiqueta="Hora de check-out" error={errores.checkOut} ayuda={`Deben salir hasta las ${horaLegible(v.checkOut)}.`}>
              <input id="checkOut" type="time" value={v.checkOut} onChange={(e) => cambiar("checkOut", e.target.value)} className={`${entrada} ${borde("checkOut")}`} />
            </Campo>
          </div>
        </Seccion>

        <Seccion titulo="Textos de la página principal">
          <Campo id="tituloPrincipal" etiqueta="Título principal" error={errores.tituloPrincipal} contador={`${v.tituloPrincipal.length}/${LIMITES_CONFIGURACION.titulo}`}>
            <input id="tituloPrincipal" value={v.tituloPrincipal} maxLength={LIMITES_CONFIGURACION.titulo} onChange={(e) => cambiar("tituloPrincipal", e.target.value)} className={`${entrada} ${borde("tituloPrincipal")}`} />
          </Campo>
          <Campo id="descripcionPrincipal" etiqueta="Descripción" error={errores.descripcionPrincipal} contador={`${v.descripcionPrincipal.length}/${LIMITES_CONFIGURACION.descripcion}`}>
            <textarea id="descripcionPrincipal" rows={3} value={v.descripcionPrincipal} maxLength={LIMITES_CONFIGURACION.descripcion} onChange={(e) => cambiar("descripcionPrincipal", e.target.value)} className={`${entrada} resize-y ${borde("descripcionPrincipal")}`} />
          </Campo>
          <Campo id="notaPie" etiqueta="Nota al pie (opcional)" error={errores.notaPie} ayuda="Una línea al final de la web, por ejemplo la dirección o el registro de turismo." contador={`${v.notaPie.length}/${LIMITES_CONFIGURACION.notaPie}`}>
            <input id="notaPie" value={v.notaPie} maxLength={LIMITES_CONFIGURACION.notaPie} onChange={(e) => cambiar("notaPie", e.target.value)} className={`${entrada} ${borde("notaPie")}`} />
          </Campo>
        </Seccion>
      </div>

      <aside className="space-y-6 lg:sticky lg:top-6 lg:self-start">
        <section className="overflow-hidden rounded-3xl border border-linea bg-white">
          <p className="px-6 pt-5 text-xs font-semibold uppercase tracking-wide text-niebla">Así se verá</p>
          <div className="relative mt-3 overflow-hidden bg-rio-oscuro px-6 pb-8 pt-5 text-white">
            <div aria-hidden className="absolute -right-10 top-4 h-40 w-40 rounded-full bg-sol/15 blur-2xl" />
            <div className="relative flex items-center gap-2.5 font-display font-semibold">
              <span className="grid h-8 w-8 place-items-center rounded-lg bg-sol text-xs text-rio-oscuro">{iniciales(v.nombreCorto || v.nombre)}</span>
              {v.nombreCorto || "Nombre corto"}
            </div>
            <p className="relative mt-6 text-xs font-medium text-sol">{v.ciudad || "Ciudad"}</p>
            <p className="relative mt-1.5 font-display text-2xl font-semibold leading-tight">{v.tituloPrincipal || "Título principal"}</p>
            <p className="relative mt-3 text-sm text-white/75">{v.descripcionPrincipal || "Descripción"}</p>
          </div>
          <div className="px-6 py-4 text-xs text-niebla">
            <p><span className="font-semibold text-tinta">{v.nombre || "Nombre del hotel"}</span>, {v.ciudad}</p>
            {v.notaPie && <p className="mt-0.5">{v.notaPie}</p>}
          </div>
        </section>

        <div className="flex flex-col gap-2">
          <Boton type="submit" cargando={guardando} disabled={!modificado}>
            Guardar cambios
          </Boton>
          {!modificado && <p className="text-center text-xs text-niebla">Haz un cambio para poder guardar.</p>}
        </div>
      </aside>
    </form>
  );
}

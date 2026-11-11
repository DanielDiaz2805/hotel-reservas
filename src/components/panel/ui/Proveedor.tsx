"use client";
import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState, type ReactNode } from "react";
import { IconoAlerta, IconoCerrar, IconoCheck, IconoInfo } from "@/components/panel/Iconos";
import { Boton } from "@/components/panel/ui/Boton";

/**
 * Avisos y confirmaciones del panel.
 *
 *   const avisos = useAvisos();
 *   avisos.exito("Reserva confirmada", "Ahora puedes avisarle por WhatsApp");
 *   avisos.error("No se pudo guardar");
 *
 *   const confirmar = useConfirmar();
 *   if (await confirmar({ titulo: "¿Cancelar?", peligro: true })) { ... }
 */

// ---------------------------------------------------------------------------
// Avisos (toasts)
// ---------------------------------------------------------------------------

type TipoAviso = "exito" | "error" | "info";
type Aviso = { id: number; tipo: TipoAviso; titulo: string; descripcion?: string; saliendo: boolean };

type ApiAvisos = {
  exito: (titulo: string, descripcion?: string) => void;
  error: (titulo: string, descripcion?: string) => void;
  info: (titulo: string, descripcion?: string) => void;
};

const estilosAviso: Record<TipoAviso, { icono: ReactNode; color: string }> = {
  exito: { icono: <IconoCheck />, color: "bg-rio/10 text-rio" },
  error: { icono: <IconoAlerta />, color: "bg-red-100 text-red-700" },
  info: { icono: <IconoInfo />, color: "bg-sky-100 text-sky-700" },
};

// ---------------------------------------------------------------------------
// Confirmaciones
// ---------------------------------------------------------------------------

export type OpcionesConfirmar = {
  titulo: string;
  mensaje?: string;
  textoConfirmar?: string;
  textoCancelar?: string;
  /** Pinta el botón de confirmar en rojo: para acciones que no se pueden deshacer */
  peligro?: boolean;
};

type FuncionConfirmar = (opciones: OpcionesConfirmar) => Promise<boolean>;

const ContextoAvisos = createContext<ApiAvisos | null>(null);
const ContextoConfirmar = createContext<FuncionConfirmar | null>(null);

export function useAvisos(): ApiAvisos {
  const contexto = useContext(ContextoAvisos);
  if (!contexto) throw new Error("useAvisos debe usarse dentro de <ProveedorPanel>");
  return contexto;
}

export function useConfirmar(): FuncionConfirmar {
  const contexto = useContext(ContextoConfirmar);
  if (!contexto) throw new Error("useConfirmar debe usarse dentro de <ProveedorPanel>");
  return contexto;
}

const DURACION_AVISO = 4500;
const DURACION_AVISO_ERROR = 7000;
const DURACION_SALIDA = 200;

export function ProveedorPanel({ children }: { children: ReactNode }) {
  // ---- avisos ----
  const [avisos, setAvisos] = useState<Aviso[]>([]);
  const siguienteId = useRef(1);
  const temporizadores = useRef(new Map<number, ReturnType<typeof setTimeout>>());

  const cerrarAviso = useCallback((id: number) => {
    const pendiente = temporizadores.current.get(id);
    if (pendiente) clearTimeout(pendiente);
    temporizadores.current.delete(id);
    // Primero se anima la salida y después se quita de la lista
    setAvisos((lista) => lista.map((a) => (a.id === id ? { ...a, saliendo: true } : a)));
    setTimeout(() => setAvisos((lista) => lista.filter((a) => a.id !== id)), DURACION_SALIDA);
  }, []);

  const mostrar = useCallback(
    (tipo: TipoAviso, titulo: string, descripcion?: string) => {
      const id = siguienteId.current++;
      // Máximo 3 a la vez: los más antiguos se descartan
      setAvisos((lista) => [...lista.slice(-2), { id, tipo, titulo, descripcion, saliendo: false }]);
      temporizadores.current.set(
        id,
        setTimeout(() => cerrarAviso(id), tipo === "error" ? DURACION_AVISO_ERROR : DURACION_AVISO)
      );
    },
    [cerrarAviso]
  );

  useEffect(() => {
    const mapa = temporizadores.current;
    return () => mapa.forEach((t) => clearTimeout(t));
  }, []);

  const apiAvisos = useMemo<ApiAvisos>(
    () => ({
      exito: (t, d) => mostrar("exito", t, d),
      error: (t, d) => mostrar("error", t, d),
      info: (t, d) => mostrar("info", t, d),
    }),
    [mostrar]
  );

  // ---- confirmaciones ----
  const [dialogo, setDialogo] = useState<OpcionesConfirmar | null>(null);
  const resolver = useRef<((valor: boolean) => void) | null>(null);
  const refDialogo = useRef<HTMLDialogElement>(null);

  const confirmar = useCallback<FuncionConfirmar>((opciones) => {
    return new Promise<boolean>((resolve) => {
      resolver.current?.(false); // si había otra abierta, se descarta
      resolver.current = resolve;
      setDialogo(opciones);
    });
  }, []);

  // <dialog> con showModal() ya trae lo difícil: foco atrapado, tecla Esc y bloqueo del fondo
  useEffect(() => {
    const elemento = refDialogo.current;
    if (dialogo && elemento && !elemento.open) elemento.showModal();
  }, [dialogo]);

  function responder(valor: boolean) {
    resolver.current?.(valor);
    resolver.current = null;
    setDialogo(null);
  }

  return (
    <ContextoAvisos.Provider value={apiAvisos}>
      <ContextoConfirmar.Provider value={confirmar}>
        {children}

        {/* Avisos: abajo en el celular (sobre la barra de navegación) y a la derecha en el computador */}
        <div
          aria-live="polite"
          className="pointer-events-none fixed inset-x-0 bottom-24 z-50 flex flex-col items-center gap-2.5 px-4 lg:bottom-6 lg:items-end lg:px-6"
        >
          {avisos.map((a) => {
            const estilo = estilosAviso[a.tipo];
            return (
              <div
                key={a.id}
                role={a.tipo === "error" ? "alert" : "status"}
                className={`pointer-events-auto flex w-full max-w-sm items-start gap-3 rounded-2xl border border-linea bg-white p-4 shadow-[0_18px_40px_-18px_rgba(13,58,49,0.45)] ${
                  a.saliendo ? "animate-aviso-salida" : "animate-aviso"
                }`}
              >
                <span className={`grid h-9 w-9 shrink-0 place-items-center rounded-xl ${estilo.color}`}>{estilo.icono}</span>
                <div className="min-w-0 flex-1 pt-0.5">
                  <p className="text-sm font-semibold">{a.titulo}</p>
                  {a.descripcion && <p className="mt-0.5 text-sm text-niebla">{a.descripcion}</p>}
                </div>
                <button
                  onClick={() => cerrarAviso(a.id)}
                  aria-label="Cerrar aviso"
                  className="-mr-1 -mt-1 grid h-8 w-8 shrink-0 place-items-center rounded-full text-niebla transition-colors hover:bg-papel hover:text-tinta"
                >
                  <IconoCerrar className="h-4 w-4" />
                </button>
              </div>
            );
          })}
        </div>

        {dialogo && (
          <dialog
            ref={refDialogo}
            aria-labelledby="titulo-confirmacion"
            onCancel={(e) => {
              e.preventDefault();
              responder(false);
            }}
            // Con el <dialog> sin relleno propio, un clic en el fondo oscuro tiene al <dialog> como destino
            onClick={(e) => e.target === e.currentTarget && responder(false)}
            className="m-auto w-[calc(100%-2rem)] max-w-md rounded-3xl border-0 bg-white p-0 text-tinta shadow-2xl animate-dialogo backdrop:animate-aparecer backdrop:bg-rio-oscuro/50 backdrop:backdrop-blur-sm"
          >
            <div className="p-6 sm:p-7">
              <span
                className={`grid h-11 w-11 place-items-center rounded-2xl ${dialogo.peligro ? "bg-red-100 text-red-700" : "bg-rio/10 text-rio"}`}
              >
                {dialogo.peligro ? <IconoAlerta /> : <IconoInfo />}
              </span>
              <h2 id="titulo-confirmacion" className="mt-4 font-display text-xl font-semibold">
                {dialogo.titulo}
              </h2>
              {dialogo.mensaje && <p className="mt-2 text-niebla">{dialogo.mensaje}</p>}
              {/* "Cancelar" va primero: recibe el foco al abrir, para que un Enter apurado no ejecute la acción */}
              <div className="mt-6 flex flex-col-reverse gap-2.5 sm:flex-row sm:justify-end">
                <Boton variante="secundario" onClick={() => responder(false)}>
                  {dialogo.textoCancelar ?? "Cancelar"}
                </Boton>
                <Boton variante={dialogo.peligro ? "peligro" : "primario"} onClick={() => responder(true)}>
                  {dialogo.textoConfirmar ?? "Confirmar"}
                </Boton>
              </div>
            </div>
          </dialog>
        )}
      </ContextoConfirmar.Provider>
    </ContextoAvisos.Provider>
  );
}

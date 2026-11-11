"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { fechaLegible } from "@/lib/fechas";
import type { BloqueoAdmin } from "@/lib/calendario";
import { Boton } from "@/components/panel/ui/Boton";
import { useAvisos, useConfirmar } from "@/components/panel/ui/Proveedor";

export function ListaBloqueos({ bloqueos }: { bloqueos: BloqueoAdmin[] }) {
  const router = useRouter();
  const avisos = useAvisos();
  const confirmar = useConfirmar();
  const [quitando, setQuitando] = useState<string | null>(null);

  async function quitar(b: BloqueoAdmin) {
    const si = await confirmar({
      titulo: "¿Liberar estas fechas?",
      mensaje: `${b.habitacion} volverá a poder reservarse del ${fechaLegible(b.desde)} al ${fechaLegible(b.ultimoDia)}.`,
      textoConfirmar: "Sí, liberar",
    });
    if (!si) return;
    setQuitando(b.id);
    try {
      const r = await fetch(`/api/panel/bloqueos/${b.id}`, { method: "DELETE" });
      if (r.status === 401) {
        router.push("/ingresar");
        return;
      }
      if (!r.ok) {
        const datos = await r.json().catch(() => ({}));
        avisos.error(datos.mensaje ?? "No se pudo liberar");
        return;
      }
      avisos.exito("Fechas liberadas");
      router.refresh();
    } catch {
      avisos.error("No se pudo liberar", "Revisa tu conexión e inténtalo otra vez.");
    } finally {
      setQuitando(null);
    }
  }

  return (
    <ul className="divide-y divide-linea">
      {bloqueos.map((b) => (
        <li key={b.id} className="flex flex-wrap items-center justify-between gap-3 py-4 first:pt-0 last:pb-0">
          <div>
            <p className="font-medium">
              {b.habitacion}
              {b.motivo && <span className="font-normal text-niebla"> · {b.motivo}</span>}
            </p>
            <p className="text-sm text-niebla">
              {b.desde === b.ultimoDia
                ? `El ${fechaLegible(b.desde)}`
                : `Del ${fechaLegible(b.desde)} al ${fechaLegible(b.ultimoDia)}`}{" "}
              · {b.noches} {b.noches === 1 ? "noche" : "noches"}
            </p>
          </div>
          <Boton variante="secundario" tamano="sm" cargando={quitando === b.id} onClick={() => quitar(b)}>
            Liberar
          </Boton>
        </li>
      ))}
    </ul>
  );
}

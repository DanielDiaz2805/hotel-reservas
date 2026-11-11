"use client";
import { useCallback, useEffect, useRef, useState, type Dispatch, type SetStateAction } from "react";
import Image from "next/image";
import { LIMITES } from "@/lib/habitacion-reglas";
import { IconoCerrar } from "@/components/panel/Iconos";
import { useAvisos } from "@/components/panel/ui/Proveedor";

type Firma = {
  cloudName: string;
  apiKey: string;
  timestamp: number;
  signature: string;
  folder: string;
  allowedFormats: string;
};

type Subida = { id: number; vista: string; progreso: number; error?: string };

const TIPOS_ACEPTADOS = ["image/jpeg", "image/png", "image/webp"];
const LADO_MAXIMO = 2000;
const PESO_MAXIMO_ORIGINAL = 9 * 1024 * 1024;

/** Reduce la foto a 2000 px y la convierte a JPEG: una foto de celular de 6 MB queda en unos 400 KB. */
async function prepararFoto(archivo: File): Promise<Blob> {
  try {
    const imagen = await createImageBitmap(archivo);
    const escala = Math.min(1, LADO_MAXIMO / Math.max(imagen.width, imagen.height));
    const ancho = Math.round(imagen.width * escala);
    const alto = Math.round(imagen.height * escala);
    const lienzo = document.createElement("canvas");
    lienzo.width = ancho;
    lienzo.height = alto;
    const contexto = lienzo.getContext("2d");
    if (!contexto) throw new Error("sin lienzo");
    contexto.fillStyle = "#fff";
    contexto.fillRect(0, 0, ancho, alto);
    contexto.drawImage(imagen, 0, 0, ancho, alto);
    imagen.close();
    const blob = await new Promise<Blob | null>((resolver) => lienzo.toBlob(resolver, "image/jpeg", 0.85));
    if (!blob) throw new Error("sin imagen");
    return blob;
  } catch {
    // Si el navegador no pudo leerla, se sube tal cual solo cuando es un formato permitido y no pesa demasiado
    if (TIPOS_ACEPTADOS.includes(archivo.type) && archivo.size <= PESO_MAXIMO_ORIGINAL) return archivo;
    throw new Error("Formato no compatible. Usa fotos JPG, PNG o WebP.");
  }
}

/** XMLHttpRequest en lugar de fetch porque es el que informa el avance de la subida. */
function subirACloudinary(foto: Blob, firma: Firma, alAvanzar: (porcentaje: number) => void): Promise<string> {
  return new Promise((resolver, rechazar) => {
    const datos = new FormData();
    datos.append("file", foto, "foto.jpg");
    datos.append("api_key", firma.apiKey);
    datos.append("timestamp", String(firma.timestamp));
    datos.append("signature", firma.signature);
    datos.append("folder", firma.folder);
    datos.append("allowed_formats", firma.allowedFormats);

    const peticion = new XMLHttpRequest();
    peticion.open("POST", `https://api.cloudinary.com/v1_1/${firma.cloudName}/image/upload`);
    peticion.upload.onprogress = (e) => {
      if (e.lengthComputable) alAvanzar(Math.round((e.loaded / e.total) * 100));
    };
    peticion.onload = () => {
      try {
        const respuesta = JSON.parse(peticion.responseText);
        if (peticion.status >= 200 && peticion.status < 300 && respuesta.secure_url) resolver(respuesta.secure_url);
        else rechazar(new Error(respuesta?.error?.message ?? "No se pudo subir la foto"));
      } catch {
        rechazar(new Error("No se pudo subir la foto"));
      }
    };
    peticion.onerror = () => rechazar(new Error("No hay conexión. Revisa tu internet."));
    peticion.send(datos);
  });
}

let contador = 0;

export function SubidaFotos({
  fotos,
  setFotos,
  disponible,
  error,
  alCambiarSubidas,
}: {
  fotos: string[];
  setFotos: Dispatch<SetStateAction<string[]>>;
  /** false cuando faltan las claves de Cloudinary en el servidor */
  disponible: boolean;
  error?: string;
  /** Avisa cuántas fotos se están subiendo, para bloquear el botón de guardar mientras tanto */
  alCambiarSubidas?: (enCurso: number) => void;
}) {
  const avisos = useAvisos();
  const [subidas, setSubidas] = useState<Subida[]>([]);
  const [arrastrando, setArrastrando] = useState(false);
  const entrada = useRef<HTMLInputElement>(null);
  const enCurso = subidas.filter((s) => !s.error).length;

  useEffect(() => {
    alCambiarSubidas?.(enCurso);
  }, [enCurso, alCambiarSubidas]);

  const actualizar = useCallback((id: number, cambio: Partial<Subida>) => {
    setSubidas((lista) => lista.map((s) => (s.id === id ? { ...s, ...cambio } : s)));
  }, []);

  const quitarSubida = useCallback((id: number) => {
    setSubidas((lista) => {
      const objetivo = lista.find((s) => s.id === id);
      if (objetivo) URL.revokeObjectURL(objetivo.vista);
      return lista.filter((s) => s.id !== id);
    });
  }, []);

  async function agregar(archivos: File[]) {
    if (!disponible || archivos.length === 0) return;
    const libres = LIMITES.fotos - fotos.length - enCurso;
    if (libres <= 0) {
      avisos.info(`Ya tienes ${LIMITES.fotos} fotos`, "Quita alguna para poder agregar otra.");
      return;
    }
    const elegidas = archivos.filter((a) => a.type.startsWith("image/")).slice(0, libres);
    if (elegidas.length < archivos.length) {
      avisos.info("Algunos archivos no se agregaron", `Solo se aceptan imágenes y caben ${LIMITES.fotos} fotos por habitación.`);
    }
    if (elegidas.length === 0) return;

    let firma: Firma;
    try {
      const r = await fetch("/api/panel/subida", { method: "POST" });
      if (!r.ok) throw new Error();
      firma = await r.json();
    } catch {
      avisos.error("No se pudo preparar la subida", "Revisa tu conexión e intenta de nuevo.");
      return;
    }

    await Promise.all(
      elegidas.map(async (archivo) => {
        const id = ++contador;
        setSubidas((lista) => [...lista, { id, vista: URL.createObjectURL(archivo), progreso: 0 }]);
        try {
          const preparada = await prepararFoto(archivo);
          const url = await subirACloudinary(preparada, firma, (progreso) => actualizar(id, { progreso }));
          setFotos((lista) => (lista.length < LIMITES.fotos ? [...lista, url] : lista));
          quitarSubida(id);
        } catch (e) {
          actualizar(id, { error: e instanceof Error ? e.message : "No se pudo subir la foto" });
        }
      })
    );
  }

  function mover(indice: number, destino: number) {
    setFotos((lista) => {
      const copia = [...lista];
      const [foto] = copia.splice(indice, 1);
      copia.splice(destino, 0, foto);
      return copia;
    });
  }

  const quitar = (indice: number) => setFotos((lista) => lista.filter((_, i) => i !== indice));

  if (!disponible) {
    return (
      <div className="rounded-2xl border border-dashed border-sol bg-sol/10 p-5 text-sm">
        <p className="font-semibold">La subida de fotos todavía no está activada</p>
        <p className="mt-1 text-niebla">
          Falta conectar Cloudinary: agrega <code className="rounded bg-white px-1.5 py-0.5">CLOUDINARY_CLOUD_NAME</code>,{" "}
          <code className="rounded bg-white px-1.5 py-0.5">CLOUDINARY_API_KEY</code> y{" "}
          <code className="rounded bg-white px-1.5 py-0.5">CLOUDINARY_API_SECRET</code> en las variables de entorno y reinicia la app.
          Mientras tanto puedes guardar la habitación sin fotos.
        </p>
      </div>
    );
  }

  return (
    <div>
      <label
        onDragOver={(e) => {
          e.preventDefault();
          setArrastrando(true);
        }}
        onDragLeave={() => setArrastrando(false)}
        onDrop={(e) => {
          e.preventDefault();
          setArrastrando(false);
          agregar(Array.from(e.dataTransfer.files));
        }}
        className={`flex cursor-pointer flex-col items-center gap-1 rounded-2xl border-2 border-dashed px-6 py-8 text-center transition-all duration-200 ${
          arrastrando ? "scale-[1.01] border-rio bg-rio/5" : "border-linea bg-papel/60 hover:border-rio/60"
        }`}
      >
        <span className="grid h-11 w-11 place-items-center rounded-2xl bg-rio/10 text-rio">
          <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
            <path d="M12 16V4M7 9l5-5 5 5M4 16v2a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-2" />
          </svg>
        </span>
        <span className="mt-1 font-semibold">{arrastrando ? "Suéltalas aquí" : "Arrastra tus fotos o toca para elegirlas"}</span>
        <span className="text-sm text-niebla">JPG, PNG o WebP. Hasta {LIMITES.fotos} fotos; la primera es la principal.</span>
        <input
          ref={entrada}
          type="file"
          accept={TIPOS_ACEPTADOS.join(",")}
          multiple
          className="sr-only"
          onChange={(e) => {
            agregar(Array.from(e.target.files ?? []));
            e.target.value = "";
          }}
        />
      </label>

      {error && (
        <p role="alert" className="mt-2 text-sm text-red-700">
          {error}
        </p>
      )}

      {(fotos.length > 0 || subidas.length > 0) && (
        <ul className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-3">
          {fotos.map((url, i) => (
            <li key={url} className="group relative aspect-[4/3] overflow-hidden rounded-2xl border border-linea bg-papel animate-escala">
              <Image src={url} alt={`Foto ${i + 1} de la habitación`} fill sizes="(min-width: 640px) 200px, 45vw" className="object-cover" />
              {i === 0 && (
                <span className="absolute left-2 top-2 rounded-full bg-sol px-2.5 py-0.5 text-xs font-semibold text-rio-oscuro">Principal</span>
              )}
              <button
                type="button"
                onClick={() => quitar(i)}
                aria-label={`Quitar la foto ${i + 1}`}
                className="absolute right-2 top-2 grid h-8 w-8 place-items-center rounded-full bg-white/90 text-tinta shadow transition-colors hover:bg-red-600 hover:text-white"
              >
                <IconoCerrar className="h-4 w-4" />
              </button>
              <div className="absolute inset-x-0 bottom-0 flex items-center justify-between gap-1 bg-gradient-to-t from-black/60 to-transparent p-2 pt-6 text-white">
                <div className="flex gap-1">
                  <button
                    type="button"
                    onClick={() => mover(i, i - 1)}
                    disabled={i === 0}
                    aria-label="Mover hacia el inicio"
                    className="grid h-7 w-7 place-items-center rounded-full bg-white/20 transition-colors hover:bg-white/40 disabled:opacity-30"
                  >
                    ←
                  </button>
                  <button
                    type="button"
                    onClick={() => mover(i, i + 1)}
                    disabled={i === fotos.length - 1}
                    aria-label="Mover hacia el final"
                    className="grid h-7 w-7 place-items-center rounded-full bg-white/20 transition-colors hover:bg-white/40 disabled:opacity-30"
                  >
                    →
                  </button>
                </div>
                {i > 0 && (
                  <button
                    type="button"
                    onClick={() => mover(i, 0)}
                    className="rounded-full bg-white/20 px-2.5 py-1 text-xs font-semibold transition-colors hover:bg-white/40"
                  >
                    Hacer principal
                  </button>
                )}
              </div>
            </li>
          ))}

          {subidas.map((s) => (
            <li key={s.id} className="relative aspect-[4/3] overflow-hidden rounded-2xl border border-linea bg-papel">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={s.vista} alt="" className={`h-full w-full object-cover ${s.error ? "opacity-30" : "opacity-60"}`} />
              {s.error ? (
                <div className="absolute inset-0 flex flex-col items-center justify-center gap-2 p-3 text-center">
                  <p role="alert" className="text-xs font-medium text-red-700">
                    {s.error}
                  </p>
                  <button
                    type="button"
                    onClick={() => quitarSubida(s.id)}
                    className="rounded-full bg-white px-3 py-1 text-xs font-semibold shadow transition-colors hover:bg-red-600 hover:text-white"
                  >
                    Quitar
                  </button>
                </div>
              ) : (
                <div className="absolute inset-x-3 bottom-3" role="progressbar" aria-valuenow={s.progreso} aria-valuemin={0} aria-valuemax={100} aria-label="Subiendo foto">
                  <div className="h-1.5 overflow-hidden rounded-full bg-white/80">
                    <div className="h-full rounded-full bg-rio transition-[width] duration-200" style={{ width: `${Math.max(s.progreso, 6)}%` }} />
                  </div>
                  <p className="mt-1 text-center text-xs font-semibold text-tinta">{s.progreso < 100 ? "Subiendo…" : "Procesando…"}</p>
                </div>
              )}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

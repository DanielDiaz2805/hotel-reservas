"use client";
import { useRef, useState } from "react";
import { useRouter } from "next/navigation";

type Demo = { email: string; password: string } | null;

export function FormularioIngreso({ siguiente, demo }: { siguiente: string; demo: Demo }) {
  const router = useRouter();
  const formulario = useRef<HTMLFormElement>(null);

  // Llena el formulario con el usuario de demostración y lo envía
  function usarDemo() {
    const f = formulario.current;
    if (!f || !demo) return;
    (f.elements.namedItem("email") as HTMLInputElement).value = demo.email;
    (f.elements.namedItem("password") as HTMLInputElement).value = demo.password;
    f.requestSubmit();
  }
  const [error, setError] = useState("");
  const [enviando, setEnviando] = useState(false);

  async function ingresar(evento: React.FormEvent<HTMLFormElement>) {
    evento.preventDefault();
    setError("");
    setEnviando(true);
    const datos = new FormData(evento.currentTarget);
    try {
      const r = await fetch("/api/auth/ingresar", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: datos.get("email"), password: datos.get("password") }),
      });
      if (r.ok) {
        router.replace(siguiente);
        router.refresh();
        return;
      }
      const cuerpo = await r.json().catch(() => ({}));
      setError(cuerpo.mensaje ?? "No se pudo iniciar sesión");
    } catch {
      setError("No hay conexión con el servidor");
    }
    setEnviando(false);
  }

  const campo =
    "mt-1.5 w-full rounded-xl border border-linea bg-white px-4 py-3 transition-shadow focus:border-rio focus:shadow-[0_0_0_4px_rgba(30,107,90,0.12)] focus:outline-none";
  return (
    <form ref={formulario} onSubmit={ingresar} className="mt-8 space-y-4">
      <label className="block text-sm font-medium">
        Correo
        <input name="email" type="email" autoComplete="username" required className={campo} />
      </label>
      <label className="block text-sm font-medium">
        Contraseña
        <input name="password" type="password" autoComplete="current-password" required className={campo} />
      </label>
      {error && (
        <p role="alert" className="rounded-xl bg-red-50 p-3 text-sm text-red-800 animate-subir">
          {error}
        </p>
      )}
      <button
        type="submit"
        disabled={enviando}
        className="w-full rounded-full bg-rio px-6 py-3.5 font-semibold text-white shadow-[0_10px_30px_-12px_rgba(30,107,90,0.8)] transition-all hover:-translate-y-0.5 hover:bg-rio-oscuro active:translate-y-0 disabled:opacity-60"
      >
        {enviando ? "Ingresando…" : "Ingresar"}
      </button>

      {demo && (
        <div className="rounded-2xl border border-dashed border-rio/40 bg-rio/5 p-4 text-sm animate-subir [animation-delay:0.4s]">
          <p className="font-medium text-rio-oscuro">¿Vienes a conocer el proyecto?</p>
          <p className="mt-1 text-niebla">Entra con el usuario de demostración y explora el panel.</p>
          <button
            type="button"
            onClick={usarDemo}
            disabled={enviando}
            className="mt-3 w-full rounded-full border border-rio bg-white px-4 py-2.5 font-semibold text-rio transition-all hover:-translate-y-0.5 hover:bg-rio hover:text-white"
          >
            Entrar como demostración
          </button>
        </div>
      )}
    </form>
  );
}

"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";

export function FormularioIngreso({ siguiente }: { siguiente: string }) {
  const router = useRouter();
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

  const campo = "mt-1 w-full rounded-xl border border-linea bg-white px-3 py-2.5 focus:border-rio focus:outline-none";
  return (
    <form onSubmit={ingresar} className="mt-8 space-y-4">
      <label className="block text-sm font-medium">
        Correo
        <input name="email" type="email" autoComplete="username" required className={campo} />
      </label>
      <label className="block text-sm font-medium">
        Contraseña
        <input name="password" type="password" autoComplete="current-password" required className={campo} />
      </label>
      {error && (
        <p role="alert" className="rounded-xl bg-red-50 p-3 text-sm text-red-800">
          {error}
        </p>
      )}
      <button
        type="submit"
        disabled={enviando}
        className="w-full rounded-full bg-rio px-6 py-3 font-semibold text-white hover:bg-rio-oscuro disabled:opacity-60"
      >
        {enviando ? "Ingresando…" : "Ingresar"}
      </button>
    </form>
  );
}

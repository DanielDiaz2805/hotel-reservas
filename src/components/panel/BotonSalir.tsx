"use client";
import { useRouter } from "next/navigation";

export function BotonSalir() {
  const router = useRouter();
  async function salir() {
    await fetch("/api/auth/salir", { method: "POST" });
    router.replace("/ingresar");
    router.refresh();
  }
  return (
    <button onClick={salir} className="rounded-full border border-white/30 px-4 py-1.5 text-sm hover:bg-white/10">
      Salir
    </button>
  );
}

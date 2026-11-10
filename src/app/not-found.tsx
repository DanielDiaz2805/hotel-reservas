import Link from "next/link";

export default function NoEncontrada() {
  return (
    <main>
      <div className="bg-rio-oscuro pb-10 pt-24" />
      <div className="mx-auto max-w-6xl px-5 py-24 sm:px-8">
        <h1 className="font-display text-4xl font-semibold">Esta página no existe</h1>
        <p className="mt-3 text-niebla">Puede que la habitación ya no esté disponible en la web.</p>
        <Link href="/" className="mt-8 inline-flex rounded-full bg-rio px-6 py-3 font-semibold text-white hover:bg-rio-oscuro">
          Volver al inicio
        </Link>
      </div>
    </main>
  );
}

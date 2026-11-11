"use client";
import { createContext, useContext, type ReactNode } from "react";
import type { DatosHotel } from "@/lib/configuracion-reglas";

const Contexto = createContext<DatosHotel | null>(null);

/** Entrega el nombre y los horarios del hotel a los componentes del panel que arman mensajes de WhatsApp. */
export function ProveedorHotel({ hotel, children }: { hotel: DatosHotel; children: ReactNode }) {
  return <Contexto.Provider value={hotel}>{children}</Contexto.Provider>;
}

export function useHotel(): DatosHotel {
  const hotel = useContext(Contexto);
  if (!hotel) throw new Error("useHotel debe usarse dentro de <ProveedorHotel>");
  return hotel;
}

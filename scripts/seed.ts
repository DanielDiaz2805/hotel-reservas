/**
 * Carga las habitaciones de ejemplo del Hotel Brisas del Sinú.
 * Uso: npm run seed
 *
 * Es seguro ejecutarlo varias veces: actualiza cada habitación por su slug
 * en lugar de duplicarla.
 */
import { config } from "dotenv";
config({ path: ".env.local" });

import mongoose from "mongoose";
import { conectarDB } from "../src/lib/db";
import { Habitacion } from "../src/models/Habitacion";

const habitaciones = [
  {
    nombre: "Sencilla Estándar",
    slug: "sencilla-estandar",
    tipo: "sencilla",
    descripcion:
      "Habitación práctica y fresca para viajeros de trabajo o de paso. Escritorio, buena luz y descanso sin complicaciones.",
    capacidad: 1,
    camas: "1 cama sencilla",
    precioNoche: 90000,
    comodidades: ["Aire acondicionado", "Wi-Fi", "TV", "Baño privado", "Escritorio"],
  },
  {
    nombre: "Doble Vista al Jardín",
    slug: "doble-vista-jardin",
    tipo: "doble",
    descripcion:
      "Amplia y luminosa, con ventana hacia el jardín interior. Ideal para parejas que buscan tranquilidad.",
    capacidad: 2,
    camas: "1 cama doble",
    precioNoche: 140000,
    comodidades: ["Aire acondicionado", "Wi-Fi", "TV", "Baño privado", "Minibar", "Vista al jardín"],
  },
  {
    nombre: "Doble Twin",
    slug: "doble-twin",
    tipo: "doble",
    descripcion:
      "Dos camas independientes, perfecta para compañeros de viaje o colegas que comparten habitación.",
    capacidad: 2,
    camas: "2 camas sencillas",
    precioNoche: 150000,
    comodidades: ["Aire acondicionado", "Wi-Fi", "TV", "Baño privado", "Escritorio"],
  },
  {
    nombre: "Familiar",
    slug: "familiar",
    tipo: "familiar",
    descripcion:
      "Espacio para toda la familia, con una cama doble y dos sencillas. Cerca de la zona común y la piscina.",
    capacidad: 4,
    camas: "1 cama doble y 2 sencillas",
    precioNoche: 230000,
    comodidades: ["Aire acondicionado", "Wi-Fi", "TV", "Baño privado", "Nevera", "Acceso a piscina"],
  },
  {
    nombre: "Suite Sinú",
    slug: "suite-sinu",
    tipo: "suite",
    descripcion:
      "La habitación más amplia del hotel, con sala de estar, balcón privado y cama king. Para ocasiones especiales.",
    capacidad: 3,
    camas: "1 cama king y 1 sofá cama",
    precioNoche: 320000,
    comodidades: ["Aire acondicionado", "Wi-Fi", "Smart TV", "Baño con tina", "Minibar", "Balcón privado", "Sala de estar"],
  },
];

async function main() {
  await conectarDB();
  console.log(`Conectado a la base de datos "${mongoose.connection.name}"`);

  for (const h of habitaciones) {
    await Habitacion.updateOne({ slug: h.slug }, { $set: h }, { upsert: true, runValidators: true });
    console.log(`  ✔ ${h.nombre}`);
  }

  const total = await Habitacion.countDocuments();
  console.log(`Listo: ${total} habitaciones en la base de datos.`);
}

main()
  .catch((error) => {
    console.error("Error al cargar las habitaciones:", error);
    process.exitCode = 1;
  })
  .finally(() => mongoose.disconnect());
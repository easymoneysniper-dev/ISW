const { z } = require("zod");

const estadosEquipo = ["DISPONIBLE", "DANADO", "EN_REPARACION", "PERDIDO", "DADO_DE_BAJA"];
const opcional = (max) => z.string().trim().max(max).nullish().transform((valor) => valor || null);

// Se reciben pesos chilenos enteros, igual que los importes existentes del proyecto.
const precioCompra = z.union([z.string(), z.number()])
  .transform((valor) => String(valor).trim())
  .refine((valor) => /^\d{1,14}$/.test(valor) && BigInt(valor) > 0n,
    "El precio de compra debe ser mayor que cero, en pesos enteros (máximo 14 dígitos)");

const fechaCompra = z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Ingresa una fecha de compra válida")
  .refine((valor) => {
    const fecha = new Date(`${valor}T00:00:00.000Z`);
    return valor.slice(0, 4) !== "0000" && !Number.isNaN(fecha.getTime()) && fecha.toISOString().slice(0, 10) === valor;
  }, "La fecha de compra no existe");

const guardarEquipoSchema = z.object({
  nombre: z.string().trim().min(1, "El nombre es obligatorio").max(150),
  marca: opcional(100),
  modelo: opcional(100),
  // Una serie vacía se guarda como NULL; PostgreSQL permite varias sin serie.
  numeroSerie: opcional(150).transform((valor) => valor?.toUpperCase() ?? null).pipe(z.string().max(150).nullable()),
  precioCompra,
  fechaCompra,
  estado: z.enum(estadosEquipo).default("DISPONIBLE"),
  kitId: z.number().int().positive().max(2147483647).nullable().default(null),
  nuevoKitNombre: z.string().trim().min(1, "Indica el nombre del nuevo kit").max(150).nullish(),
}).strict().refine((datos) => !(datos.kitId && datos.nuevoKitNombre), {
  message: "Selecciona un kit existente o escribe uno nuevo, no ambos",
  path: ["kitId"],
});

const idEquipoSchema = z.object({ id: z.coerce.number().int().positive().max(2147483647) });
const mesComprasSchema = z.object({
  mes: z.string().regex(/^(?!0000)\d{4}-(0[1-9]|1[0-2])$/, "Indica el mes como AAAA-MM"),
}).strict();

module.exports = { guardarEquipoSchema, idEquipoSchema, mesComprasSchema };

/**
 * Validación de variables de entorno con Zod.
 *
 * - Variables SIN prefijo NEXT_PUBLIC_ son eliminadas del bundle del cliente
 *   por Next.js en build time → las API keys NUNCA llegan al browser.
 * - Este archivo solo debe importarse desde server components o route handlers.
 * - Si falta alguna variable requerida, la app falla en startup con un mensaje claro.
 */
import { z } from "zod";

// ─── Variables de servidor (secretas, solo disponibles en el servidor) ────────
const serverEnvSchema = z.object({
  ANTHROPIC_API_KEY: z.string().min(1, "ANTHROPIC_API_KEY es requerida"),
  NODE_ENV: z
    .enum(["development", "production", "test"])
    .default("development"),
  // Upstash — opcionales en desarrollo local, recomendadas en producción
  UPSTASH_REDIS_REST_URL: z.string().url().optional(),
  UPSTASH_REDIS_REST_TOKEN: z.string().optional(),
});

// ─── Variables públicas (visibles en el browser, prefijo NEXT_PUBLIC_) ────────
const publicEnvSchema = z.object({
  NEXT_PUBLIC_APP_NAME: z.string().default("Programacion RM — Radiologia"),
  NEXT_PUBLIC_APP_URL: z
    .string()
    .url()
    .default("http://localhost:3000"),
});

// Valida bajo demanda para evitar romper el build si falta una variable
// que solo se necesita en tiempo de ejecución de una ruta concreta.
export function getServerEnv() {
  return serverEnvSchema.parse({
    ANTHROPIC_API_KEY: process.env.ANTHROPIC_API_KEY,
    NODE_ENV: process.env.NODE_ENV,
    UPSTASH_REDIS_REST_URL: process.env.UPSTASH_REDIS_REST_URL,
    UPSTASH_REDIS_REST_TOKEN: process.env.UPSTASH_REDIS_REST_TOKEN,
  });
}

export const publicEnv = publicEnvSchema.parse({
  NEXT_PUBLIC_APP_NAME: process.env.NEXT_PUBLIC_APP_NAME,
  NEXT_PUBLIC_APP_URL: process.env.NEXT_PUBLIC_APP_URL,
});

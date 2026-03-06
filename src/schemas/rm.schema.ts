import { z } from "zod";

export const AnalyzeRequestSchema = z.object({
  text: z
    .string()
    .trim()
    .min(2, "La valoracion debe tener al menos 2 caracteres")
    .max(2000, "Maximo 2000 caracteres")
    .transform((val) => val.replace(/[<>"'`]/g, "")),
  anestesia: z
    .string()
    .trim()
    .regex(/^\d{1,3}\+?$/, "La edad de anestesia debe ser un numero (ej. 6, 12 o 12+)")
    .max(50)
    .optional()
    .transform((val) => val?.replace(/[<>"'`]/g, "")),
});

export type AnalyzeRequest = z.infer<typeof AnalyzeRequestSchema>;

export const ClaudeResultSchema = z.object({
  n: z.number().int().min(1).max(66),
  torn: z.enum(["MATI", "TARDA", "FLEXIBLE", "DIMARTS_TARDA", "DIVENDRES_MATI", "ANESTESIA"]),
  maquina_nota: z.string().optional().default(""),
  conf: z.enum(["ALTA", "MITJA", "BAIXA"]),
  why: z.string(),
});

export type ClaudeResult = z.infer<typeof ClaudeResultSchema>;

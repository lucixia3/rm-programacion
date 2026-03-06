import { z } from "zod";

export const AnalyzeRequestSchema = z.object({
  text: z
    .string()
    .trim()
    .min(3, "El texto es demasiado corto")
    .max(2000, "Máximo 2000 caracteres")
    .transform((val) => val.replace(/[<>"'`]/g, "")),
  anestesia: z
    .string()
    .trim()
    .max(50)
    .optional()
    .transform((val) => val?.replace(/[<>"'`]/g, "")),
});

export type AnalyzeRequest = z.infer<typeof AnalyzeRequestSchema>;

export const ClaudeResultSchema = z.object({
  n: z.number().int().min(1).max(79),
  torn: z.enum(["MATI", "TARDA", "FLEXIBLE", "DIMARTS_TARDA", "DIVENDRES_MATI", "ANESTESIA"]),
  maquina_nota: z.string().optional().default(""),
  conf: z.enum(["ALTA", "MITJA", "BAIXA"]),
  why: z.string(),
});

export type ClaudeResult = z.infer<typeof ClaudeResultSchema>;

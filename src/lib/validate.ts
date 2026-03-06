import { type ZodSchema, type ZodError } from "zod";
import { NextResponse } from "next/server";

type ValidationSuccess<T> = { success: true; data: T };
type ValidationFailure = { success: false; response: NextResponse };
export type ValidationResult<T> = ValidationSuccess<T> | ValidationFailure;

/**
 * Parsea y valida el body JSON de una request con el schema dado.
 * Retorna los datos tipados o un NextResponse listo para devolver al cliente.
 */
export async function validateBody<T>(
  request: Request,
  schema: ZodSchema<T>
): Promise<ValidationResult<T>> {
  let body: unknown;

  try {
    body = await request.json();
  } catch {
    return {
      success: false,
      response: NextResponse.json(
        { error: "Body JSON inválido" },
        { status: 400 }
      ),
    };
  }

  const result = schema.safeParse(body);

  if (!result.success) {
    return {
      success: false,
      response: NextResponse.json(
        {
          error: "Validación fallida",
          detalles: formatZodErrors(result.error),
        },
        { status: 422 }
      ),
    };
  }

  return { success: true, data: result.data };
}

/**
 * Parsea y valida los search params de la URL con el schema dado.
 */
export function validateSearchParams<T>(
  searchParams: URLSearchParams,
  schema: ZodSchema<T>
): ValidationResult<T> {
  const raw = Object.fromEntries(searchParams.entries());
  const result = schema.safeParse(raw);

  if (!result.success) {
    return {
      success: false,
      response: NextResponse.json(
        {
          error: "Parámetros de consulta inválidos",
          detalles: formatZodErrors(result.error),
        },
        { status: 400 }
      ),
    };
  }

  return { success: true, data: result.data };
}

function formatZodErrors(error: ZodError) {
  return error.errors.map((e) => ({
    campo: e.path.join("."),
    mensaje: e.message,
  }));
}

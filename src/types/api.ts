/**
 * Tipos globales para respuestas de la API interna.
 */

export interface ApiError {
  error: string;
  detalles?: { campo: string; mensaje: string }[];
}

export interface ApiSuccess<T> {
  data: T;
}

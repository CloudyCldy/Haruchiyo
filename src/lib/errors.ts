/**
 * Catálogo oficial de códigos de error de la API de Sanzu (SB-01-ST081).
 * Todas las respuestas de error usan el formato:
 *   { success: false, error: { code, message, details? } }
 * El código es estable y es lo que deben interpretar los clientes (Haitani).
 */
export const ERROR_CODES = {
  BAD_REQUEST: { status: 400, description: "El cuerpo de la petición no es JSON válido o está mal formado." },
  UNAUTHORIZED: { status: 401, description: "Falta el token JWT / X-Api-Key o es inválido o expiró." },
  INVALID_CREDENTIALS: { status: 401, description: "Correo o contraseña incorrectos en /auth/login." },
  FORBIDDEN: { status: 403, description: "El usuario está autenticado pero no tiene acceso al recurso o proyecto." },
  NOT_FOUND: { status: 404, description: "El recurso no existe (o no es visible para quien lo solicita)." },
  CONFLICT: { status: 409, description: "Conflicto de estado: duplicado o transición de estado no permitida." },
  VALIDATION_ERROR: { status: 422, description: "Los datos no cumplen el esquema Zod o las reglas de negocio." },
  AI_SERVICE_ERROR: { status: 502, description: "El proveedor de IA externo falló; el motor determinístico sigue disponible." },
  INTERNAL_ERROR: { status: 500, description: "Error inesperado del servidor." },
} as const;
export type ErrorCode = keyof typeof ERROR_CODES;

export class ValidationError extends Error { name = "ValidationError"; }
export class AuthenticationError extends Error { name = "AuthenticationError"; }
export class AuthorizationError extends Error { name = "AuthorizationError"; }
export class NotFoundError extends Error { name = "NotFoundError"; }
export class ConflictError extends Error { name = "ConflictError"; }
export class AIServiceError extends Error { name = "AIServiceError"; }

export function assertObjectId(value: string, field = "id") {
  if (!/^[a-f\d]{24}$/i.test(value)) {
    throw new ValidationError(`${field} must be a valid MongoDB ObjectId (24 hexadecimal characters)`);
  }
}
export class ValidationError extends Error { name = "ValidationError"; }
export class AuthorizationError extends Error { name = "AuthorizationError"; }
export class NotFoundError extends Error { name = "NotFoundError"; }
export class ConflictError extends Error { name = "ConflictError"; }
export class AIServiceError extends Error { name = "AIServiceError"; }
export function assertObjectId(value: string, field = "id") {
	if (!/^[a-f\d]{24}$/i.test(value)) {
		const error = new Error(`${field} must be a valid MongoDB ObjectId (24 hexadecimal characters)`);
		error.name = "ValidationError";
		throw error;
	}
}

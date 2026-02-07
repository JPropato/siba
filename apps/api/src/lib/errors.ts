/**
 * ARCH-002: Centralized error classes for SIBA API
 *
 * Provides AppError base class and common error factories
 * for consistent error handling across all controllers.
 */

export type ErrorCode =
  | 'BAD_REQUEST'
  | 'VALIDATION_ERROR'
  | 'UNAUTHORIZED'
  | 'FORBIDDEN'
  | 'NOT_FOUND'
  | 'CONFLICT'
  | 'GONE'
  | 'UNPROCESSABLE_ENTITY'
  | 'RATE_LIMIT_EXCEEDED'
  | 'INTERNAL_ERROR'
  | 'SERVICE_UNAVAILABLE'
  | 'PRISMA_ERROR'
  | 'DUPLICATE_ENTRY';

export interface ErrorDetail {
  field?: string;
  message: string;
  code?: string;
}

/**
 * Base application error class.
 *
 * - `statusCode`: HTTP status code to return
 * - `code`: Machine-readable error code for the frontend
 * - `isOperational`: true = expected/handled error, false = unexpected/programmer bug
 * - `details`: Optional array of field-level error details (e.g. validation)
 */
export class AppError extends Error {
  public readonly statusCode: number;
  public readonly code: ErrorCode;
  public readonly isOperational: boolean;
  public readonly details?: ErrorDetail[];

  constructor(
    message: string,
    statusCode: number,
    code: ErrorCode,
    options?: { isOperational?: boolean; details?: ErrorDetail[] }
  ) {
    super(message);
    this.statusCode = statusCode;
    this.code = code;
    this.isOperational = options?.isOperational ?? true;
    this.details = options?.details;

    // Preserve proper stack trace in V8 (Node.js)
    Error.captureStackTrace(this, this.constructor);
    Object.setPrototypeOf(this, AppError.prototype);
  }
}

// ---------------------------------------------------------------------------
// Common error factories
// ---------------------------------------------------------------------------

/**
 * 400 Bad Request - Generic bad input
 */
export class BadRequestError extends AppError {
  constructor(message = 'Solicitud inválida', details?: ErrorDetail[]) {
    super(message, 400, 'BAD_REQUEST', { details });
    Object.setPrototypeOf(this, BadRequestError.prototype);
  }
}

/**
 * 400 Validation Error - Schema / field-level validation failure
 */
export class ValidationError extends AppError {
  constructor(message = 'Error de validación', details?: ErrorDetail[]) {
    super(message, 400, 'VALIDATION_ERROR', { details });
    Object.setPrototypeOf(this, ValidationError.prototype);
  }
}

/**
 * 401 Unauthorized - Missing or invalid credentials
 */
export class UnauthorizedError extends AppError {
  constructor(message = 'No autenticado') {
    super(message, 401, 'UNAUTHORIZED');
    Object.setPrototypeOf(this, UnauthorizedError.prototype);
  }
}

/**
 * 403 Forbidden - Authenticated but insufficient permissions
 */
export class ForbiddenError extends AppError {
  constructor(message = 'Permisos insuficientes') {
    super(message, 403, 'FORBIDDEN');
    Object.setPrototypeOf(this, ForbiddenError.prototype);
  }
}

/**
 * 404 Not Found - Resource does not exist
 */
export class NotFoundError extends AppError {
  constructor(message = 'Recurso no encontrado') {
    super(message, 404, 'NOT_FOUND');
    Object.setPrototypeOf(this, NotFoundError.prototype);
  }
}

/**
 * 409 Conflict - Duplicate / unique constraint violation
 */
export class ConflictError extends AppError {
  constructor(message = 'El recurso ya existe', details?: ErrorDetail[]) {
    super(message, 409, 'CONFLICT', { details });
    Object.setPrototypeOf(this, ConflictError.prototype);
  }
}

/**
 * 422 Unprocessable Entity - Semantically invalid request
 */
export class UnprocessableEntityError extends AppError {
  constructor(message = 'Entidad no procesable', details?: ErrorDetail[]) {
    super(message, 422, 'UNPROCESSABLE_ENTITY', { details });
    Object.setPrototypeOf(this, UnprocessableEntityError.prototype);
  }
}

/**
 * 500 Internal Error - Unexpected / non-operational error
 */
export class InternalError extends AppError {
  constructor(message = 'Error interno del servidor') {
    super(message, 500, 'INTERNAL_ERROR', { isOperational: false });
    Object.setPrototypeOf(this, InternalError.prototype);
  }
}

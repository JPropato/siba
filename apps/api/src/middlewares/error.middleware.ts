/**
 * ARCH-002: Centralized error-handling middleware for SIBA API
 *
 * Classifies errors from:
 *   - Prisma (PrismaClientKnownRequestError, PrismaClientValidationError)
 *   - Zod (ZodError)
 *   - AppError (custom application errors)
 *   - Unknown / unexpected errors
 *
 * Returns a structured JSON response:
 *   { success: false, error: { code, message, details?, stack? } }
 */

import { Request, Response, NextFunction } from 'express';
import { Prisma } from '@prisma/client';
import { ZodError } from 'zod';
import { AppError, type ErrorCode, type ErrorDetail } from '../lib/errors.js';
import logger from '../utils/logger.js';

// ---------------------------------------------------------------------------
// Structured error response shape
// ---------------------------------------------------------------------------

interface ErrorResponseBody {
  success: false;
  error: {
    code: ErrorCode;
    message: string;
    details?: ErrorDetail[];
    stack?: string;
  };
}

// ---------------------------------------------------------------------------
// Helpers to classify third-party errors
// ---------------------------------------------------------------------------

const isDev = process.env.NODE_ENV !== 'production';

/**
 * Maps Prisma error codes to HTTP status + application error code + user message.
 */
function handlePrismaError(err: Prisma.PrismaClientKnownRequestError): {
  statusCode: number;
  code: ErrorCode;
  message: string;
  details?: ErrorDetail[];
} {
  switch (err.code) {
    // Unique constraint violation
    case 'P2002': {
      const target = (err.meta?.target as string[]) ?? [];
      const fields = target.length > 0 ? target.join(', ') : 'campo desconocido';
      return {
        statusCode: 409,
        code: 'DUPLICATE_ENTRY',
        message: `Ya existe un registro con el mismo valor en: ${fields}`,
        details: target.map((field) => ({
          field,
          message: `El valor de '${field}' ya está en uso`,
          code: 'P2002',
        })),
      };
    }

    // Foreign key constraint failure
    case 'P2003': {
      const fieldName = (err.meta?.field_name as string) ?? 'relación desconocida';
      return {
        statusCode: 400,
        code: 'BAD_REQUEST',
        message: `Violación de clave foránea en: ${fieldName}`,
        details: [{ field: fieldName, message: 'Referencia inválida', code: 'P2003' }],
      };
    }

    // Record not found (findUniqueOrThrow, update, delete on non-existing)
    case 'P2025': {
      const cause = (err.meta?.cause as string) ?? 'Registro no encontrado';
      return {
        statusCode: 404,
        code: 'NOT_FOUND',
        message: cause,
      };
    }

    // Required relation violation
    case 'P2014': {
      return {
        statusCode: 400,
        code: 'BAD_REQUEST',
        message: 'No se puede completar la operación: violación de relación requerida',
      };
    }

    // Value too long for column
    case 'P2000': {
      const column = (err.meta?.column_name as string) ?? 'columna desconocida';
      return {
        statusCode: 400,
        code: 'VALIDATION_ERROR',
        message: `El valor es demasiado largo para el campo: ${column}`,
        details: [{ field: column, message: 'Valor demasiado largo', code: 'P2000' }],
      };
    }

    // Records not found for connected query (e.g. connectOrCreate)
    case 'P2018': {
      return {
        statusCode: 404,
        code: 'NOT_FOUND',
        message: 'No se encontraron los registros relacionados requeridos',
      };
    }

    default: {
      return {
        statusCode: 500,
        code: 'PRISMA_ERROR',
        message: `Error de base de datos (${err.code})`,
      };
    }
  }
}

/**
 * Converts a ZodError into our structured format.
 */
function handleZodError(err: ZodError): {
  statusCode: number;
  code: ErrorCode;
  message: string;
  details: ErrorDetail[];
} {
  const details: ErrorDetail[] = err.errors.map((issue) => ({
    field: issue.path.join('.'),
    message: issue.message,
    code: issue.code,
  }));

  return {
    statusCode: 400,
    code: 'VALIDATION_ERROR',
    message: 'Error de validación en los datos enviados',
    details,
  };
}

// ---------------------------------------------------------------------------
// Main error handler middleware
// ---------------------------------------------------------------------------

/**
 * Express error-handling middleware (4 params).
 *
 * Must be registered AFTER all routes.
 */
export function errorHandler(err: Error, _req: Request, res: Response, _next: NextFunction): void {
  // --------------------------------------------------
  // 1. Determine status, code, message, details
  // --------------------------------------------------
  let statusCode = 500;
  let code: ErrorCode = 'INTERNAL_ERROR';
  let message = 'Error interno del servidor';
  let details: ErrorDetail[] | undefined;
  let isOperational = false;

  if (err instanceof AppError) {
    // --- Custom AppError ---
    statusCode = err.statusCode;
    code = err.code;
    message = err.message;
    details = err.details;
    isOperational = err.isOperational;
  } else if (err instanceof Prisma.PrismaClientKnownRequestError) {
    // --- Prisma known request errors ---
    const mapped = handlePrismaError(err);
    statusCode = mapped.statusCode;
    code = mapped.code;
    message = mapped.message;
    details = mapped.details;
    isOperational = true;
  } else if (err instanceof Prisma.PrismaClientValidationError) {
    // --- Prisma validation (bad query shape) ---
    statusCode = 400;
    code = 'VALIDATION_ERROR';
    message = 'Error de validación en consulta a base de datos';
    isOperational = true;
  } else if (err instanceof ZodError) {
    // --- Zod validation errors ---
    const mapped = handleZodError(err);
    statusCode = mapped.statusCode;
    code = mapped.code;
    message = mapped.message;
    details = mapped.details;
    isOperational = true;
  } else if (err.name === 'SyntaxError' && 'body' in err) {
    // --- JSON parse errors from express.json() ---
    statusCode = 400;
    code = 'BAD_REQUEST';
    message = 'JSON inválido en el cuerpo de la solicitud';
    isOperational = true;
  }

  // --------------------------------------------------
  // 2. Log the error
  // --------------------------------------------------
  if (isOperational) {
    logger.warn(`[${statusCode}] ${code}: ${message}`);
  } else {
    // Non-operational errors are unexpected - log full details
    logger.error(`[${statusCode}] ${code}: ${message}`, err.stack ?? err);
  }

  // --------------------------------------------------
  // 3. Build the response body
  // --------------------------------------------------
  const body: ErrorResponseBody = {
    success: false,
    error: {
      code,
      message,
    },
  };

  if (details && details.length > 0) {
    body.error.details = details;
  }

  // In development, include stack trace for debugging
  if (isDev && err.stack) {
    body.error.stack = err.stack;
  }

  // --------------------------------------------------
  // 4. Send response
  // --------------------------------------------------
  res.status(statusCode).json(body);
}

// ---------------------------------------------------------------------------
// 404 catch-all middleware
// ---------------------------------------------------------------------------

/**
 * Catch-all middleware for unmatched API routes.
 * Must be registered AFTER all routes but BEFORE the error handler.
 */
export function notFoundHandler(req: Request, _res: Response, next: NextFunction): void {
  const err = new AppError(
    `Ruta no encontrada: ${req.method} ${req.originalUrl}`,
    404,
    'NOT_FOUND'
  );
  next(err);
}

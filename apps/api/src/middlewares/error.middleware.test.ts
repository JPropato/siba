import { describe, it, expect, vi, beforeEach } from 'vitest';
import type { Request, Response, NextFunction } from 'express';
import { errorHandler, notFoundHandler } from './error.middleware.js';
import {
  AppError,
  NotFoundError,
  ConflictError,
  ValidationError,
  BadRequestError,
} from '../lib/errors.js';

// Mock the logger to prevent console output during tests
vi.mock('../utils/logger.js', () => ({
  default: {
    debug: vi.fn(),
    info: vi.fn(),
    warn: vi.fn(),
    error: vi.fn(),
  },
}));

// ---------------------------------------------------------------------------
// Helpers to create mock Express req / res / next
// ---------------------------------------------------------------------------

function createMockReq(overrides: Partial<Request> = {}): Request {
  return {
    method: 'GET',
    originalUrl: '/api/test',
    ...overrides,
  } as unknown as Request;
}

function createMockRes(): Response & {
  _status: number;
  _json: unknown;
} {
  const res = {
    _status: 0,
    _json: null as unknown,
    status(code: number) {
      res._status = code;
      return res;
    },
    json(body: unknown) {
      res._json = body;
      return res;
    },
  };
  return res as unknown as Response & { _status: number; _json: unknown };
}

const mockNext: NextFunction = vi.fn();

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

describe('errorHandler', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  // --- AppError classification -------------------------------------------------

  it('handles AppError with correct status and code', () => {
    const err = new NotFoundError('Ticket no encontrado');
    const req = createMockReq();
    const res = createMockRes();

    errorHandler(err, req, res as unknown as Response, mockNext);

    expect(res._status).toBe(404);
    expect(res._json).toMatchObject({
      success: false,
      error: {
        code: 'NOT_FOUND',
        message: 'Ticket no encontrado',
      },
    });
  });

  it('handles ConflictError (409)', () => {
    const err = new ConflictError('El recurso ya existe');
    const req = createMockReq();
    const res = createMockRes();

    errorHandler(err, req, res as unknown as Response, mockNext);

    expect(res._status).toBe(409);
    expect(res._json).toMatchObject({
      success: false,
      error: {
        code: 'CONFLICT',
        message: 'El recurso ya existe',
      },
    });
  });

  it('handles ValidationError with details', () => {
    const err = new ValidationError('Error de validación', [
      { field: 'email', message: 'Email inválido', code: 'invalid_string' },
    ]);
    const req = createMockReq();
    const res = createMockRes();

    errorHandler(err, req, res as unknown as Response, mockNext);

    expect(res._status).toBe(400);
    const body = res._json as {
      success: boolean;
      error: { code: string; message: string; details?: Array<{ field: string }> };
    };
    expect(body.error.code).toBe('VALIDATION_ERROR');
    expect(body.error.details).toHaveLength(1);
    expect(body.error.details![0].field).toBe('email');
  });

  it('handles BadRequestError (400)', () => {
    const err = new BadRequestError('Datos inválidos');
    const req = createMockReq();
    const res = createMockRes();

    errorHandler(err, req, res as unknown as Response, mockNext);

    expect(res._status).toBe(400);
    expect(res._json).toMatchObject({
      success: false,
      error: {
        code: 'BAD_REQUEST',
        message: 'Datos inválidos',
      },
    });
  });

  // --- Unknown errors -----------------------------------------------------------

  it('handles unknown errors with 500 status', () => {
    const err = new Error('Something unexpected');
    const req = createMockReq();
    const res = createMockRes();

    errorHandler(err, req, res as unknown as Response, mockNext);

    expect(res._status).toBe(500);
    expect(res._json).toMatchObject({
      success: false,
      error: {
        code: 'INTERNAL_ERROR',
        message: 'Error interno del servidor',
      },
    });
  });

  // --- Response shape -----------------------------------------------------------

  it('always includes success: false in the response', () => {
    const err = new AppError('Test error', 422, 'UNPROCESSABLE_ENTITY');
    const req = createMockReq();
    const res = createMockRes();

    errorHandler(err, req, res as unknown as Response, mockNext);

    const body = res._json as { success: boolean };
    expect(body.success).toBe(false);
  });
});

// ---------------------------------------------------------------------------
// notFoundHandler
// ---------------------------------------------------------------------------

describe('notFoundHandler', () => {
  it('calls next with a NOT_FOUND AppError containing the route info', () => {
    const req = createMockReq({ method: 'POST', originalUrl: '/api/v1/nonexistent' });
    const res = createMockRes();
    const next = vi.fn();

    notFoundHandler(req, res as unknown as Response, next);

    expect(next).toHaveBeenCalledOnce();

    const passedError = next.mock.calls[0][0] as AppError;
    expect(passedError).toBeInstanceOf(AppError);
    expect(passedError.statusCode).toBe(404);
    expect(passedError.code).toBe('NOT_FOUND');
    expect(passedError.message).toContain('POST');
    expect(passedError.message).toContain('/api/v1/nonexistent');
  });
});

import { Request, Response, NextFunction } from 'express';
import { registrarEvento, getClientIp } from '../services/audit.service.js';

// Map API route prefixes to module names
const ROUTE_MODULE_MAP: Record<string, string> = {
  '/api/auth': 'auth',
  '/api/tickets': 'tickets',
  '/api/obras': 'obras',
  '/api/finanzas': 'finanzas',
  '/api/clients': 'clientes',
  '/api/sedes': 'sedes',
  '/api/zones': 'zonas',
  '/api/vehiculos': 'vehiculos',
  '/api/materials': 'materiales',
  '/api/empleados': 'empleados',
  '/api/users': 'usuarios',
  '/api/roles': 'roles',
  '/api/ordenes-trabajo': 'ordenes_trabajo',
};

// Map HTTP methods to action names
function getAccion(method: string, path: string): string | null {
  // Special cases first
  if (path.includes('/anular')) return 'ANULAR';
  if (path.includes('/confirmar')) return 'CONFIRMAR';
  if (path.includes('/generar-pdf')) return 'GENERAR_PDF';
  if (path.includes('/transferencias')) return 'TRANSFERENCIA';
  if (path.includes('/login')) return 'LOGIN';
  if (path.includes('/logout')) return 'LOGOUT';
  if (path.includes('/estado')) return 'CAMBIO_ESTADO';
  if (path.includes('/liberar')) return 'CAMBIO_ESTADO';
  if (path.includes('/reorder')) return 'ACTUALIZAR';

  switch (method) {
    case 'POST':
      return 'CREAR';
    case 'PUT':
    case 'PATCH':
      return 'ACTUALIZAR';
    case 'DELETE':
      return 'ELIMINAR';
    default:
      return null; // GET requests are not audited
  }
}

function getModulo(path: string): string | null {
  for (const [prefix, modulo] of Object.entries(ROUTE_MODULE_MAP)) {
    if (path.startsWith(prefix)) return modulo;
  }
  return null;
}

function extractEntityInfo(responseBody: unknown, path: string): { id?: number; tipo?: string } {
  const body = responseBody as Record<string, unknown>;
  if (!body || typeof body !== 'object') return {};

  // Direct entity with id
  if ('id' in body && typeof body.id === 'number') {
    return { id: body.id, tipo: guessEntityType(path) };
  }

  // Nested data (some endpoints return { data: entity })
  if ('data' in body && typeof body.data === 'object' && body.data !== null) {
    const data = body.data as Record<string, unknown>;
    if ('id' in data && typeof data.id === 'number') {
      return { id: data.id, tipo: guessEntityType(path) };
    }
  }

  // Transfer response: { egreso, ingreso, transferenciaRef }
  if ('transferenciaRef' in body) {
    return { tipo: 'Transferencia' };
  }

  return {};
}

function guessEntityType(path: string): string {
  if (path.includes('/tickets')) return 'Ticket';
  if (path.includes('/obras')) return 'Obra';
  if (path.includes('/finanzas/movimientos')) return 'Movimiento';
  if (path.includes('/finanzas/cuentas')) return 'CuentaFinanciera';
  if (path.includes('/finanzas/transferencias')) return 'Transferencia';
  if (path.includes('/clients')) return 'Cliente';
  if (path.includes('/sedes')) return 'Sucursal';
  if (path.includes('/zones')) return 'Zona';
  if (path.includes('/vehiculos')) return 'Vehiculo';
  if (path.includes('/materials')) return 'Material';
  if (path.includes('/seguros-ap')) return 'SeguroAP';
  if (path.includes('/empleados')) return 'Empleado';
  if (path.includes('/users')) return 'Usuario';
  if (path.includes('/roles')) return 'Rol';
  if (path.includes('/ordenes-trabajo')) return 'OrdenTrabajo';
  return 'Desconocido';
}

function buildDescription(accion: string, entityType: string, entityId?: number): string {
  const entity = entityId ? `${entityType} #${entityId}` : entityType;
  switch (accion) {
    case 'CREAR':
      return `Creó ${entity}`;
    case 'ACTUALIZAR':
      return `Actualizó ${entity}`;
    case 'ELIMINAR':
      return `Eliminó ${entity}`;
    case 'CAMBIO_ESTADO':
      return `Cambió estado de ${entity}`;
    case 'ANULAR':
      return `Anuló ${entity}`;
    case 'CONFIRMAR':
      return `Confirmó ${entity}`;
    case 'TRANSFERENCIA':
      return `Registró transferencia entre cuentas`;
    case 'GENERAR_PDF':
      return `Generó PDF de ${entity}`;
    case 'LOGIN':
      return `Inició sesión`;
    case 'LOGOUT':
      return `Cerró sesión`;
    default:
      return `${accion} ${entity}`;
  }
}

function extractContextIds(
  path: string,
  body: unknown
): { obraId?: number; ticketId?: number; clienteId?: number } {
  const result: { obraId?: number; ticketId?: number; clienteId?: number } = {};
  const data = body as Record<string, unknown> | null;

  // Extract IDs from URL params (e.g., /obras/5/presupuesto)
  const obraMatch = path.match(/\/obras\/(\d+)/);
  if (obraMatch) result.obraId = Number(obraMatch[1]);

  const ticketMatch = path.match(/\/tickets\/(\d+)/);
  if (ticketMatch) result.ticketId = Number(ticketMatch[1]);

  // Extract IDs from response body
  if (data && typeof data === 'object') {
    if ('clienteId' in data && typeof data.clienteId === 'number')
      result.clienteId = data.clienteId;
    if ('obraId' in data && typeof data.obraId === 'number') result.obraId = data.obraId;
    if ('ticketId' in data && typeof data.ticketId === 'number') result.ticketId = data.ticketId;
  }

  return result;
}

export const auditMiddleware = (req: Request, res: Response, next: NextFunction) => {
  const method = req.method;

  // Only audit mutations and auth events
  const accion = getAccion(method, req.path);
  if (!accion) return next();

  const modulo = getModulo(req.originalUrl || req.path);
  if (!modulo) return next();

  // Don't audit the audit endpoint itself
  if (req.originalUrl?.startsWith('/api/audit')) return next();

  // Intercept response to capture the result
  const originalJson = res.json.bind(res);

  res.json = function (body: unknown) {
    // Only log successful mutations (2xx status codes)
    if (res.statusCode >= 200 && res.statusCode < 300 && req.user) {
      const entityInfo = extractEntityInfo(body, req.originalUrl || req.path);
      const contextIds = extractContextIds(req.originalUrl || req.path, body);

      // Extract entity ID from URL for updates/deletes if not in body
      let entityId = entityInfo.id;
      if (!entityId) {
        const idMatch = req.path.match(/\/(\d+)(?:\/|$)/);
        if (idMatch) entityId = Number(idMatch[1]);
      }

      registrarEvento({
        usuarioId: req.user.id,
        accion,
        modulo,
        entidadId: entityId,
        entidadTipo: entityInfo.tipo,
        descripcion: buildDescription(accion, entityInfo.tipo || modulo, entityId),
        ip: getClientIp(req),
        obraId: contextIds.obraId,
        ticketId: contextIds.ticketId,
        clienteId: contextIds.clienteId,
      });
    }

    return originalJson(body);
  };

  next();
};

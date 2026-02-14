import { Request, Response } from 'express';
import { prisma } from '../../lib/prisma.js';

/**
 * GET /chat/search-mentions?q=...&type=all|user|ticket|obra|...
 * Unified mention search for @ users and # entities
 */
export const searchMentions = async (req: Request, res: Response) => {
  try {
    const q = ((req.query.q as string) || '').trim();
    const type = ((req.query.type as string) || 'all').toLowerCase();

    if (q.length < 2) {
      return res.json({ data: { users: [], entities: [] } });
    }

    interface MentionResult {
      id: number;
      type: string;
      display: string;
      detail: string;
      mentionText: string;
    }
    const results: { users: MentionResult[]; entities: MentionResult[] } = {
      users: [],
      entities: [],
    };

    // Search users (for @ mentions)
    if (type === 'all' || type === 'user') {
      const users = await prisma.usuario.findMany({
        where: {
          fechaEliminacion: null,
          OR: [
            { nombre: { contains: q, mode: 'insensitive' } },
            { apellido: { contains: q, mode: 'insensitive' } },
            { email: { contains: q, mode: 'insensitive' } },
          ],
        },
        select: { id: true, nombre: true, apellido: true, email: true },
        take: 5,
      });
      results.users = users.map((u) => ({
        id: u.id,
        type: 'user',
        display: `${u.nombre} ${u.apellido}`,
        detail: u.email,
        mentionText: `@[${u.nombre} ${u.apellido}](user:${u.id})`,
      }));
    }

    // Search entities (for # mentions)
    if (type === 'all' || type === 'ticket') {
      const tickets = await prisma.ticket.findMany({
        where: {
          fechaEliminacion: null,
          OR: [
            { codigoInterno: { equals: parseInt(q) || -1 } },
            { descripcion: { contains: q, mode: 'insensitive' } },
          ],
        },
        select: { id: true, codigoInterno: true, descripcion: true },
        take: 5,
      });
      results.entities.push(
        ...tickets.map((t) => ({
          id: t.id,
          type: 'ticket',
          display: `TKT-${String(t.codigoInterno).padStart(5, '0')}`,
          detail: t.descripcion?.substring(0, 60) || '',
          mentionText: `#[TKT-${String(t.codigoInterno).padStart(5, '0')}](ticket:${t.id})`,
        }))
      );
    }

    if (type === 'all' || type === 'obra') {
      const obras = await prisma.obra.findMany({
        where: {
          OR: [
            { codigo: { contains: q, mode: 'insensitive' } },
            { titulo: { contains: q, mode: 'insensitive' } },
          ],
        },
        select: { id: true, codigo: true, titulo: true },
        take: 5,
      });
      results.entities.push(
        ...obras.map((o) => ({
          id: o.id,
          type: 'obra',
          display: o.codigo,
          detail: o.titulo || '',
          mentionText: `#[${o.codigo}](obra:${o.id})`,
        }))
      );
    }

    if (type === 'all' || type === 'cliente') {
      const clientes = await prisma.cliente.findMany({
        where: {
          fechaEliminacion: null,
          OR: [
            { codigo: { equals: parseInt(q) || -1 } },
            { razonSocial: { contains: q, mode: 'insensitive' } },
          ],
        },
        select: { id: true, codigo: true, razonSocial: true },
        take: 5,
      });
      results.entities.push(
        ...clientes.map((c) => ({
          id: c.id,
          type: 'cliente',
          display: String(c.codigo),
          detail: c.razonSocial,
          mentionText: `#[${c.codigo}](cliente:${c.id})`,
        }))
      );
    }

    if (type === 'all' || type === 'vehiculo') {
      const vehiculos = await prisma.vehiculo.findMany({
        where: {
          fechaEliminacion: null,
          OR: [
            { patente: { contains: q, mode: 'insensitive' } },
            { codigoInterno: { equals: parseInt(q) || -1 } },
          ],
        },
        select: { id: true, patente: true, codigoInterno: true },
        take: 5,
      });
      results.entities.push(
        ...vehiculos.map((v) => ({
          id: v.id,
          type: 'vehiculo',
          display: v.patente,
          detail: `Cod: ${v.codigoInterno}`,
          mentionText: `#[${v.patente}](vehiculo:${v.id})`,
        }))
      );
    }

    if (type === 'all' || type === 'material') {
      const materiales = await prisma.material.findMany({
        where: {
          fechaEliminacion: null,
          OR: [
            { codigoInterno: { equals: parseInt(q) || -1 } },
            { codigoArticulo: { contains: q, mode: 'insensitive' } },
            { nombre: { contains: q, mode: 'insensitive' } },
          ],
        },
        select: { id: true, codigoInterno: true, codigoArticulo: true, nombre: true },
        take: 5,
      });
      results.entities.push(
        ...materiales.map((m) => ({
          id: m.id,
          type: 'material',
          display: m.codigoArticulo,
          detail: m.nombre,
          mentionText: `#[${m.codigoArticulo}](material:${m.id})`,
        }))
      );
    }

    res.json({ data: results });
  } catch (error) {
    console.error('Error buscando menciones:', error);
    res.status(500).json({ error: 'Error al buscar menciones' });
  }
};

import { Request, Response } from 'express';
import { prisma } from '../../lib/prisma.js';

// =====================================================
// DASHBOARD / REPORTES
// =====================================================

export const getDashboard = async (_req: Request, res: Response) => {
  try {
    // Saldos totales por tipo de cuenta
    const cuentas = await prisma.cuentaFinanciera.findMany({
      where: { activa: true },
      include: { banco: { select: { nombreCorto: true } } },
    });

    const saldoTotal = cuentas.reduce((acc, c) => acc + Number(c.saldoActual), 0);

    // Movimientos del mes actual
    const inicioMes = new Date();
    inicioMes.setDate(1);
    inicioMes.setHours(0, 0, 0, 0);

    const ingresosMes = await prisma.movimiento.aggregate({
      where: {
        tipo: 'INGRESO',
        estado: { not: 'ANULADO' },
        fechaMovimiento: { gte: inicioMes },
      },
      _sum: { monto: true },
      _count: true,
    });

    const egresosMes = await prisma.movimiento.aggregate({
      where: {
        tipo: 'EGRESO',
        estado: { not: 'ANULADO' },
        fechaMovimiento: { gte: inicioMes },
      },
      _sum: { monto: true },
      _count: true,
    });

    // Últimos 5 movimientos
    const ultimosMovimientos = await prisma.movimiento.findMany({
      where: { estado: { not: 'ANULADO' } },
      include: {
        cuenta: { select: { nombre: true } },
      },
      orderBy: { fechaMovimiento: 'desc' },
      take: 5,
    });

    res.json({
      saldoTotal,
      ingresosMes: {
        monto: Number(ingresosMes._sum.monto || 0),
        cantidad: ingresosMes._count,
      },
      egresosMes: {
        monto: Number(egresosMes._sum.monto || 0),
        cantidad: egresosMes._count,
      },
      balanceMes: Number(ingresosMes._sum.monto || 0) - Number(egresosMes._sum.monto || 0),
      cuentas: cuentas.map((c) => ({
        id: c.id,
        nombre: c.nombre,
        tipo: c.tipo,
        banco: c.banco?.nombreCorto,
        saldoActual: Number(c.saldoActual),
      })),
      ultimosMovimientos,
    });
  } catch (error) {
    console.error('[Finanzas] getDashboard error:', error);
    res.status(500).json({ error: 'Error al obtener dashboard' });
  }
};

export const getSaldos = async (_req: Request, res: Response) => {
  try {
    const cuentas = await prisma.cuentaFinanciera.findMany({
      where: { activa: true },
      select: {
        id: true,
        nombre: true,
        tipo: true,
        saldoActual: true,
        moneda: true,
        banco: { select: { nombreCorto: true } },
      },
      orderBy: { saldoActual: 'desc' },
    });

    const total = cuentas.reduce((acc, c) => acc + Number(c.saldoActual), 0);

    res.json({ cuentas, total });
  } catch (error) {
    console.error('[Finanzas] getSaldos error:', error);
    res.status(500).json({ error: 'Error al obtener saldos' });
  }
};

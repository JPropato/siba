import { Prisma } from '@prisma/client';
import { prisma } from '../../lib/prisma.js';

type TxClient = Prisma.TransactionClient;

export async function actualizarSaldoCuenta(cuentaId: number, tx?: TxClient) {
  const db = tx ?? prisma;

  const cuenta = await db.cuentaFinanciera.findUnique({ where: { id: cuentaId } });
  if (!cuenta) return;

  const ingresos = await db.movimiento.aggregate({
    where: { cuentaId, tipo: 'INGRESO', estado: { not: 'ANULADO' } },
    _sum: { monto: true },
  });

  const egresos = await db.movimiento.aggregate({
    where: { cuentaId, tipo: 'EGRESO', estado: { not: 'ANULADO' } },
    _sum: { monto: true },
  });

  const saldoIngresos = Number(ingresos._sum.monto || 0);
  const saldoEgresos = Number(egresos._sum.monto || 0);
  const saldoActual = Number(cuenta.saldoInicial) + saldoIngresos - saldoEgresos;

  await db.cuentaFinanciera.update({
    where: { id: cuentaId },
    data: { saldoActual },
  });
}

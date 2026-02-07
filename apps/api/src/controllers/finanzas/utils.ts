import { prisma } from '../../lib/prisma.js';

export async function actualizarSaldoCuenta(cuentaId: number) {
  const cuenta = await prisma.cuentaFinanciera.findUnique({ where: { id: cuentaId } });
  if (!cuenta) return;

  const ingresos = await prisma.movimiento.aggregate({
    where: { cuentaId, tipo: 'INGRESO', estado: { not: 'ANULADO' } },
    _sum: { monto: true },
  });

  const egresos = await prisma.movimiento.aggregate({
    where: { cuentaId, tipo: 'EGRESO', estado: { not: 'ANULADO' } },
    _sum: { monto: true },
  });

  const saldoIngresos = Number(ingresos._sum.monto || 0);
  const saldoEgresos = Number(egresos._sum.monto || 0);
  const saldoActual = Number(cuenta.saldoInicial) + saldoIngresos - saldoEgresos;

  await prisma.cuentaFinanciera.update({
    where: { id: cuentaId },
    data: { saldoActual },
  });
}

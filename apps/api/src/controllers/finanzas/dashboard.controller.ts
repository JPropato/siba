import { Request, Response } from 'express';
import { prisma } from '../../lib/prisma.js';
import type { TipoCuentaContable } from '@prisma/client';

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
        cuentaContable: { select: { id: true, codigo: true, nombre: true } },
        centroCosto: { select: { id: true, codigo: true, nombre: true } },
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

// =====================================================
// BALANCE CONTABLE (Balance General + Estado de Resultados)
// =====================================================

interface CuentaConSaldo {
  id: number;
  codigo: string;
  nombre: string;
  nivel: number;
  imputable: boolean;
  saldo: number;
  hijos?: CuentaConSaldo[];
}

export const getBalanceContable = async (req: Request, res: Response) => {
  try {
    const { fechaHasta } = req.query;

    // 1. Traer todas las cuentas contables activas
    const cuentas = await prisma.cuentaContable.findMany({
      where: { activa: true },
      orderBy: { codigo: 'asc' },
    });

    // 2. Agregar movimientos por cuentaContableId y tipo
    const fechaFilter = fechaHasta
      ? { fechaMovimiento: { lte: new Date(fechaHasta as string) } }
      : {};

    const saldosRaw = await prisma.movimiento.groupBy({
      by: ['cuentaContableId', 'tipo'],
      where: {
        estado: { not: 'ANULADO' },
        cuentaContableId: { not: null },
        ...fechaFilter,
      },
      _sum: { monto: true },
    });

    // 3. Calcular saldo por cuenta: INGRESO - EGRESO
    const saldoMap = new Map<number, number>();
    for (const row of saldosRaw) {
      const id = row.cuentaContableId!;
      const monto = Number(row._sum.monto || 0);
      const current = saldoMap.get(id) || 0;
      if (row.tipo === 'INGRESO') {
        saldoMap.set(id, current + monto);
      } else {
        saldoMap.set(id, current - monto);
      }
    }

    // 4. Construir mapa de cuentas
    const cuentaMap = new Map<number, CuentaConSaldo>();
    for (const c of cuentas) {
      cuentaMap.set(c.id, {
        id: c.id,
        codigo: c.codigo,
        nombre: c.nombre,
        nivel: c.nivel,
        imputable: c.imputable,
        saldo: c.imputable ? saldoMap.get(c.id) || 0 : 0,
        hijos: [],
      });
    }

    // 5. Construir árbol y propagar saldos de hijos a padres
    const roots: CuentaConSaldo[] = [];
    for (const c of cuentas) {
      const node = cuentaMap.get(c.id)!;
      if (c.parentId && cuentaMap.has(c.parentId)) {
        cuentaMap.get(c.parentId)!.hijos!.push(node);
      } else {
        roots.push(node);
      }
    }

    // Propagar saldos bottom-up
    function propagarSaldos(node: CuentaConSaldo): number {
      if (!node.hijos || node.hijos.length === 0) return node.saldo;
      node.saldo = node.hijos.reduce((acc, hijo) => acc + propagarSaldos(hijo), 0);
      return node.saldo;
    }
    roots.forEach(propagarSaldos);

    // Filtrar hijos vacíos recursivamente
    function filtrarVacios(nodes: CuentaConSaldo[]): CuentaConSaldo[] {
      return nodes
        .filter((n) => n.saldo !== 0)
        .map((n) => ({
          ...n,
          hijos: n.hijos && n.hijos.length > 0 ? filtrarVacios(n.hijos) : undefined,
        }));
    }

    // 6. Agrupar por tipo
    const tipos: TipoCuentaContable[] = ['ACTIVO', 'PASIVO', 'PATRIMONIO', 'INGRESO', 'GASTO'];
    const tipoMap = new Map<string, { id: number; parentId: number | null }[]>();
    for (const c of cuentas) {
      if (!tipoMap.has(c.tipo)) tipoMap.set(c.tipo, []);
      tipoMap.get(c.tipo)!.push({ id: c.id, parentId: c.parentId });
    }

    function getRootsForTipo(tipo: string): CuentaConSaldo[] {
      const ids = tipoMap.get(tipo) || [];
      const rootIds = ids.filter((c) => !c.parentId || !cuentaMap.has(c.parentId)).map((c) => c.id);
      return filtrarVacios(rootIds.map((id) => cuentaMap.get(id)!).filter(Boolean));
    }

    // Mapear enum → key de respuesta (INGRESO→ingresos, GASTO→gastos)
    const tipoKeyMap: Record<string, string> = {
      ACTIVO: 'activo',
      PASIVO: 'pasivo',
      PATRIMONIO: 'patrimonio',
      INGRESO: 'ingresos',
      GASTO: 'gastos',
    };

    const resultado: Record<string, { total: number; cuentas: CuentaConSaldo[] }> = {};
    for (const tipo of tipos) {
      const cuentasTipo = getRootsForTipo(tipo);
      const total = cuentasTipo.reduce((acc, c) => acc + c.saldo, 0);
      resultado[tipoKeyMap[tipo]] = { total, cuentas: cuentasTipo };
    }

    const totalActivo = resultado.activo.total;
    const totalPasivo = resultado.pasivo.total;
    const totalPatrimonio = resultado.patrimonio.total;
    const totalIngresos = resultado.ingresos.total;
    const totalGastos = resultado.gastos.total;
    const resultadoPeriodo = totalIngresos + totalGastos; // gastos son negativos

    res.json({
      fecha: fechaHasta || new Date().toISOString().split('T')[0],
      activo: resultado.activo,
      pasivo: resultado.pasivo,
      patrimonio: resultado.patrimonio,
      ingresos: resultado.ingresos,
      gastos: resultado.gastos,
      resultadoPeriodo,
      ecuacionContable: {
        activo: totalActivo,
        pasivoPlusPatrimonio: Math.abs(totalPasivo) + Math.abs(totalPatrimonio) + resultadoPeriodo,
        balanceado:
          Math.abs(
            totalActivo - (Math.abs(totalPasivo) + Math.abs(totalPatrimonio) + resultadoPeriodo)
          ) < 0.01,
      },
    });
  } catch (error) {
    console.error('[Finanzas] getBalanceContable error:', error);
    res.status(500).json({ error: 'Error al obtener balance contable' });
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

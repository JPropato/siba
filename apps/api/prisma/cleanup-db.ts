import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

type Modulo = 'finanzas' | 'tickets' | 'obras' | 'maestros' | 'todo';

const MODULOS_VALIDOS: Modulo[] = ['finanzas', 'tickets', 'obras', 'maestros', 'todo'];

// -------------------------------------------------------
// Cleanup por módulo (orden respeta Foreign Keys)
// -------------------------------------------------------

async function cleanupFinanzas() {
  console.log('🗑️  [finanzas] Eliminando Movimientos...');
  await prisma.movimiento.deleteMany({});

  console.log('🗑️  [finanzas] Eliminando Importaciones Masivas...');
  await prisma.importacionMasiva.deleteMany({});

  console.log('🗑️  [finanzas] Eliminando Cuentas Financieras...');
  await prisma.cuentaFinanciera.deleteMany({});

  console.log('🗑️  [finanzas] Eliminando Bancos...');
  await prisma.banco.deleteMany({});

  console.log('✅ [finanzas] Módulo limpio.');
}

async function cleanupTickets() {
  console.log('🗑️  [tickets] Eliminando Archivos...');
  await prisma.archivo.deleteMany({});

  console.log('🗑️  [tickets] Eliminando Órdenes de Trabajo...');
  await prisma.ordenTrabajo.deleteMany({});

  console.log('🗑️  [tickets] Eliminando Historial de Tickets...');
  await prisma.ticketHistorial.deleteMany({});

  console.log('🗑️  [tickets] Eliminando Tickets...');
  await prisma.ticket.deleteMany({});

  console.log('✅ [tickets] Módulo limpio.');
}

async function cleanupObras() {
  console.log('🗑️  [obras] Eliminando Comentarios de Obras...');
  await prisma.comentarioObra.deleteMany({});

  console.log('🗑️  [obras] Eliminando Historial de Estado de Obras...');
  await prisma.historialEstadoObra.deleteMany({});

  console.log('🗑️  [obras] Eliminando Archivos de Obras...');
  await prisma.archivoObra.deleteMany({});

  console.log('🗑️  [obras] Eliminando Items de Presupuesto...');
  await prisma.itemPresupuesto.deleteMany({});

  console.log('🗑️  [obras] Eliminando Versiones de Presupuesto...');
  await prisma.versionPresupuesto.deleteMany({});

  console.log('🗑️  [obras] Eliminando Obras...');
  await prisma.obra.deleteMany({});

  console.log('✅ [obras] Módulo limpio.');
}

async function cleanupMaestros() {
  // Maestros tiene dependencias en tickets, obras y finanzas.
  // Hay que limpiar esos módulos primero.
  console.log(
    '⚠️  [maestros] Limpiando módulos dependientes primero (finanzas, obras, tickets)...'
  );
  await cleanupFinanzas();
  await cleanupObras();
  await cleanupTickets();

  console.log('🗑️  [maestros] Eliminando Historial de Precios...');
  await prisma.historialPrecio.deleteMany({});

  console.log('🗑️  [maestros] Eliminando Materiales...');
  await prisma.material.deleteMany({});

  console.log('🗑️  [maestros] Eliminando Sucursales...');
  await prisma.sucursal.deleteMany({});

  console.log('🗑️  [maestros] Eliminando Empleados...');
  await prisma.empleado.deleteMany({});

  console.log('🗑️  [maestros] Eliminando Vehículos...');
  await prisma.vehiculo.deleteMany({});

  console.log('🗑️  [maestros] Eliminando Clientes...');
  await prisma.cliente.deleteMany({});

  console.log('🗑️  [maestros] Eliminando Zonas...');
  await prisma.zona.deleteMany({});

  console.log('✅ [maestros] Módulo limpio.');
}

async function cleanupTodo() {
  console.log('🧹 Limpieza TOTAL (excepto Usuarios y Roles)...\n');
  await cleanupFinanzas();
  console.log('');
  await cleanupObras();
  console.log('');
  await cleanupTickets();
  console.log('');

  // Maestros sin cascada (ya limpiamos dependientes arriba)
  console.log('🗑️  [maestros] Eliminando Historial de Precios...');
  await prisma.historialPrecio.deleteMany({});

  console.log('🗑️  [maestros] Eliminando Materiales...');
  await prisma.material.deleteMany({});

  console.log('🗑️  [maestros] Eliminando Sucursales...');
  await prisma.sucursal.deleteMany({});

  console.log('🗑️  [maestros] Eliminando Empleados...');
  await prisma.empleado.deleteMany({});

  console.log('🗑️  [maestros] Eliminando Vehículos...');
  await prisma.vehiculo.deleteMany({});

  console.log('🗑️  [maestros] Eliminando Clientes...');
  await prisma.cliente.deleteMany({});

  console.log('🗑️  [maestros] Eliminando Zonas...');
  await prisma.zona.deleteMany({});

  console.log('\n✅ Base de datos limpia (excepto Usuarios y Roles).');
}

// -------------------------------------------------------
// CLI: parsear --module=X
// -------------------------------------------------------

function parseModulo(): Modulo {
  const arg = process.argv.find((a) => a.startsWith('--module='));
  if (!arg) return 'todo';

  const valor = arg.split('=')[1] as Modulo;
  if (!MODULOS_VALIDOS.includes(valor)) {
    console.error(`❌ Módulo inválido: "${valor}"`);
    console.error(`   Módulos válidos: ${MODULOS_VALIDOS.join(', ')}`);
    process.exit(1);
  }
  return valor;
}

const CLEANUP_MAP: Record<Modulo, () => Promise<void>> = {
  finanzas: cleanupFinanzas,
  tickets: cleanupTickets,
  obras: cleanupObras,
  maestros: cleanupMaestros,
  todo: cleanupTodo,
};

async function main() {
  const modulo = parseModulo();
  console.log(`🧹 Cleanup SIBA — módulo: ${modulo}\n`);

  await CLEANUP_MAP[modulo]();

  console.log('\n🏁 Cleanup finalizado.');
  await prisma.$disconnect();
}

main().catch((err: unknown) => {
  const message = err instanceof Error ? err.message : String(err);
  console.error('💥 Error durante la limpieza:', message);
  prisma.$disconnect();
  process.exit(1);
});

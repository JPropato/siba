import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log('🧹 Iniciando limpieza de base de datos (Reset de Pruebas)...');

  // El orden importa para las Foreign Keys
  console.log('🗑️ Eliminando Tickets y su historial...');
  await prisma.ticketHistorial.deleteMany({});
  await prisma.ticket.deleteMany({});

  console.log('🗑️ Eliminando Obras y Presupuestos...');
  await prisma.itemPresupuesto.deleteMany({});
  await prisma.versionPresupuesto.deleteMany({});
  await prisma.obra.deleteMany({});

  console.log('🗑️ Eliminando Sucursales...');
  await prisma.sucursal.deleteMany({});

  console.log('🗑️ Eliminando Empleados y Vehículos...');
  await prisma.empleado.deleteMany({});
  await prisma.vehiculo.deleteMany({});

  console.log('🗑️ Eliminando Clientes y Zonas...');
  // Opcional: Mantener el cliente "Correo Argentino" si se prefiere,
  // pero para un reset total mejor barrer todo.
  await prisma.cliente.deleteMany({});
  await prisma.zona.deleteMany({});

  console.log('✅ Base de datos limpia (excepto Usuarios y Roles).');

  await prisma.$disconnect();
}

main().catch((err: unknown) => {
  const message = err instanceof Error ? err.message : String(err);
  console.error('💥 Error durante la limpieza:', message);
  prisma.$disconnect();
});

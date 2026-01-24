import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log('--- AUDITORÍA DE BASE DE DATOS ---');
  const clientes = await prisma.cliente.findMany();
  console.log(
    'Clientes:',
    clientes.map((c) => `${c.razonSocial} (CUIT: ${c.cuit})`)
  );

  const ticketsCount = await prisma.ticket.count();
  console.log('Total Tickets:', ticketsCount);

  const sucursales = await prisma.sucursal.findMany({ take: 5 });
  console.log(
    'Ejemplos de Sucursales:',
    sucursales.map((s) => s.nombre)
  );

  const empleados = await prisma.empleado.findMany({ take: 5 });
  console.log(
    'Ejemplos de Empleados:',
    empleados.map((e) => e.apellido)
  );

  await prisma.$disconnect();
}

main();

import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function verify() {
  console.log('🔍 Verificando datos de Correo Argentino...');

  const cliente = await prisma.cliente.findFirst({ where: { cuit: '30546662428' } });
  if (!cliente) throw new Error('Cliente no encontrado');

  const total = await prisma.sucursal.count({ where: { clienteId: cliente.id } });

  // Contar cuántos tienen datos del pliego
  const conUso = await prisma.sucursal.count({
    where: {
      clienteId: cliente.id,
      usoDestino: { not: null },
    },
  });

  const conM2 = await prisma.sucursal.count({
    where: {
      clienteId: cliente.id,
      metrosCuadrados: { not: null },
    },
  });

  // Sumar metros cuadrados
  const sumaM2 = await prisma.sucursal.aggregate({
    where: { clienteId: cliente.id },
    _sum: { metrosCuadrados: true },
  });

  console.log(`\n📊 Estadísticas:`);
  console.log(`- Total Sucursales: ${total}`);
  console.log(`- Con Uso/Destino: ${conUso} (${((conUso / total) * 100).toFixed(1)}%)`);
  console.log(`- Con M2: ${conM2} (${((conM2 / total) * 100).toFixed(1)}%)`);
  console.log(
    `- Metros Cuadrados Totales: ${sumaM2._sum.metrosCuadrados?.toLocaleString('es-AR')} m²`
  );

  // Muestra
  console.log('\n🔎 Muestra de datos (primeros 3 con match):');
  const muestra = await prisma.sucursal.findMany({
    where: {
      clienteId: cliente.id,
      usoDestino: { not: null },
    },
    take: 3,
    select: {
      nombre: true,
      zona: { select: { nombre: true } },
      usoDestino: true,
      regionOperativa: true,
      metrosCuadrados: true,
    },
  });
  console.table(muestra);
}

verify()
  .catch(console.error)
  .finally(() => prisma.$disconnect());

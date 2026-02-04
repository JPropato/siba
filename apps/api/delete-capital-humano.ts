import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function deleteCapitalHumano() {
  console.log('🔍 Buscando "CAPITAL HUMANO"...');

  const targets = await prisma.sucursal.findMany({
    where: {
      nombre: {
        contains: 'CAPITAL HUMANO',
        mode: 'insensitive',
      },
    },
  });

  if (targets.length === 0) {
    console.log('⚠️ No se encontró ninguna sucursal con "CAPITAL HUMANO".');
    return;
  }

  console.log(`✅ Encontradas ${targets.length} sucursales:`);
  targets.forEach((t) => console.log(`   - [${t.id}] ${t.nombre}`));

  const { count } = await prisma.sucursal.deleteMany({
    where: {
      id: { in: targets.map((t) => t.id) },
    },
  });

  console.log(`🗑️ Eliminados ${count} registros.`);
}

deleteCapitalHumano()
  .catch(console.error)
  .finally(() => prisma.$disconnect());

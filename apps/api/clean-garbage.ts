import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function cleanData() {
  console.log('🧹 Iniciando limpieza de datos solicitados...');

  const patrones = ['ministerio (jp)', 'ministerio economia', 'desarrollo humano'];

  for (const patron of patrones) {
    console.log(`\n🔍 Buscando patrón: "${patron}"...`);

    // Buscar antes de borrar para reportar
    const targets = await prisma.sucursal.findMany({
      where: {
        nombre: {
          contains: patron,
          mode: 'insensitive',
        },
      },
      select: { id: true, nombre: true },
    });

    if (targets.length === 0) {
      console.log('   (No se encontraron coincidencias)');
      continue;
    }

    console.log(`   Encontrados ${targets.length} registros:`);
    targets.forEach((t) => console.log(`   - [${t.id}] ${t.nombre}`));

    // Eliminar
    const { count } = await prisma.sucursal.deleteMany({
      where: {
        id: { in: targets.map((t) => t.id) },
      },
    });

    console.log(`   ✅ Eliminados ${count} registros.`);
  }
}

cleanData()
  .catch(console.error)
  .finally(() => prisma.$disconnect());

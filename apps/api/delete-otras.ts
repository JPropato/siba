import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function deleteOtras() {
  console.log('🗑️ Eliminando zona OTRAS y sus dependencias...');

  try {
    // 1. Buscar la zona OTRAS
    const zonaOtras = await prisma.zona.findFirst({ where: { nombre: 'OTRAS' } });

    if (!zonaOtras) {
      console.log('⚠️ La zona OTRAS no existe.');
      return;
    }

    // 2. Eliminar sucursales vinculadas (La que se llama "OTRAS")
    const deletedSucursales = await prisma.sucursal.deleteMany({
      where: { zonaId: zonaOtras.id },
    });
    console.log(`✅ ${deletedSucursales.count} sucursales eliminadas en zona OTRAS.`);

    // 3. Eliminar la zona
    const deletedZona = await prisma.zona.delete({
      where: { id: zonaOtras.id },
    });
    console.log(`✅ Zona "${deletedZona.nombre}" eliminada correctamente.`);
  } catch (error) {
    console.error('❌ Error al eliminar:', error);
  }
}

deleteOtras()
  .catch(console.error)
  .finally(() => prisma.$disconnect());

import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Empezando el seed del módulo de seguridad (en español)...');

  // 1. Crear Permisos Base
  const permisos = [
    // Módulo Seguridad
    { codigo: 'seguridad:leer', modulo: 'Seguridad', descripcion: 'Ver usuarios y roles' },
    {
      codigo: 'seguridad:escribir',
      modulo: 'Seguridad',
      descripcion: 'Crear/Editar usuarios y roles',
    },

    // Módulo Comercial
    { codigo: 'comercial:leer', modulo: 'Comercial', descripcion: 'Ver tickets y obras' },
    { codigo: 'comercial:escribir', modulo: 'Comercial', descripcion: 'Gestionar tickets y obras' },

    // Módulo Finanzas
    { codigo: 'finanzas:leer', modulo: 'Finanzas', descripcion: 'Ver reportes financieros' },
    { codigo: 'finanzas:escribir', modulo: 'Finanzas', descripcion: 'Gestionar gastos e ingresos' },

    // Módulo Administración
    {
      codigo: 'admin:leer',
      modulo: 'Administración',
      descripcion: 'Ver maestros (clientes, vehiculos, etc)',
    },
    { codigo: 'admin:escribir', modulo: 'Administración', descripcion: 'Editar maestros' },
  ];

  for (const p of permisos) {
    await prisma.permiso.upsert({
      where: { codigo: p.codigo },
      update: {},
      create: p,
    });
  }
  console.log('✅ Permisos creados.');

  // 2. Crear Roles Base
  const superAdmin = await prisma.rol.upsert({
    where: { nombre: 'Super Admin' },
    update: {},
    create: {
      nombre: 'Super Admin',
      descripcion: 'Acceso total al sistema',
    },
  });

  const todosLosPermisos = await prisma.permiso.findMany();

  for (const p of todosLosPermisos) {
    await prisma.rolPermiso.upsert({
      where: {
        rolId_permisoId: {
          rolId: superAdmin.id,
          permisoId: p.id,
        },
      },
      update: {},
      create: {
        rolId: superAdmin.id,
        permisoId: p.id,
      },
    });
  }
  console.log('✅ Rol Super Admin creado y permisos asignados.');

  console.log('🏁 Seed completado con éxito.');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });

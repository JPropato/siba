import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log('🛡️  Configurando seguridad base (SIBA Essentials)...');

  // 1. Permisos
  const permisos = [
    { codigo: 'dashboard:leer', modulo: 'Dashboard', descripcion: 'Ver el panel principal' },
    { codigo: 'seguridad:leer', modulo: 'Seguridad', descripcion: 'Ver usuarios y roles' },
    {
      codigo: 'seguridad:escribir',
      modulo: 'Seguridad',
      descripcion: 'Crear/Editar usuarios y roles',
    },
    { codigo: 'comercial:leer', modulo: 'Comercial', descripcion: 'Ver tickets y obras' },
    { codigo: 'comercial:escribir', modulo: 'Comercial', descripcion: 'Gestionar tickets y obras' },
    { codigo: 'finanzas:leer', modulo: 'Finanzas', descripcion: 'Ver reportes financieros' },
    { codigo: 'finanzas:escribir', modulo: 'Finanzas', descripcion: 'Gestionar gastos e ingresos' },
    {
      codigo: 'admin:leer',
      modulo: 'Administración',
      descripcion: 'Ver maestros (clientes, vehiculos, etc)',
    },
    { codigo: 'admin:escribir', modulo: 'Administración', descripcion: 'Editar maestros' },
    { codigo: 'empleados:leer', modulo: 'Empleados', descripcion: 'Ver empleados' },
    { codigo: 'empleados:escribir', modulo: 'Empleados', descripcion: 'Gestionar empleados' },
    { codigo: 'tickets:leer', modulo: 'Tickets', descripcion: 'Ver tickets' },
    { codigo: 'tickets:escribir', modulo: 'Tickets', descripcion: 'Gestionar tickets' },
  ];

  for (const p of permisos) {
    await prisma.permiso.upsert({
      where: { codigo: p.codigo },
      update: {},
      create: p,
    });
  }

  // 2. Rol Super Admin
  const superAdmin = await prisma.rol.upsert({
    where: { nombre: 'Super Admin' },
    update: {},
    create: {
      nombre: 'Super Admin',
      descripcion: 'Acceso total al sistema',
    },
  });

  // 3. Asignar todos los permisos al Super Admin
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

  // 4. Usuario Admin Inicial
  const adminEmail = process.env.INITIAL_ADMIN_EMAIL || 'admin@bauman.com.ar';
  const hashedPassword = '$2a$10$nnsjtX37HKdZa9PA3dEVYuQrIxyeWFYXbZMMD3pEW/Y6tupKa/WN6'; // admin123

  const adminUser = await prisma.usuario.upsert({
    where: { email: adminEmail },
    update: {
      claveHash: hashedPassword,
    },
    create: {
      email: adminEmail,
      nombre: 'Admin',
      apellido: 'Principale',
      claveHash: hashedPassword,
    },
  });

  await prisma.usuarioRol.upsert({
    where: {
      usuarioId_rolId: {
        usuarioId: adminUser.id,
        rolId: superAdmin.id,
      },
    },
    update: {},
    create: {
      usuarioId: adminUser.id,
      rolId: superAdmin.id,
    },
  });

  console.log('✅ Seguridad base configurada correctamente.');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });

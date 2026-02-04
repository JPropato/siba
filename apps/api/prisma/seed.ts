import { PrismaClient } from '@prisma/client';
import fs from 'fs';
import path from 'path';
import csv from 'csv-parser';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const prisma = new PrismaClient();

/**
 * SEED LIMPIO - Solo datos esenciales:
 * 1. Roles y Permisos
 * 2. Usuario Admin
 * 3. Cliente Correo Argentino + Zonas + Sucursales (desde CSV consolidado)
 */

async function readCSV(filePath: string): Promise<Record<string, string>[]> {
  return new Promise((resolve, reject) => {
    const results: Record<string, string>[] = [];
    if (!fs.existsSync(filePath)) {
      console.warn(`⚠️ Archivo no encontrado: ${filePath}`);
      return resolve([]);
    }
    fs.createReadStream(filePath)
      .pipe(csv())
      .on('data', (data) => results.push(data))
      .on('end', () => resolve(results))
      .on('error', (err) => reject(err));
  });
}

async function main() {
  console.log('🌱 Seed limpio SIBA - Solo datos esenciales...');

  // ----------------------------------------------------
  // 1. Roles y Permisos
  // ----------------------------------------------------
  console.log('🛡️  Configurando permisos y roles...');

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
    { codigo: 'admin:leer', modulo: 'Administración', descripcion: 'Ver maestros' },
    { codigo: 'admin:escribir', modulo: 'Administración', descripcion: 'Editar maestros' },
    { codigo: 'empleados:leer', modulo: 'Empleados', descripcion: 'Ver empleados' },
    { codigo: 'empleados:escribir', modulo: 'Empleados', descripcion: 'Gestionar empleados' },
    { codigo: 'tickets:leer', modulo: 'Tickets', descripcion: 'Ver tickets' },
    { codigo: 'tickets:escribir', modulo: 'Tickets', descripcion: 'Gestionar tickets' },
  ];

  for (const p of permisos) {
    await prisma.permiso.upsert({ where: { codigo: p.codigo }, update: {}, create: p });
  }

  // Rol Super Admin
  const superAdmin = await prisma.rol.upsert({
    where: { nombre: 'Super Admin' },
    update: {},
    create: { nombre: 'Super Admin', descripcion: 'Acceso total al sistema' },
  });

  // Asignar todos los permisos al Super Admin
  const todosLosPermisos = await prisma.permiso.findMany();
  for (const p of todosLosPermisos) {
    await prisma.rolPermiso.upsert({
      where: { rolId_permisoId: { rolId: superAdmin.id, permisoId: p.id } },
      update: {},
      create: { rolId: superAdmin.id, permisoId: p.id },
    });
  }

  // Usuario Admin
  const adminEmail = 'admin@bauman.com.ar';
  const hashedPassword = '$2a$10$nnsjtX37HKdZa9PA3dEVYuQrIxyeWFYXbZMMD3pEW/Y6tupKa/WN6'; // admin123
  const adminUser = await prisma.usuario.upsert({
    where: { email: adminEmail },
    update: { claveHash: hashedPassword },
    create: {
      email: adminEmail,
      nombre: 'Admin',
      apellido: 'Bauman',
      claveHash: hashedPassword,
    },
  });

  await prisma.usuarioRol.upsert({
    where: { usuarioId_rolId: { usuarioId: adminUser.id, rolId: superAdmin.id } },
    update: {},
    create: { usuarioId: adminUser.id, rolId: superAdmin.id },
  });

  console.log('✅ Permisos, roles y usuario admin configurados.');

  // ----------------------------------------------------
  // 2. Cliente Correo Argentino y Zonas
  // ----------------------------------------------------
  console.log('🏢 Creando cliente Correo Argentino...');

  const cliente = await prisma.cliente.upsert({
    where: { cuit: '30546662428' },
    update: {},
    create: {
      codigo: 1000,
      razonSocial: 'Correo Argentino S.A.',
      cuit: '30546662428',
      email: 'contacto@correoargentino.com.ar',
      telefono: '0810-777-7787',
      direccionFiscal: 'Av. Paseo Colón 746, CABA',
    },
  });

  console.log('✅ Cliente Correo Argentino creado.');

  // ----------------------------------------------------
  // 3. Zonas y Sucursales desde CSV consolidado
  // ----------------------------------------------------
  console.log('📍 Cargando zonas y sucursales desde CSV consolidado...');

  const csvPath = path.join(__dirname, 'sucursales-consolidado.csv');
  const sucursalesCSV = await readCSV(csvPath);

  if (sucursalesCSV.length === 0) {
    console.error('❌ No se encontró el archivo sucursales-consolidado.csv');
    return;
  }

  // Crear zonas únicas (Excluyendo OTRAS)
  const zonasUnicas = Array.from(
    new Set(
      sucursalesCSV.map((s) => s['ZONA']?.trim().toUpperCase()).filter((z) => z && z !== 'OTRAS')
    )
  );

  console.log(`📍 Creando ${zonasUnicas.length} zonas...`);
  const zonasMap = new Map<string, number>();

  for (const nombreZona of zonasUnicas) {
    const zona = await prisma.zona.upsert({
      where: { nombre: nombreZona },
      update: {},
      create: { nombre: nombreZona, descripcion: `Zona ${nombreZona}` },
    });
    zonasMap.set(nombreZona, zona.id);
  }

  // Zona SIN ASIGNAR (antes GENERAL) para sucursales sin zona
  const zonaSinAsignar = await prisma.zona.upsert({
    where: { nombre: 'SIN ASIGNAR' },
    update: {},
    create: { nombre: 'SIN ASIGNAR', descripcion: 'Sucursales sin zona asignada' },
  });
  zonasMap.set('SIN ASIGNAR', zonaSinAsignar.id);
  zonasMap.set('GENERAL', zonaSinAsignar.id); // Map GENERAL to SIN ASIGNAR if it appears

  // Crear sucursales
  console.log(`🏪 Creando ${sucursalesCSV.length} sucursales...`);
  let creadas = 0;
  let existentes = 0;

  // Sucursales a excluir explícitamente
  const blacklist = [
    'CAPITAL HUMANO',
    'MINISTERIO (JP)',
    'MINISTERIO ECONOMIA',
    'DESARROLLO HUMANO',
    'OTRAS',
  ];

  for (const s of sucursalesCSV) {
    const nombre = s['NOMBRE']?.trim();
    if (!nombre) continue;

    // Filtrar blacklist
    if (blacklist.some((b) => nombre.toUpperCase().includes(b))) {
      console.log(`   ⛔ Saltando sucursal excluida: ${nombre}`);
      continue;
    }

    // Verificar si ya existe
    const existe = await prisma.sucursal.findFirst({
      where: { nombre, clienteId: cliente.id },
    });

    if (existe) {
      existentes++;
      continue;
    }

    let zonaNombre = s['ZONA']?.trim().toUpperCase();

    // Si la zona es OTRAS o vacía, usar SIN ASIGNAR
    if (!zonaNombre || zonaNombre === 'OTRAS') {
      zonaNombre = 'SIN ASIGNAR';
    }

    const zonaId = zonasMap.get(zonaNombre) || zonasMap.get('SIN ASIGNAR')!;

    // Nuevos campos del Pliego N° 040/2025
    const m2Raw = s['METROS_CUADRADOS']?.trim();
    const metrosCuadrados = m2Raw ? parseFloat(m2Raw) : null;

    await prisma.sucursal.create({
      data: {
        nombre,
        direccion: s['DIRECCION'] || 'Sin dirección',
        telefono: s['TELEFONO'] || null,
        clienteId: cliente.id,
        zonaId,
        // Campos específicos Correo Argentino (Pliego N° 040/2025)
        areaInterna: s['AREA_INTERNA'] || null,
        regionOperativa: s['REGION_OPERATIVA'] || null,
        usoDestino: s['USO_DESTINO'] || null,
        metrosCuadrados: metrosCuadrados && !isNaN(metrosCuadrados) ? metrosCuadrados : null,
        imagenSucursal: s['IMAGEN_SUCURSAL'] || null,
      },
    });
    creadas++;

    if (creadas % 50 === 0) {
      console.log(`   ... ${creadas} sucursales creadas`);
    }
  }

  console.log(`✅ Sucursales: ${creadas} creadas, ${existentes} ya existían.`);

  // Resumen final
  const totalSucursales = await prisma.sucursal.count({ where: { clienteId: cliente.id } });
  const totalZonas = await prisma.zona.count();

  console.log('');
  console.log('🎉 Seed completado!');
  console.log(`   - Zonas: ${totalZonas}`);
  console.log(`   - Sucursales Correo Argentino: ${totalSucursales}`);
  console.log(`   - Usuario: admin@bauman.com.ar / admin123`);
}

main()
  .catch((e) => {
    console.error('❌ Error en seed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });

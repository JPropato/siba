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
    // Dashboard
    { codigo: 'dashboard:leer', modulo: 'Dashboard', descripcion: 'Ver el panel principal' },
    // Tickets
    { codigo: 'tickets:leer', modulo: 'Tickets', descripcion: 'Ver tickets' },
    { codigo: 'tickets:escribir', modulo: 'Tickets', descripcion: 'Crear/editar tickets' },
    // Órdenes de Trabajo
    { codigo: 'ordenes:leer', modulo: 'Órdenes de Trabajo', descripcion: 'Ver órdenes de trabajo' },
    {
      codigo: 'ordenes:escribir',
      modulo: 'Órdenes de Trabajo',
      descripcion: 'Gestionar órdenes de trabajo',
    },
    // Obras
    { codigo: 'obras:leer', modulo: 'Obras', descripcion: 'Ver obras y presupuestos' },
    { codigo: 'obras:escribir', modulo: 'Obras', descripcion: 'Gestionar obras y presupuestos' },
    // Clientes
    { codigo: 'clientes:leer', modulo: 'Clientes', descripcion: 'Ver clientes' },
    { codigo: 'clientes:escribir', modulo: 'Clientes', descripcion: 'Gestionar clientes' },
    // Vehículos
    { codigo: 'vehiculos:leer', modulo: 'Vehículos', descripcion: 'Ver vehículos' },
    { codigo: 'vehiculos:escribir', modulo: 'Vehículos', descripcion: 'Gestionar vehículos' },
    // Zonas
    { codigo: 'zonas:leer', modulo: 'Zonas', descripcion: 'Ver zonas' },
    { codigo: 'zonas:escribir', modulo: 'Zonas', descripcion: 'Gestionar zonas' },
    // Sedes
    { codigo: 'sedes:leer', modulo: 'Sedes', descripcion: 'Ver sedes/sucursales' },
    { codigo: 'sedes:escribir', modulo: 'Sedes', descripcion: 'Gestionar sedes/sucursales' },
    // Materiales
    { codigo: 'materiales:leer', modulo: 'Materiales', descripcion: 'Ver materiales' },
    { codigo: 'materiales:escribir', modulo: 'Materiales', descripcion: 'Gestionar materiales' },
    // Empleados
    { codigo: 'empleados:leer', modulo: 'Empleados', descripcion: 'Ver empleados' },
    { codigo: 'empleados:escribir', modulo: 'Empleados', descripcion: 'Gestionar empleados' },
    // Usuarios
    { codigo: 'usuarios:leer', modulo: 'Usuarios', descripcion: 'Ver usuarios' },
    { codigo: 'usuarios:escribir', modulo: 'Usuarios', descripcion: 'Gestionar usuarios' },
    // Roles
    { codigo: 'roles:leer', modulo: 'Roles', descripcion: 'Ver roles y permisos' },
    { codigo: 'roles:escribir', modulo: 'Roles', descripcion: 'Gestionar roles y permisos' },
    // Finanzas
    { codigo: 'finanzas:leer', modulo: 'Finanzas', descripcion: 'Ver reportes financieros' },
    {
      codigo: 'finanzas:escribir',
      modulo: 'Finanzas',
      descripcion: 'Gestionar movimientos financieros',
    },
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

  // ----------------------------------------------------
  // 4. Técnicos desde CSV
  // ----------------------------------------------------
  console.log('👷 Cargando técnicos desde CSV...');

  const tecnicosPath = path.join(__dirname, 'tecnicos.csv');
  const tecnicosCSV = await readCSV(tecnicosPath);

  if (tecnicosCSV.length === 0) {
    console.warn('⚠️ No se encontró el archivo tecnicos.csv, saltando carga de técnicos.');
  } else {
    let tecnicosCreados = 0;
    let tecnicosExistentes = 0;

    for (const t of tecnicosCSV) {
      const apellido = t['APELLIDO']?.trim();
      const nombre = t['NOMBRE']?.trim();
      if (!apellido || !nombre) continue;

      const zonaNombre = t['ZONA']?.trim().toUpperCase();
      const zonaId = zonaNombre ? zonasMap.get(zonaNombre) || null : null;
      const esReferente = t['ES_REFERENTE']?.trim().toUpperCase() === 'SI';
      const puesto = t['PUESTO']?.trim() || null;
      const telefono = t['TELEFONO']?.trim() || null;
      const contratacion =
        t['CONTRATACION']?.trim() === 'CONTRATO_MARCO' ? ('CONTRATO_MARCO' as const) : null;

      // Buscar si ya existe por apellido + nombre (no tienen email único)
      const existe = await prisma.empleado.findFirst({
        where: {
          apellido,
          nombre,
          fechaEliminacion: null,
        },
      });

      if (existe) {
        // Actualizar campos nuevos si cambiaron
        await prisma.empleado.update({
          where: { id: existe.id },
          data: { esReferente, puesto, zonaId, telefono, contratacion },
        });
        tecnicosExistentes++;
        continue;
      }

      await prisma.empleado.create({
        data: {
          nombre,
          apellido,
          telefono,
          tipo: 'TECNICO',
          contratacion,
          esReferente,
          puesto,
          zonaId,
          inicioRelacionLaboral: new Date(),
        },
      });
      tecnicosCreados++;
    }

    console.log(
      `✅ Técnicos: ${tecnicosCreados} creados, ${tecnicosExistentes} ya existían (actualizados).`
    );
  }

  // Resumen final
  const totalSucursales = await prisma.sucursal.count({ where: { clienteId: cliente.id } });
  const totalZonas = await prisma.zona.count();
  const totalTecnicos = await prisma.empleado.count({
    where: { tipo: 'TECNICO', fechaEliminacion: null },
  });

  console.log('');
  console.log('🎉 Seed completado!');
  console.log(`   - Zonas: ${totalZonas}`);
  console.log(`   - Sucursales Correo Argentino: ${totalSucursales}`);
  console.log(`   - Técnicos: ${totalTecnicos}`);
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

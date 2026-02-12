import { PrismaClient } from '@prisma/client';
import fs from 'fs';
import path from 'path';
import csv from 'csv-parser';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const prisma = new PrismaClient();

type Modulo = 'seguridad' | 'maestros' | 'finanzas' | 'compras' | 'ejemplos' | 'tarjetas' | 'todo';

const MODULOS_VALIDOS: Modulo[] = [
  'seguridad',
  'maestros',
  'finanzas',
  'compras',
  'ejemplos',
  'tarjetas',
  'todo',
];

// -------------------------------------------------------
// Utilidades
// -------------------------------------------------------

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

// -------------------------------------------------------
// Seed: Seguridad (Roles, Permisos, Admin)
// -------------------------------------------------------

async function seedSeguridad() {
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
    { codigo: 'empleados:salarios', modulo: 'Empleados', descripcion: 'Ver informacion salarial' },
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
    // Compras
    {
      codigo: 'compras:leer',
      modulo: 'Compras',
      descripcion: 'Ver proveedores, facturas y cheques',
    },
    {
      codigo: 'compras:escribir',
      modulo: 'Compras',
      descripcion: 'Gestionar proveedores, facturas y cheques',
    },
    // Facturacion
    {
      codigo: 'facturacion:leer',
      modulo: 'Facturación',
      descripcion: 'Ver facturas emitidas y cobros',
    },
    {
      codigo: 'facturacion:escribir',
      modulo: 'Facturación',
      descripcion: 'Gestionar facturas emitidas y registrar cobros',
    },
    // Tarjetas
    { codigo: 'tarjetas:leer', modulo: 'Tarjetas', descripcion: 'Ver tarjetas y gastos' },
    {
      codigo: 'tarjetas:escribir',
      modulo: 'Tarjetas',
      descripcion: 'Gestionar tarjetas y registrar gastos',
    },
    { codigo: 'tarjetas:aprobar', modulo: 'Tarjetas', descripcion: 'Aprobar/rechazar rendiciones' },
    // Auditoría
    { codigo: 'audit:leer', modulo: 'Auditoría', descripcion: 'Ver registro de actividad' },
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
}

// -------------------------------------------------------
// Seed: Maestros (Cliente, Zonas, Sucursales, Técnicos)
// -------------------------------------------------------

async function seedMaestros() {
  // --- Cliente Correo Argentino ---
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

  // --- Zonas y Sucursales desde CSV ---
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
  zonasMap.set('GENERAL', zonaSinAsignar.id);

  // Crear sucursales
  console.log(`🏪 Creando ${sucursalesCSV.length} sucursales...`);
  let creadas = 0;
  let existentes = 0;

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

    if (blacklist.some((b) => nombre.toUpperCase().includes(b))) {
      console.log(`   ⛔ Saltando sucursal excluida: ${nombre}`);
      continue;
    }

    const existe = await prisma.sucursal.findFirst({
      where: { nombre, clienteId: cliente.id },
    });

    if (existe) {
      existentes++;
      continue;
    }

    let zonaNombre = s['ZONA']?.trim().toUpperCase();
    if (!zonaNombre || zonaNombre === 'OTRAS') {
      zonaNombre = 'SIN ASIGNAR';
    }

    const zonaId = zonasMap.get(zonaNombre) || zonasMap.get('SIN ASIGNAR')!;

    const m2Raw = s['METROS_CUADRADOS']?.trim();
    const metrosCuadrados = m2Raw ? parseFloat(m2Raw) : null;

    await prisma.sucursal.create({
      data: {
        nombre,
        direccion: s['DIRECCION'] || 'Sin dirección',
        telefono: s['TELEFONO'] || null,
        clienteId: cliente.id,
        zonaId,
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

  // --- Técnicos desde CSV ---
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
      const tipoContrato =
        t['CONTRATACION']?.trim() === 'CONTRATO_MARCO' ? ('RELACION_DEPENDENCIA' as const) : null;

      const existe = await prisma.empleado.findFirst({
        where: {
          apellido,
          nombre,
          fechaEliminacion: null,
        },
      });

      if (existe) {
        await prisma.empleado.update({
          where: { id: existe.id },
          data: { esReferente, puesto, zonaId, telefono, tipoContrato },
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
          tipoContrato,
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

  // Resumen
  const totalSucursales = await prisma.sucursal.count({ where: { clienteId: cliente.id } });
  const totalZonas = await prisma.zona.count();
  const totalTecnicos = await prisma.empleado.count({
    where: { tipo: 'TECNICO', fechaEliminacion: null },
  });

  console.log('');
  console.log('📊 Resumen maestros:');
  console.log(`   - Zonas: ${totalZonas}`);
  console.log(`   - Sucursales Correo Argentino: ${totalSucursales}`);
  console.log(`   - Técnicos: ${totalTecnicos}`);
}

// -------------------------------------------------------
// Seed: Finanzas (Plan de Cuentas, Centros de Costo)
// -------------------------------------------------------

async function seedFinanzas() {
  console.log('💰 Configurando plan de cuentas y centros de costo...');

  // --- Plan de Cuentas Contables ---
  type CuentaSeed = {
    codigo: string;
    nombre: string;
    tipo: 'ACTIVO' | 'PASIVO' | 'PATRIMONIO' | 'INGRESO' | 'GASTO';
    nivel: number;
    parentCodigo?: string;
    imputable: boolean;
    descripcion?: string;
  };

  const cuentas: CuentaSeed[] = [
    // 1. ACTIVO
    { codigo: '1', nombre: 'Activo', tipo: 'ACTIVO', nivel: 1, imputable: false },
    {
      codigo: '1.1',
      nombre: 'Activo Corriente',
      tipo: 'ACTIVO',
      nivel: 2,
      parentCodigo: '1',
      imputable: false,
    },
    {
      codigo: '1.1.01',
      nombre: 'Caja y Bancos',
      tipo: 'ACTIVO',
      nivel: 3,
      parentCodigo: '1.1',
      imputable: true,
      descripcion: 'Efectivo y cuentas bancarias',
    },
    {
      codigo: '1.1.02',
      nombre: 'Inversiones Temporarias',
      tipo: 'ACTIVO',
      nivel: 3,
      parentCodigo: '1.1',
      imputable: true,
      descripcion: 'FCI, plazos fijos, etc.',
    },
    {
      codigo: '1.1.03',
      nombre: 'Creditos por Ventas',
      tipo: 'ACTIVO',
      nivel: 3,
      parentCodigo: '1.1',
      imputable: true,
      descripcion: 'Cuentas a cobrar de clientes',
    },
    {
      codigo: '1.1.04',
      nombre: 'Anticipos a Proveedores',
      tipo: 'ACTIVO',
      nivel: 3,
      parentCodigo: '1.1',
      imputable: true,
    },
    {
      codigo: '1.1.05',
      nombre: 'Creditos Fiscales',
      tipo: 'ACTIVO',
      nivel: 3,
      parentCodigo: '1.1',
      imputable: true,
      descripcion: 'IVA CF, retenciones a favor',
    },
    {
      codigo: '1.2',
      nombre: 'Activo No Corriente',
      tipo: 'ACTIVO',
      nivel: 2,
      parentCodigo: '1',
      imputable: false,
    },
    {
      codigo: '1.2.01',
      nombre: 'Vehiculos',
      tipo: 'ACTIVO',
      nivel: 3,
      parentCodigo: '1.2',
      imputable: true,
    },
    {
      codigo: '1.2.02',
      nombre: 'Herramientas y Equipos',
      tipo: 'ACTIVO',
      nivel: 3,
      parentCodigo: '1.2',
      imputable: true,
    },
    {
      codigo: '1.2.03',
      nombre: 'Muebles y Utiles',
      tipo: 'ACTIVO',
      nivel: 3,
      parentCodigo: '1.2',
      imputable: true,
    },
    {
      codigo: '1.2.04',
      nombre: 'Equipos Informaticos',
      tipo: 'ACTIVO',
      nivel: 3,
      parentCodigo: '1.2',
      imputable: true,
    },

    // 2. PASIVO
    { codigo: '2', nombre: 'Pasivo', tipo: 'PASIVO', nivel: 1, imputable: false },
    {
      codigo: '2.1',
      nombre: 'Pasivo Corriente',
      tipo: 'PASIVO',
      nivel: 2,
      parentCodigo: '2',
      imputable: false,
    },
    {
      codigo: '2.1.01',
      nombre: 'Proveedores',
      tipo: 'PASIVO',
      nivel: 3,
      parentCodigo: '2.1',
      imputable: true,
      descripcion: 'Cuentas a pagar a proveedores',
    },
    {
      codigo: '2.1.02',
      nombre: 'Sueldos a Pagar',
      tipo: 'PASIVO',
      nivel: 3,
      parentCodigo: '2.1',
      imputable: true,
    },
    {
      codigo: '2.1.03',
      nombre: 'Cargas Sociales a Pagar',
      tipo: 'PASIVO',
      nivel: 3,
      parentCodigo: '2.1',
      imputable: true,
    },
    {
      codigo: '2.1.04',
      nombre: 'Deudas Fiscales',
      tipo: 'PASIVO',
      nivel: 3,
      parentCodigo: '2.1',
      imputable: true,
      descripcion: 'IVA DF, IIBB, Ganancias',
    },
    {
      codigo: '2.1.05',
      nombre: 'Anticipos de Clientes',
      tipo: 'PASIVO',
      nivel: 3,
      parentCodigo: '2.1',
      imputable: true,
    },
    {
      codigo: '2.1.06',
      nombre: 'Prestamos Bancarios',
      tipo: 'PASIVO',
      nivel: 3,
      parentCodigo: '2.1',
      imputable: true,
    },

    // 3. PATRIMONIO
    { codigo: '3', nombre: 'Patrimonio Neto', tipo: 'PATRIMONIO', nivel: 1, imputable: false },
    {
      codigo: '3.1',
      nombre: 'Capital',
      tipo: 'PATRIMONIO',
      nivel: 2,
      parentCodigo: '3',
      imputable: false,
    },
    {
      codigo: '3.1.01',
      nombre: 'Capital Social',
      tipo: 'PATRIMONIO',
      nivel: 3,
      parentCodigo: '3.1',
      imputable: true,
    },
    {
      codigo: '3.1.02',
      nombre: 'Aportes de Socios',
      tipo: 'PATRIMONIO',
      nivel: 3,
      parentCodigo: '3.1',
      imputable: true,
    },
    {
      codigo: '3.2',
      nombre: 'Resultados',
      tipo: 'PATRIMONIO',
      nivel: 2,
      parentCodigo: '3',
      imputable: false,
    },
    {
      codigo: '3.2.01',
      nombre: 'Resultados Acumulados',
      tipo: 'PATRIMONIO',
      nivel: 3,
      parentCodigo: '3.2',
      imputable: true,
    },
    {
      codigo: '3.2.02',
      nombre: 'Resultado del Ejercicio',
      tipo: 'PATRIMONIO',
      nivel: 3,
      parentCodigo: '3.2',
      imputable: true,
    },
    {
      codigo: '3.3',
      nombre: 'Retiros',
      tipo: 'PATRIMONIO',
      nivel: 2,
      parentCodigo: '3',
      imputable: false,
    },
    {
      codigo: '3.3.01',
      nombre: 'Retiros de Socios',
      tipo: 'PATRIMONIO',
      nivel: 3,
      parentCodigo: '3.3',
      imputable: true,
      descripcion: 'Retiros personales de los socios',
    },

    // 4. INGRESOS
    { codigo: '4', nombre: 'Ingresos', tipo: 'INGRESO', nivel: 1, imputable: false },
    {
      codigo: '4.1',
      nombre: 'Ingresos Operativos',
      tipo: 'INGRESO',
      nivel: 2,
      parentCodigo: '4',
      imputable: false,
    },
    {
      codigo: '4.1.01',
      nombre: 'Cobros de Facturas',
      tipo: 'INGRESO',
      nivel: 3,
      parentCodigo: '4.1',
      imputable: true,
      descripcion: 'Cobros por servicios facturados',
    },
    {
      codigo: '4.1.02',
      nombre: 'Certificados de Obra',
      tipo: 'INGRESO',
      nivel: 3,
      parentCodigo: '4.1',
      imputable: true,
      descripcion: 'Cobros por certificados aprobados',
    },
    {
      codigo: '4.1.03',
      nombre: 'Servicios de Mantenimiento',
      tipo: 'INGRESO',
      nivel: 3,
      parentCodigo: '4.1',
      imputable: true,
    },
    {
      codigo: '4.2',
      nombre: 'Ingresos Financieros',
      tipo: 'INGRESO',
      nivel: 2,
      parentCodigo: '4',
      imputable: false,
    },
    {
      codigo: '4.2.01',
      nombre: 'Intereses Ganados',
      tipo: 'INGRESO',
      nivel: 3,
      parentCodigo: '4.2',
      imputable: true,
      descripcion: 'Intereses bancarios y de inversiones',
    },
    {
      codigo: '4.2.02',
      nombre: 'Rendimiento FCI',
      tipo: 'INGRESO',
      nivel: 3,
      parentCodigo: '4.2',
      imputable: true,
      descripcion: 'Rendimiento de fondos comunes',
    },
    {
      codigo: '4.2.03',
      nombre: 'Diferencias de Cambio',
      tipo: 'INGRESO',
      nivel: 3,
      parentCodigo: '4.2',
      imputable: true,
    },
    {
      codigo: '4.3',
      nombre: 'Otros Ingresos',
      tipo: 'INGRESO',
      nivel: 2,
      parentCodigo: '4',
      imputable: false,
    },
    {
      codigo: '4.3.01',
      nombre: 'Reintegros',
      tipo: 'INGRESO',
      nivel: 3,
      parentCodigo: '4.3',
      imputable: true,
      descripcion: 'Devoluciones y reintegros recibidos',
    },
    {
      codigo: '4.3.02',
      nombre: 'Recupero de Seguros',
      tipo: 'INGRESO',
      nivel: 3,
      parentCodigo: '4.3',
      imputable: true,
    },
    {
      codigo: '4.3.03',
      nombre: 'Otros Ingresos Varios',
      tipo: 'INGRESO',
      nivel: 3,
      parentCodigo: '4.3',
      imputable: true,
    },

    // 5. GASTOS
    { codigo: '5', nombre: 'Gastos', tipo: 'GASTO', nivel: 1, imputable: false },
    {
      codigo: '5.1',
      nombre: 'Costos Directos de Obra',
      tipo: 'GASTO',
      nivel: 2,
      parentCodigo: '5',
      imputable: false,
    },
    {
      codigo: '5.1.01',
      nombre: 'Materiales',
      tipo: 'GASTO',
      nivel: 3,
      parentCodigo: '5.1',
      imputable: true,
      descripcion: 'Materiales para obras',
    },
    {
      codigo: '5.1.02',
      nombre: 'Mano de Obra Directa',
      tipo: 'GASTO',
      nivel: 3,
      parentCodigo: '5.1',
      imputable: true,
      descripcion: 'Jornales de tecnicos en obra',
    },
    {
      codigo: '5.1.03',
      nombre: 'Subcontratistas',
      tipo: 'GASTO',
      nivel: 3,
      parentCodigo: '5.1',
      imputable: true,
    },
    {
      codigo: '5.1.04',
      nombre: 'Alquiler de Equipos',
      tipo: 'GASTO',
      nivel: 3,
      parentCodigo: '5.1',
      imputable: true,
    },
    {
      codigo: '5.2',
      nombre: 'Gastos Operativos',
      tipo: 'GASTO',
      nivel: 2,
      parentCodigo: '5',
      imputable: false,
    },
    {
      codigo: '5.2.01',
      nombre: 'Combustible y Lubricantes',
      tipo: 'GASTO',
      nivel: 3,
      parentCodigo: '5.2',
      imputable: true,
    },
    {
      codigo: '5.2.02',
      nombre: 'Viaticos y Movilidad',
      tipo: 'GASTO',
      nivel: 3,
      parentCodigo: '5.2',
      imputable: true,
    },
    {
      codigo: '5.2.03',
      nombre: 'Mantenimiento de Herramientas',
      tipo: 'GASTO',
      nivel: 3,
      parentCodigo: '5.2',
      imputable: true,
    },
    {
      codigo: '5.2.04',
      nombre: 'Mantenimiento de Vehiculos',
      tipo: 'GASTO',
      nivel: 3,
      parentCodigo: '5.2',
      imputable: true,
    },
    {
      codigo: '5.2.05',
      nombre: 'Seguros Vehiculos',
      tipo: 'GASTO',
      nivel: 3,
      parentCodigo: '5.2',
      imputable: true,
    },
    {
      codigo: '5.2.06',
      nombre: 'Seguros ART/AP',
      tipo: 'GASTO',
      nivel: 3,
      parentCodigo: '5.2',
      imputable: true,
    },
    {
      codigo: '5.3',
      nombre: 'Gastos de Personal',
      tipo: 'GASTO',
      nivel: 2,
      parentCodigo: '5',
      imputable: false,
    },
    {
      codigo: '5.3.01',
      nombre: 'Sueldos y Jornales',
      tipo: 'GASTO',
      nivel: 3,
      parentCodigo: '5.3',
      imputable: true,
    },
    {
      codigo: '5.3.02',
      nombre: 'Cargas Sociales',
      tipo: 'GASTO',
      nivel: 3,
      parentCodigo: '5.3',
      imputable: true,
    },
    {
      codigo: '5.3.03',
      nombre: 'Indemnizaciones',
      tipo: 'GASTO',
      nivel: 3,
      parentCodigo: '5.3',
      imputable: true,
    },
    {
      codigo: '5.3.04',
      nombre: 'Capacitacion',
      tipo: 'GASTO',
      nivel: 3,
      parentCodigo: '5.3',
      imputable: true,
    },
    {
      codigo: '5.4',
      nombre: 'Gastos Administrativos',
      tipo: 'GASTO',
      nivel: 2,
      parentCodigo: '5',
      imputable: false,
    },
    {
      codigo: '5.4.01',
      nombre: 'Alquiler de Oficina',
      tipo: 'GASTO',
      nivel: 3,
      parentCodigo: '5.4',
      imputable: true,
    },
    {
      codigo: '5.4.02',
      nombre: 'Servicios',
      tipo: 'GASTO',
      nivel: 3,
      parentCodigo: '5.4',
      imputable: true,
      descripcion: 'Luz, gas, telefono, internet',
    },
    {
      codigo: '5.4.03',
      nombre: 'Papeleria e Insumos',
      tipo: 'GASTO',
      nivel: 3,
      parentCodigo: '5.4',
      imputable: true,
    },
    {
      codigo: '5.4.04',
      nombre: 'Software y Licencias',
      tipo: 'GASTO',
      nivel: 3,
      parentCodigo: '5.4',
      imputable: true,
    },
    {
      codigo: '5.4.05',
      nombre: 'Comunicaciones',
      tipo: 'GASTO',
      nivel: 3,
      parentCodigo: '5.4',
      imputable: true,
    },
    {
      codigo: '5.4.06',
      nombre: 'Honorarios Profesionales',
      tipo: 'GASTO',
      nivel: 3,
      parentCodigo: '5.4',
      imputable: true,
      descripcion: 'Contador, abogado, etc.',
    },
    {
      codigo: '5.5',
      nombre: 'Gastos Financieros',
      tipo: 'GASTO',
      nivel: 2,
      parentCodigo: '5',
      imputable: false,
    },
    {
      codigo: '5.5.01',
      nombre: 'Comisiones Bancarias',
      tipo: 'GASTO',
      nivel: 3,
      parentCodigo: '5.5',
      imputable: true,
    },
    {
      codigo: '5.5.02',
      nombre: 'Intereses Pagados',
      tipo: 'GASTO',
      nivel: 3,
      parentCodigo: '5.5',
      imputable: true,
    },
    {
      codigo: '5.5.03',
      nombre: 'Impuesto Debitos/Creditos',
      tipo: 'GASTO',
      nivel: 3,
      parentCodigo: '5.5',
      imputable: true,
    },
    {
      codigo: '5.6',
      nombre: 'Impuestos y Tasas',
      tipo: 'GASTO',
      nivel: 2,
      parentCodigo: '5',
      imputable: false,
    },
    {
      codigo: '5.6.01',
      nombre: 'IVA Debito Fiscal',
      tipo: 'GASTO',
      nivel: 3,
      parentCodigo: '5.6',
      imputable: true,
    },
    {
      codigo: '5.6.02',
      nombre: 'Ingresos Brutos',
      tipo: 'GASTO',
      nivel: 3,
      parentCodigo: '5.6',
      imputable: true,
    },
    {
      codigo: '5.6.03',
      nombre: 'Impuesto a las Ganancias',
      tipo: 'GASTO',
      nivel: 3,
      parentCodigo: '5.6',
      imputable: true,
    },
    {
      codigo: '5.6.04',
      nombre: 'Monotributo',
      tipo: 'GASTO',
      nivel: 3,
      parentCodigo: '5.6',
      imputable: true,
    },
    {
      codigo: '5.6.05',
      nombre: 'Otros Impuestos y Tasas',
      tipo: 'GASTO',
      nivel: 3,
      parentCodigo: '5.6',
      imputable: true,
    },
  ];

  // First pass: create all cuentas without parentId
  const codigoToId = new Map<string, number>();

  for (const c of cuentas) {
    const cuenta = await prisma.cuentaContable.upsert({
      where: { codigo: c.codigo },
      update: {
        nombre: c.nombre,
        tipo: c.tipo,
        nivel: c.nivel,
        imputable: c.imputable,
        descripcion: c.descripcion ?? null,
      },
      create: {
        codigo: c.codigo,
        nombre: c.nombre,
        tipo: c.tipo,
        nivel: c.nivel,
        imputable: c.imputable,
        descripcion: c.descripcion ?? null,
      },
    });
    codigoToId.set(c.codigo, cuenta.id);
  }

  // Second pass: set parentId relationships
  for (const c of cuentas) {
    if (c.parentCodigo) {
      const parentId = codigoToId.get(c.parentCodigo);
      const id = codigoToId.get(c.codigo);
      if (parentId && id) {
        await prisma.cuentaContable.update({
          where: { id },
          data: { parentId },
        });
      }
    }
  }

  console.log(`✅ ${cuentas.length} cuentas contables configuradas.`);

  // --- Centros de Costo ---
  type CentroCostoSeed = {
    codigo: string;
    nombre: string;
    parentCodigo?: string;
    descripcion?: string;
  };

  const centrosCosto: CentroCostoSeed[] = [
    { codigo: 'ADM', nombre: 'Administracion', descripcion: 'Gastos administrativos generales' },
    { codigo: 'OP', nombre: 'Operaciones', descripcion: 'Operaciones de campo' },
    {
      codigo: 'OP.ZN',
      nombre: 'Zona Norte',
      parentCodigo: 'OP',
      descripcion: 'Operaciones Zona Norte',
    },
    {
      codigo: 'OP.ZS',
      nombre: 'Zona Sur',
      parentCodigo: 'OP',
      descripcion: 'Operaciones Zona Sur',
    },
    {
      codigo: 'OP.ZO',
      nombre: 'Zona Oeste',
      parentCodigo: 'OP',
      descripcion: 'Operaciones Zona Oeste',
    },
    { codigo: 'COM', nombre: 'Comercial', descripcion: 'Area comercial y ventas' },
    { codigo: 'LOG', nombre: 'Logistica', descripcion: 'Deposito, flota, distribucion' },
  ];

  const ccCodigoToId = new Map<string, number>();

  for (const cc of centrosCosto) {
    const centro = await prisma.centroCosto.upsert({
      where: { codigo: cc.codigo },
      update: { nombre: cc.nombre, descripcion: cc.descripcion ?? null },
      create: { codigo: cc.codigo, nombre: cc.nombre, descripcion: cc.descripcion ?? null },
    });
    ccCodigoToId.set(cc.codigo, centro.id);
  }

  // Set parent relationships
  for (const cc of centrosCosto) {
    if (cc.parentCodigo) {
      const parentId = ccCodigoToId.get(cc.parentCodigo);
      const id = ccCodigoToId.get(cc.codigo);
      if (parentId && id) {
        await prisma.centroCosto.update({
          where: { id },
          data: { parentId },
        });
      }
    }
  }

  console.log(`✅ ${centrosCosto.length} centros de costo configurados.`);

  // Resumen
  const totalCuentas = await prisma.cuentaContable.count();
  const totalCentros = await prisma.centroCosto.count();

  console.log('');
  console.log('📊 Resumen finanzas:');
  console.log(`   - Cuentas contables: ${totalCuentas}`);
  console.log(`   - Centros de costo: ${totalCentros}`);
}

// -------------------------------------------------------
// Seed: Compras (Proveedores de ejemplo)
// -------------------------------------------------------

async function seedCompras() {
  console.log('🛒 Creando proveedores de ejemplo...');

  const proveedores = [
    {
      razonSocial: 'Materiales del Litoral SRL',
      cuit: '30-71234567-8',
      condicionIva: 'RESPONSABLE_INSCRIPTO' as const,
      telefono: '0342-4551234',
      email: 'ventas@materialeslitoral.com',
      direccion: 'Ruta 11 km 3, Santa Fe',
      contactoNombre: 'Carlos Mendez',
      contactoTelefono: '342-5001234',
    },
    {
      razonSocial: 'Ferreteria San Jose',
      cuit: '20-28456789-3',
      condicionIva: 'MONOTRIBUTO' as const,
      telefono: '011-4567-8901',
      email: 'info@ferreteriasanjose.com.ar',
      direccion: 'Av. Rivadavia 4500, CABA',
      contactoNombre: 'Jose Ramirez',
    },
    {
      razonSocial: 'Distribuidora Norte SA',
      cuit: '30-70987654-1',
      condicionIva: 'RESPONSABLE_INSCRIPTO' as const,
      telefono: '0362-4445566',
      email: 'compras@distribuidoranorte.com',
      direccion: 'Av. Italia 1200, Resistencia, Chaco',
      contactoNombre: 'Maria Lopez',
      contactoTelefono: '362-4112233',
    },
    {
      razonSocial: 'Electricidad Total SRL',
      cuit: '30-71567890-5',
      condicionIva: 'RESPONSABLE_INSCRIPTO' as const,
      telefono: '0341-4889900',
      email: 'pedidos@electricidadtotal.com',
      direccion: 'Bv. Oroño 2500, Rosario, Santa Fe',
    },
  ];

  for (const p of proveedores) {
    await prisma.proveedor.upsert({
      where: { cuit: p.cuit },
      update: {},
      create: p,
    });
  }

  const total = await prisma.proveedor.count({ where: { fechaEliminacion: null } });
  console.log(`✅ ${total} proveedores configurados.`);
}

// -------------------------------------------------------
// Seed: Ejemplos (Datos de ejemplo para todos los módulos)
// -------------------------------------------------------

async function seedEjemplos() {
  console.log('📦 Creando datos de ejemplo para todos los módulos...\n');

  // ── Pre-requisitos: obtener admin user y cliente ──
  const adminUser = await prisma.usuario.findFirst({ where: { email: 'admin@bauman.com.ar' } });
  if (!adminUser) {
    console.error('❌ Primero ejecutá seed con módulo "seguridad". Necesitamos al usuario admin.');
    return;
  }

  const cliente = await prisma.cliente.findFirst({ where: { cuit: '30546662428' } });
  if (!cliente) {
    console.error(
      '❌ Primero ejecutá seed con módulo "maestros". Necesitamos al cliente Correo Argentino.'
    );
    return;
  }

  // ── 1. BANCOS ──────────────────────────────────────────
  console.log('🏦 Creando bancos...');

  const bancosData = [
    { codigo: '011', nombre: 'Banco de la Nación Argentina', nombreCorto: 'Banco Nación' },
    { codigo: '007', nombre: 'Banco de Galicia y Buenos Aires', nombreCorto: 'Banco Galicia' },
    {
      codigo: '014',
      nombre: 'Banco de la Provincia de Buenos Aires',
      nombreCorto: 'Banco Provincia',
    },
    { codigo: '017', nombre: 'BBVA Argentina', nombreCorto: 'BBVA' },
    { codigo: '072', nombre: 'Banco Santander Argentina', nombreCorto: 'Santander' },
  ];

  const bancosMap = new Map<string, number>();
  for (const b of bancosData) {
    const banco = await prisma.banco.upsert({
      where: { codigo: b.codigo },
      update: {},
      create: b,
    });
    bancosMap.set(b.codigo, banco.id);
  }
  console.log(`✅ ${bancosData.length} bancos creados.`);

  // ── 2. CUENTAS FINANCIERAS ─────────────────────────────
  console.log('💳 Creando cuentas financieras...');

  const cuentasData = [
    {
      nombre: 'Caja Chica Oficina',
      tipo: 'CAJA_CHICA' as const,
      saldoInicial: 500000,
      saldoActual: 342150,
    },
    {
      nombre: 'Banco Nación CC',
      tipo: 'CUENTA_CORRIENTE' as const,
      bancoCodigo: '011',
      numeroCuenta: '4050-002881/00',
      cbu: '0110404830040500288100',
      alias: 'BAUMAN.NACION.CC',
      saldoInicial: 5000000,
      saldoActual: 8750320,
    },
    {
      nombre: 'Galicia CA',
      tipo: 'CAJA_AHORRO' as const,
      bancoCodigo: '007',
      numeroCuenta: '4019838-3 080-1',
      cbu: '0070080020004019838310',
      alias: 'BAUMAN.GALICIA.CA',
      saldoInicial: 2000000,
      saldoActual: 3215800,
    },
    {
      nombre: 'Mercado Pago',
      tipo: 'BILLETERA_VIRTUAL' as const,
      saldoInicial: 0,
      saldoActual: 185400,
    },
    {
      nombre: 'Plazo Fijo Nación - Mar 2025',
      tipo: 'INVERSION' as const,
      bancoCodigo: '011',
      saldoInicial: 3000000,
      saldoActual: 3000000,
      tipoInversion: 'PLAZO_FIJO',
      tasaAnual: 0.38,
      fechaVencimiento: new Date('2025-03-28'),
    },
    {
      nombre: 'FCI Galicia Renta Fija',
      tipo: 'INVERSION' as const,
      bancoCodigo: '007',
      saldoInicial: 1500000,
      saldoActual: 1623450,
      tipoInversion: 'FCI',
      tasaAnual: 0.42,
    },
  ];

  const cuentasFinMap = new Map<string, number>();
  for (const c of cuentasData) {
    const existing = await prisma.cuentaFinanciera.findFirst({ where: { nombre: c.nombre } });
    if (existing) {
      cuentasFinMap.set(c.nombre, existing.id);
      continue;
    }
    const cuenta = await prisma.cuentaFinanciera.create({
      data: {
        nombre: c.nombre,
        tipo: c.tipo,
        bancoId: c.bancoCodigo ? bancosMap.get(c.bancoCodigo) : undefined,
        numeroCuenta: ((c as Record<string, unknown>).numeroCuenta as string | undefined) ?? null,
        cbu: ((c as Record<string, unknown>).cbu as string | undefined) ?? null,
        alias: ((c as Record<string, unknown>).alias as string | undefined) ?? null,
        saldoInicial: c.saldoInicial,
        saldoActual: c.saldoActual,
        tipoInversion: ((c as Record<string, unknown>).tipoInversion as string | undefined) ?? null,
        tasaAnual: ((c as Record<string, unknown>).tasaAnual as number | undefined) ?? null,
        fechaVencimiento:
          ((c as Record<string, unknown>).fechaVencimiento as Date | undefined) ?? null,
      },
    });
    cuentasFinMap.set(c.nombre, cuenta.id);
  }
  console.log(`✅ ${cuentasData.length} cuentas financieras creadas.`);

  // ── 3. VEHICULOS ───────────────────────────────────────
  console.log('🚗 Creando vehículos...');

  const zonaGral = await prisma.zona.findFirst({ where: { nombre: { not: 'SIN ASIGNAR' } } });

  const vehiculosData = [
    {
      patente: 'AB123CD',
      marca: 'Toyota',
      modelo: 'Hilux',
      anio: 2022,
      tipo: 'Camioneta',
      kilometros: 45000,
      estado: 'ACTIVO',
    },
    {
      patente: 'AC456EF',
      marca: 'Renault',
      modelo: 'Kangoo',
      anio: 2021,
      tipo: 'Utilitario',
      kilometros: 62000,
      estado: 'ACTIVO',
    },
    {
      patente: 'AD789GH',
      marca: 'Fiat',
      modelo: 'Fiorino',
      anio: 2020,
      tipo: 'Utilitario',
      kilometros: 89000,
      estado: 'TALLER',
    },
    {
      patente: 'AE012IJ',
      marca: 'Ford',
      modelo: 'Ranger',
      anio: 2023,
      tipo: 'Camioneta',
      kilometros: 18000,
      estado: 'ACTIVO',
    },
    {
      patente: 'AF345KL',
      marca: 'Volkswagen',
      modelo: 'Amarok',
      anio: 2019,
      tipo: 'Camioneta',
      kilometros: 120000,
      estado: 'FUERA_SERVICIO',
    },
  ];

  for (const v of vehiculosData) {
    await prisma.vehiculo.upsert({
      where: { patente: v.patente },
      update: {},
      create: {
        ...v,
        zonaId: zonaGral?.id,
        fechaVencimientoVTV: new Date(Date.now() + Math.random() * 365 * 24 * 60 * 60 * 1000),
      },
    });
  }
  console.log(`✅ ${vehiculosData.length} vehículos creados.`);

  // ── 4. MATERIALES ──────────────────────────────────────
  console.log('📦 Creando materiales...');

  const materialesData = [
    {
      codigoArticulo: 'MAT-001',
      nombre: 'Cemite portland',
      presentacion: 'Bolsa 50kg',
      unidadMedida: 'Bolsa',
      categoria: 'Construccion',
      precioCosto: 8500,
      precioVenta: 12750,
    },
    {
      codigoArticulo: 'MAT-002',
      nombre: 'Cable unipolar 2.5mm',
      presentacion: 'Rollo 100m',
      unidadMedida: 'Rollo',
      categoria: 'Electricidad',
      precioCosto: 45000,
      precioVenta: 67500,
    },
    {
      codigoArticulo: 'MAT-003',
      nombre: 'Caño PVC 110mm',
      presentacion: 'Unidad 4m',
      unidadMedida: 'Unidad',
      categoria: 'Sanitarios',
      precioCosto: 12000,
      precioVenta: 18000,
    },
    {
      codigoArticulo: 'MAT-004',
      nombre: 'Llave termica bipolar 20A',
      presentacion: 'Unidad',
      unidadMedida: 'Unidad',
      categoria: 'Electricidad',
      precioCosto: 15000,
      precioVenta: 22500,
    },
    {
      codigoArticulo: 'MAT-005',
      nombre: 'Pintura latex interior',
      presentacion: 'Balde 20L',
      unidadMedida: 'Balde',
      categoria: 'Terminaciones',
      precioCosto: 35000,
      precioVenta: 52500,
    },
    {
      codigoArticulo: 'MAT-006',
      nombre: 'Arena fina',
      presentacion: 'Metro cubico',
      unidadMedida: 'm3',
      categoria: 'Construccion',
      precioCosto: 25000,
      precioVenta: 37500,
    },
    {
      codigoArticulo: 'MAT-007',
      nombre: 'Hierro 8mm',
      presentacion: 'Barra 12m',
      unidadMedida: 'Barra',
      categoria: 'Construccion',
      precioCosto: 9800,
      precioVenta: 14700,
    },
    {
      codigoArticulo: 'MAT-008',
      nombre: 'Gas refrigerante R410A',
      presentacion: 'Garrafa 11.3kg',
      unidadMedida: 'Garrafa',
      categoria: 'Refrigeracion',
      precioCosto: 95000,
      precioVenta: 142500,
    },
  ];

  for (const m of materialesData) {
    const rentabilidad = ((m.precioVenta - m.precioCosto) / m.precioCosto) * 100;
    await prisma.material.upsert({
      where: { codigoArticulo: m.codigoArticulo },
      update: {},
      create: {
        codigoArticulo: m.codigoArticulo,
        nombre: m.nombre,
        presentacion: m.presentacion,
        unidadMedida: m.unidadMedida,
        categoria: m.categoria,
        precioCosto: m.precioCosto,
        precioVenta: m.precioVenta,
        porcentajeRentabilidad: rentabilidad,
        stockMinimo: 5,
      },
    });
  }
  console.log(`✅ ${materialesData.length} materiales creados.`);

  // ── 5. MOVIMIENTOS ─────────────────────────────────────
  console.log('💸 Creando movimientos...');

  // Obtener IDs de cuentas contables para vincular
  const ctaCreditosVentas = await prisma.cuentaContable.findFirst({ where: { codigo: '1.1.03' } });
  const ctaProveedores = await prisma.cuentaContable.findFirst({ where: { codigo: '2.1.01' } });
  const ctaCobroFacturas = await prisma.cuentaContable.findFirst({ where: { codigo: '4.1.01' } });
  const ctaServManto = await prisma.cuentaContable.findFirst({ where: { codigo: '4.1.03' } });
  const ctaInteresesGanados = await prisma.cuentaContable.findFirst({
    where: { codigo: '4.2.01' },
  });
  const ctaMateriales = await prisma.cuentaContable.findFirst({ where: { codigo: '5.1.01' } });
  const ctaManoObra = await prisma.cuentaContable.findFirst({ where: { codigo: '5.1.02' } });
  const ctaCombustible = await prisma.cuentaContable.findFirst({ where: { codigo: '5.2.01' } });
  const ctaViaticos = await prisma.cuentaContable.findFirst({ where: { codigo: '5.2.02' } });
  const ctaSueldos = await prisma.cuentaContable.findFirst({ where: { codigo: '5.3.01' } });
  const ctaCargasSociales = await prisma.cuentaContable.findFirst({ where: { codigo: '5.3.02' } });
  const ctaAlquiler = await prisma.cuentaContable.findFirst({ where: { codigo: '5.4.01' } });
  const ctaServicios = await prisma.cuentaContable.findFirst({ where: { codigo: '5.4.02' } });
  const ctaComisionesBanc = await prisma.cuentaContable.findFirst({ where: { codigo: '5.5.01' } });

  // Centros de costo
  const ccAdm = await prisma.centroCosto.findFirst({ where: { codigo: 'ADM' } });
  const ccOp = await prisma.centroCosto.findFirst({ where: { codigo: 'OP' } });

  const cuentaNacionId = cuentasFinMap.get('Banco Nación CC') ?? 0;
  const cuentaGaliciaId = cuentasFinMap.get('Galicia CA') ?? 0;
  const cuentaCajaId = cuentasFinMap.get('Caja Chica Oficina') ?? 0;

  if (!cuentaNacionId || !cuentaGaliciaId || !cuentaCajaId) {
    console.error('❌ No se encontraron cuentas financieras. Ejecutá el seed completo.');
    return;
  }

  // Helper para crear movimiento
  let movIdx = 0;
  const crearMov = async (data: {
    tipo: 'INGRESO' | 'EGRESO';
    medioPago:
      | 'EFECTIVO'
      | 'TRANSFERENCIA'
      | 'CHEQUE'
      | 'ECHEQ'
      | 'TARJETA_DEBITO'
      | 'TARJETA_CREDITO'
      | 'MERCADOPAGO';
    monto: number;
    descripcion: string;
    fechaMovimiento: Date;
    cuentaId: number;
    cuentaContableId?: number;
    centroCostoId?: number;
    estado?: 'PENDIENTE' | 'CONFIRMADO' | 'CONCILIADO' | 'ANULADO';
  }) => {
    movIdx++;
    const codigo = `SEED-MOV-${String(movIdx).padStart(4, '0')}`;
    const existing = await prisma.movimiento.findUnique({ where: { codigo } });
    if (existing) return existing;
    return prisma.movimiento.create({
      data: {
        codigo,
        tipo: data.tipo,
        medioPago: data.medioPago,
        monto: data.monto,
        descripcion: data.descripcion,
        fechaMovimiento: data.fechaMovimiento,
        cuentaId: data.cuentaId,
        cuentaContableId: data.cuentaContableId ?? null,
        centroCostoId: data.centroCostoId ?? null,
        estado: data.estado ?? 'CONFIRMADO',
        registradoPorId: adminUser.id,
      },
    });
  };

  // --- Ingresos operativos ---
  const cobro1 = await crearMov({
    tipo: 'INGRESO',
    medioPago: 'TRANSFERENCIA',
    monto: 2500000,
    descripcion: 'Cobro Factura A-0001-00000012 - Correo Argentino',
    fechaMovimiento: new Date('2025-01-10'),
    cuentaId: cuentaNacionId,
    cuentaContableId: ctaCobroFacturas?.id,
    centroCostoId: ccOp?.id,
  });
  await crearMov({
    tipo: 'INGRESO',
    medioPago: 'TRANSFERENCIA',
    monto: 1850000,
    descripcion: 'Cobro Factura A-0001-00000013 - Correo Argentino',
    fechaMovimiento: new Date('2025-01-20'),
    cuentaId: cuentaNacionId,
    cuentaContableId: ctaCobroFacturas?.id,
    centroCostoId: ccOp?.id,
  });
  await crearMov({
    tipo: 'INGRESO',
    medioPago: 'TRANSFERENCIA',
    monto: 980000,
    descripcion: 'Cobro servicio mantenimiento preventivo enero',
    fechaMovimiento: new Date('2025-01-25'),
    cuentaId: cuentaGaliciaId,
    cuentaContableId: ctaServManto?.id,
    centroCostoId: ccOp?.id,
  });
  await crearMov({
    tipo: 'INGRESO',
    medioPago: 'TRANSFERENCIA',
    monto: 3200000,
    descripcion: 'Cobro certificado obra OBR-00015',
    fechaMovimiento: new Date('2025-02-05'),
    cuentaId: cuentaNacionId,
    cuentaContableId: ctaCobroFacturas?.id,
    centroCostoId: ccOp?.id,
  });
  const cobro5 = await crearMov({
    tipo: 'INGRESO',
    medioPago: 'TRANSFERENCIA',
    monto: 1450000,
    descripcion: 'Cobro parcial Factura A-0001-00000018',
    fechaMovimiento: new Date('2025-02-10'),
    cuentaId: cuentaNacionId,
    cuentaContableId: ctaCreditosVentas?.id,
    centroCostoId: ccOp?.id,
  });

  // --- Ingresos financieros ---
  await crearMov({
    tipo: 'INGRESO',
    medioPago: 'TRANSFERENCIA',
    monto: 95000,
    descripcion: 'Intereses plazo fijo Nación vto 28/01',
    fechaMovimiento: new Date('2025-01-28'),
    cuentaId: cuentaNacionId,
    cuentaContableId: ctaInteresesGanados?.id,
    centroCostoId: ccAdm?.id,
  });
  await crearMov({
    tipo: 'INGRESO',
    medioPago: 'TRANSFERENCIA',
    monto: 123450,
    descripcion: 'Rendimiento FCI Galicia Renta Fija enero',
    fechaMovimiento: new Date('2025-01-31'),
    cuentaId: cuentaGaliciaId,
    cuentaContableId: ctaInteresesGanados?.id,
    centroCostoId: ccAdm?.id,
  });

  // --- Egresos operativos ---
  await crearMov({
    tipo: 'EGRESO',
    medioPago: 'TRANSFERENCIA',
    monto: 680000,
    descripcion: 'Compra materiales - Materiales del Litoral SRL',
    fechaMovimiento: new Date('2025-01-08'),
    cuentaId: cuentaNacionId,
    cuentaContableId: ctaMateriales?.id,
    centroCostoId: ccOp?.id,
  });
  await crearMov({
    tipo: 'EGRESO',
    medioPago: 'TRANSFERENCIA',
    monto: 450000,
    descripcion: 'Compra materiales eléctricos - Electricidad Total SRL',
    fechaMovimiento: new Date('2025-01-15'),
    cuentaId: cuentaNacionId,
    cuentaContableId: ctaMateriales?.id,
    centroCostoId: ccOp?.id,
  });
  await crearMov({
    tipo: 'EGRESO',
    medioPago: 'EFECTIVO',
    monto: 85000,
    descripcion: 'Combustible flota semana 03/01-10/01',
    fechaMovimiento: new Date('2025-01-10'),
    cuentaId: cuentaCajaId,
    cuentaContableId: ctaCombustible?.id,
    centroCostoId: ccOp?.id,
  });
  await crearMov({
    tipo: 'EGRESO',
    medioPago: 'EFECTIVO',
    monto: 45000,
    descripcion: 'Viáticos técnicos Zona Norte',
    fechaMovimiento: new Date('2025-01-12'),
    cuentaId: cuentaCajaId,
    cuentaContableId: ctaViaticos?.id,
    centroCostoId: ccOp?.id,
  });

  // --- Egresos de personal ---
  await crearMov({
    tipo: 'EGRESO',
    medioPago: 'TRANSFERENCIA',
    monto: 4200000,
    descripcion: 'Sueldos enero 2025',
    fechaMovimiento: new Date('2025-01-31'),
    cuentaId: cuentaNacionId,
    cuentaContableId: ctaSueldos?.id,
    centroCostoId: ccAdm?.id,
  });
  await crearMov({
    tipo: 'EGRESO',
    medioPago: 'TRANSFERENCIA',
    monto: 1680000,
    descripcion: 'Cargas sociales enero 2025 (AFIP)',
    fechaMovimiento: new Date('2025-02-07'),
    cuentaId: cuentaNacionId,
    cuentaContableId: ctaCargasSociales?.id,
    centroCostoId: ccAdm?.id,
  });

  // --- Egresos administrativos ---
  await crearMov({
    tipo: 'EGRESO',
    medioPago: 'TRANSFERENCIA',
    monto: 350000,
    descripcion: 'Alquiler oficina febrero 2025',
    fechaMovimiento: new Date('2025-02-01'),
    cuentaId: cuentaNacionId,
    cuentaContableId: ctaAlquiler?.id,
    centroCostoId: ccAdm?.id,
  });
  await crearMov({
    tipo: 'EGRESO',
    medioPago: 'TRANSFERENCIA',
    monto: 125000,
    descripcion: 'Servicios: luz, gas, internet, teléfono',
    fechaMovimiento: new Date('2025-02-05'),
    cuentaId: cuentaNacionId,
    cuentaContableId: ctaServicios?.id,
    centroCostoId: ccAdm?.id,
  });
  await crearMov({
    tipo: 'EGRESO',
    medioPago: 'TRANSFERENCIA',
    monto: 8500,
    descripcion: 'Comisiones bancarias Nación enero',
    fechaMovimiento: new Date('2025-01-31'),
    cuentaId: cuentaNacionId,
    cuentaContableId: ctaComisionesBanc?.id,
    centroCostoId: ccAdm?.id,
  });

  // --- Movimientos pendientes y anulados ---
  await crearMov({
    tipo: 'EGRESO',
    medioPago: 'TRANSFERENCIA',
    monto: 280000,
    descripcion: 'Subcontratista pintura - Pendiente aprobación',
    fechaMovimiento: new Date('2025-02-08'),
    cuentaId: cuentaNacionId,
    cuentaContableId: ctaManoObra?.id,
    centroCostoId: ccOp?.id,
    estado: 'PENDIENTE',
  });
  await crearMov({
    tipo: 'EGRESO',
    medioPago: 'TRANSFERENCIA',
    monto: 150000,
    descripcion: 'Compra herramientas - ANULADO (proveedor no entregó)',
    fechaMovimiento: new Date('2025-01-22'),
    cuentaId: cuentaNacionId,
    cuentaContableId: ctaMateriales?.id,
    centroCostoId: ccOp?.id,
    estado: 'ANULADO',
  });
  await crearMov({
    tipo: 'INGRESO',
    medioPago: 'TRANSFERENCIA',
    monto: 750000,
    descripcion: 'Cobro pendiente conciliación - Correo Argentino',
    fechaMovimiento: new Date('2025-02-12'),
    cuentaId: cuentaGaliciaId,
    cuentaContableId: ctaCreditosVentas?.id,
    centroCostoId: ccOp?.id,
    estado: 'PENDIENTE',
  });

  console.log(`✅ ${movIdx} movimientos creados.`);

  // ── 6. FACTURAS DE PROVEEDOR ───────────────────────────
  console.log('📄 Creando facturas de proveedor...');

  const proveedores = await prisma.proveedor.findMany({ where: { fechaEliminacion: null } });
  if (proveedores.length === 0) {
    console.warn('⚠️ No hay proveedores. Ejecutá seed con módulo "compras" primero.');
  } else {
    const prov1 = proveedores[0]; // Materiales del Litoral
    const prov2 = proveedores[1]; // Ferreteria San Jose
    const prov3 = proveedores[2]; // Distribuidora Norte
    const prov4 = proveedores[3]; // Electricidad Total

    // Helper para crear factura proveedor
    const crearFactProv = async (data: {
      proveedorId: number;
      tipoComprobante: 'FACTURA_A' | 'FACTURA_B' | 'FACTURA_C';
      puntoVenta: number;
      numeroComprobante: string;
      fechaEmision: Date;
      fechaVencimiento: Date;
      subtotal: number;
      iva21: number;
      total: number;
      estado: 'PENDIENTE' | 'PAGO_PARCIAL' | 'PAGADA' | 'ANULADA';
      montoPagado: number;
      descripcion: string;
      cuentaContableId?: number;
      centroCostoId?: number;
    }) => {
      const exists = await prisma.facturaProveedor.findFirst({
        where: {
          proveedorId: data.proveedorId,
          tipoComprobante: data.tipoComprobante,
          puntoVenta: data.puntoVenta,
          numeroComprobante: data.numeroComprobante,
        },
      });
      if (exists) return exists;

      return prisma.facturaProveedor.create({
        data: {
          proveedorId: data.proveedorId,
          tipoComprobante: data.tipoComprobante,
          puntoVenta: data.puntoVenta,
          numeroComprobante: data.numeroComprobante,
          fechaEmision: data.fechaEmision,
          fechaVencimiento: data.fechaVencimiento,
          subtotal: data.subtotal,
          montoIva21: data.iva21,
          total: data.total,
          totalAPagar: data.total,
          montoPagado: data.montoPagado,
          saldoPendiente: data.total - data.montoPagado,
          estado: data.estado,
          descripcion: data.descripcion,
          cuentaContableId: data.cuentaContableId ?? ctaProveedores?.id,
          centroCostoId: data.centroCostoId ?? ccOp?.id,
          registradoPorId: adminUser.id,
        },
      });
    };

    // Factura PENDIENTE (sin pagar)
    await crearFactProv({
      proveedorId: prov1.id,
      tipoComprobante: 'FACTURA_A',
      puntoVenta: 3,
      numeroComprobante: '00000245',
      fechaEmision: new Date('2025-02-01'),
      fechaVencimiento: new Date('2025-03-03'),
      subtotal: 580000,
      iva21: 121800,
      total: 701800,
      estado: 'PENDIENTE',
      montoPagado: 0,
      descripcion: 'Cemento, arena y hierro para obra Sucursal 45',
      cuentaContableId: ctaMateriales?.id,
    });

    // Factura PENDIENTE (vence pronto)
    await crearFactProv({
      proveedorId: prov4?.id ?? prov1.id,
      tipoComprobante: 'FACTURA_A',
      puntoVenta: 1,
      numeroComprobante: '00001890',
      fechaEmision: new Date('2025-01-28'),
      fechaVencimiento: new Date('2025-02-28'),
      subtotal: 420000,
      iva21: 88200,
      total: 508200,
      estado: 'PENDIENTE',
      montoPagado: 0,
      descripcion: 'Cable, térmicas y tablero eléctrico',
      cuentaContableId: ctaMateriales?.id,
    });

    // Factura con PAGO PARCIAL
    const factParcial = await crearFactProv({
      proveedorId: prov3?.id ?? prov1.id,
      tipoComprobante: 'FACTURA_A',
      puntoVenta: 2,
      numeroComprobante: '00003456',
      fechaEmision: new Date('2025-01-10'),
      fechaVencimiento: new Date('2025-02-10'),
      subtotal: 950000,
      iva21: 199500,
      total: 1149500,
      estado: 'PAGO_PARCIAL',
      montoPagado: 600000,
      descripcion: 'Materiales sanitarios y de construcción',
      cuentaContableId: ctaMateriales?.id,
    });

    // Crear pago parcial asociado
    if (factParcial) {
      const existingPago = await prisma.pagoFactura.findFirst({
        where: { facturaId: factParcial.id },
      });
      if (!existingPago) {
        const movPago = await crearMov({
          tipo: 'EGRESO',
          medioPago: 'TRANSFERENCIA',
          monto: 600000,
          descripcion: `Pago parcial Factura ${prov3?.razonSocial ?? 'Distribuidora Norte'} A-0002-00003456`,
          fechaMovimiento: new Date('2025-01-20'),
          cuentaId: cuentaNacionId,
          cuentaContableId: ctaProveedores?.id,
          centroCostoId: ccOp?.id,
        });
        await prisma.pagoFactura.create({
          data: {
            facturaId: factParcial.id,
            monto: 600000,
            fechaPago: new Date('2025-01-20'),
            medioPago: 'TRANSFERENCIA',
            movimientoId: movPago.id,
            observaciones: 'Primer pago - 50% aprox',
          },
        });
      }
    }

    // Factura PAGADA completa
    const factPagada = await crearFactProv({
      proveedorId: prov2?.id ?? prov1.id,
      tipoComprobante: 'FACTURA_C',
      puntoVenta: 1,
      numeroComprobante: '00000089',
      fechaEmision: new Date('2025-01-05'),
      fechaVencimiento: new Date('2025-01-20'),
      subtotal: 185000,
      iva21: 0,
      total: 185000,
      estado: 'PAGADA',
      montoPagado: 185000,
      descripcion: 'Ferretería general: tornillos, tarugos, sellador',
      cuentaContableId: ctaMateriales?.id,
    });

    // Crear pago completo
    if (factPagada) {
      const existingPago = await prisma.pagoFactura.findFirst({
        where: { facturaId: factPagada.id },
      });
      if (!existingPago) {
        const movPagoC = await crearMov({
          tipo: 'EGRESO',
          medioPago: 'EFECTIVO',
          monto: 185000,
          descripcion: `Pago completo Factura C ${prov2?.razonSocial ?? 'Ferreteria'} C-0001-00000089`,
          fechaMovimiento: new Date('2025-01-15'),
          cuentaId: cuentaCajaId,
          cuentaContableId: ctaProveedores?.id,
          centroCostoId: ccOp?.id,
        });
        await prisma.pagoFactura.create({
          data: {
            facturaId: factPagada.id,
            monto: 185000,
            fechaPago: new Date('2025-01-15'),
            medioPago: 'EFECTIVO',
            movimientoId: movPagoC.id,
            observaciones: 'Pago total en efectivo',
          },
        });
      }
    }

    // Otra factura PAGADA
    const factPagada2 = await crearFactProv({
      proveedorId: prov1.id,
      tipoComprobante: 'FACTURA_A',
      puntoVenta: 3,
      numeroComprobante: '00000230',
      fechaEmision: new Date('2024-12-15'),
      fechaVencimiento: new Date('2025-01-15'),
      subtotal: 320000,
      iva21: 67200,
      total: 387200,
      estado: 'PAGADA',
      montoPagado: 387200,
      descripcion: 'Piedra partida y ladrillos huecos',
      cuentaContableId: ctaMateriales?.id,
    });

    if (factPagada2) {
      const existingPago = await prisma.pagoFactura.findFirst({
        where: { facturaId: factPagada2.id },
      });
      if (!existingPago) {
        const movPago2 = await crearMov({
          tipo: 'EGRESO',
          medioPago: 'TRANSFERENCIA',
          monto: 387200,
          descripcion: `Pago Factura A-0003-00000230 Materiales del Litoral`,
          fechaMovimiento: new Date('2025-01-10'),
          cuentaId: cuentaNacionId,
          cuentaContableId: ctaProveedores?.id,
          centroCostoId: ccOp?.id,
        });
        await prisma.pagoFactura.create({
          data: {
            facturaId: factPagada2.id,
            monto: 387200,
            fechaPago: new Date('2025-01-10'),
            medioPago: 'TRANSFERENCIA',
            movimientoId: movPago2.id,
          },
        });
      }
    }

    // Factura ANULADA
    await crearFactProv({
      proveedorId: prov1.id,
      tipoComprobante: 'FACTURA_A',
      puntoVenta: 3,
      numeroComprobante: '00000240',
      fechaEmision: new Date('2025-01-25'),
      fechaVencimiento: new Date('2025-02-25'),
      subtotal: 210000,
      iva21: 44100,
      total: 254100,
      estado: 'ANULADA',
      montoPagado: 0,
      descripcion: 'ANULADA - Error en comprobante, re-emitida',
    });

    console.log(
      '✅ 6 facturas de proveedor creadas (PENDIENTE x2, PAGO_PARCIAL, PAGADA x2, ANULADA).'
    );
  }

  // ── 7. CHEQUES ─────────────────────────────────────────
  console.log('📝 Creando cheques...');

  const chequesData = [
    {
      numero: 'CHQ-50001234',
      tipo: 'FISICO' as const,
      bancoEmisor: 'Banco Nación',
      fechaEmision: new Date('2025-01-05'),
      fechaCobro: new Date('2025-02-05'),
      monto: 450000,
      emisor: 'Correo Argentino S.A.',
      beneficiario: 'Bauman SRL',
      estado: 'CARTERA' as const,
    },
    {
      numero: 'CHQ-50001235',
      tipo: 'FISICO' as const,
      bancoEmisor: 'Banco Galicia',
      fechaEmision: new Date('2025-01-10'),
      fechaCobro: new Date('2025-01-25'),
      monto: 320000,
      emisor: 'Distribuidora Norte SA',
      beneficiario: 'Bauman SRL',
      estado: 'DEPOSITADO' as const,
      cuentaDestinoId: cuentaNacionId,
      fechaDeposito: new Date('2025-01-20'),
    },
    {
      numero: 'CHQ-50001236',
      tipo: 'ECHEQ' as const,
      bancoEmisor: 'BBVA',
      fechaEmision: new Date('2024-12-20'),
      fechaCobro: new Date('2025-01-20'),
      monto: 580000,
      emisor: 'Correo Argentino S.A.',
      beneficiario: 'Bauman SRL',
      estado: 'COBRADO' as const,
      cuentaDestinoId: cuentaGaliciaId,
      fechaDeposito: new Date('2025-01-15'),
      fechaAcreditacion: new Date('2025-01-21'),
    },
    {
      numero: 'CHQ-50001237',
      tipo: 'FISICO' as const,
      bancoEmisor: 'Banco Provincia',
      fechaEmision: new Date('2025-01-15'),
      fechaCobro: new Date('2025-03-15'),
      monto: 250000,
      emisor: 'Cliente Particular',
      beneficiario: 'Bauman SRL',
      estado: 'ENDOSADO' as const,
      endosadoA: 'Materiales del Litoral SRL',
      fechaEndoso: new Date('2025-01-28'),
    },
    {
      numero: 'ECHEQ-70009876',
      tipo: 'ECHEQ' as const,
      bancoEmisor: 'Santander',
      fechaEmision: new Date('2025-01-08'),
      fechaCobro: new Date('2025-02-08'),
      monto: 720000,
      emisor: 'Correo Argentino S.A.',
      beneficiario: 'Bauman SRL',
      estado: 'VENDIDO' as const,
      ventaEntidad: 'Max Capital',
      ventaTasaDescuento: 0.045,
      ventaIvaComision: 0.21,
      ventaComisionBruta: 32400,
      ventaMontoNeto: 687600,
      ventaLoteId: 'LOTE-2025-001',
    },
    {
      numero: 'CHQ-50001238',
      tipo: 'FISICO' as const,
      bancoEmisor: 'Banco Nación',
      fechaEmision: new Date('2025-01-02'),
      fechaCobro: new Date('2025-01-30'),
      monto: 180000,
      emisor: 'Empresa Constructora XYZ',
      beneficiario: 'Bauman SRL',
      estado: 'RECHAZADO' as const,
      motivoRechazo: 'Cuenta sin fondos suficientes',
      cuentaDestinoId: cuentaNacionId,
      fechaDeposito: new Date('2025-01-25'),
    },
    {
      numero: 'CHQ-50001239',
      tipo: 'FISICO' as const,
      bancoEmisor: 'Banco Galicia',
      fechaEmision: new Date('2025-01-20'),
      fechaCobro: new Date('2025-03-20'),
      monto: 890000,
      emisor: 'Correo Argentino S.A.',
      beneficiario: 'Bauman SRL',
      estado: 'CARTERA' as const,
    },
    {
      numero: 'ECHEQ-70009877',
      tipo: 'ECHEQ' as const,
      bancoEmisor: 'BBVA',
      fechaEmision: new Date('2025-02-01'),
      fechaCobro: new Date('2025-04-01'),
      monto: 1200000,
      emisor: 'Correo Argentino S.A.',
      beneficiario: 'Bauman SRL',
      estado: 'CARTERA' as const,
    },
  ];

  for (const ch of chequesData) {
    const exists = await prisma.cheque.findUnique({ where: { numero: ch.numero } });
    if (exists) continue;

    await prisma.cheque.create({
      data: {
        numero: ch.numero,
        tipo: ch.tipo,
        bancoEmisor: ch.bancoEmisor,
        fechaEmision: ch.fechaEmision,
        fechaCobro: ch.fechaCobro,
        monto: ch.monto,
        emisor: ch.emisor,
        beneficiario: ch.beneficiario,
        estado: ch.estado,
        cuentaDestinoId:
          ((ch as Record<string, unknown>).cuentaDestinoId as number | undefined) ?? null,
        fechaDeposito: ((ch as Record<string, unknown>).fechaDeposito as Date | undefined) ?? null,
        fechaAcreditacion:
          ((ch as Record<string, unknown>).fechaAcreditacion as Date | undefined) ?? null,
        endosadoA: ((ch as Record<string, unknown>).endosadoA as string | undefined) ?? null,
        fechaEndoso: ((ch as Record<string, unknown>).fechaEndoso as Date | undefined) ?? null,
        ventaLoteId: ((ch as Record<string, unknown>).ventaLoteId as string | undefined) ?? null,
        ventaEntidad: ((ch as Record<string, unknown>).ventaEntidad as string | undefined) ?? null,
        ventaTasaDescuento:
          ((ch as Record<string, unknown>).ventaTasaDescuento as number | undefined) ?? null,
        ventaIvaComision:
          ((ch as Record<string, unknown>).ventaIvaComision as number | undefined) ?? null,
        ventaComisionBruta:
          ((ch as Record<string, unknown>).ventaComisionBruta as number | undefined) ?? null,
        ventaMontoNeto:
          ((ch as Record<string, unknown>).ventaMontoNeto as number | undefined) ?? null,
        motivoRechazo:
          ((ch as Record<string, unknown>).motivoRechazo as string | undefined) ?? null,
      },
    });
  }
  console.log(
    `✅ ${chequesData.length} cheques creados (CARTERA x3, DEPOSITADO, COBRADO, ENDOSADO, VENDIDO, RECHAZADO).`
  );

  // ── 8. FACTURAS EMITIDAS (COBRAR) ─────────────────────
  console.log('🧾 Creando facturas emitidas...');

  const crearFactEmitida = async (data: {
    puntoVenta: number;
    numeroComprobante: string;
    tipoComprobante: 'FACTURA_A' | 'FACTURA_B' | 'FACTURA_C';
    fechaEmision: Date;
    fechaVencimiento: Date;
    subtotal: number;
    iva21: number;
    total: number;
    montoCobrado: number;
    estado: 'PENDIENTE' | 'COBRO_PARCIAL' | 'COBRADA' | 'ANULADA';
    descripcion: string;
  }) => {
    const exists = await prisma.facturaEmitida.findFirst({
      where: {
        puntoVenta: data.puntoVenta,
        numeroComprobante: data.numeroComprobante,
        tipoComprobante: data.tipoComprobante,
      },
    });
    if (exists) return exists;

    return prisma.facturaEmitida.create({
      data: {
        clienteId: cliente.id,
        tipoComprobante: data.tipoComprobante,
        puntoVenta: data.puntoVenta,
        numeroComprobante: data.numeroComprobante,
        fechaEmision: data.fechaEmision,
        fechaVencimiento: data.fechaVencimiento,
        subtotal: data.subtotal,
        montoIva21: data.iva21,
        total: data.total,
        montoCobrado: data.montoCobrado,
        saldoPendiente: data.total - data.montoCobrado,
        estado: data.estado,
        descripcion: data.descripcion,
        cuentaContableId: ctaCobroFacturas?.id,
        centroCostoId: ccOp?.id,
        registradoPorId: adminUser.id,
      },
    });
  };

  // Factura PENDIENTE
  await crearFactEmitida({
    puntoVenta: 1,
    numeroComprobante: '00000020',
    tipoComprobante: 'FACTURA_A',
    fechaEmision: new Date('2025-02-01'),
    fechaVencimiento: new Date('2025-03-03'),
    subtotal: 1800000,
    iva21: 378000,
    total: 2178000,
    montoCobrado: 0,
    estado: 'PENDIENTE',
    descripcion: 'Servicio mantenimiento integral febrero 2025 - Sucursales Zona Norte',
  });

  // Otra PENDIENTE
  await crearFactEmitida({
    puntoVenta: 1,
    numeroComprobante: '00000021',
    tipoComprobante: 'FACTURA_A',
    fechaEmision: new Date('2025-02-10'),
    fechaVencimiento: new Date('2025-03-12'),
    subtotal: 2450000,
    iva21: 514500,
    total: 2964500,
    montoCobrado: 0,
    estado: 'PENDIENTE',
    descripcion: 'Obra remodelación Sucursal Centro - Certificado #1',
  });

  // COBRO PARCIAL
  const factCobrada = await crearFactEmitida({
    puntoVenta: 1,
    numeroComprobante: '00000018',
    tipoComprobante: 'FACTURA_A',
    fechaEmision: new Date('2025-01-15'),
    fechaVencimiento: new Date('2025-02-15'),
    subtotal: 3200000,
    iva21: 672000,
    total: 3872000,
    montoCobrado: 1450000,
    estado: 'COBRO_PARCIAL',
    descripcion: 'Servicio mantenimiento correctivo enero 2025 - Múltiples sucursales',
  });

  // Crear cobro parcial asociado
  if (factCobrada) {
    const existingCobro = await prisma.cobroFactura.findFirst({
      where: { facturaId: factCobrada.id },
    });
    if (!existingCobro) {
      await prisma.cobroFactura.create({
        data: {
          facturaId: factCobrada.id,
          monto: 1450000,
          fechaCobro: new Date('2025-02-10'),
          medioPago: 'TRANSFERENCIA',
          movimientoId: cobro5.id,
          observaciones: 'Primer cobro parcial - transferencia',
        },
      });
    }
  }

  // COBRADA completa
  const factCobradaFull = await crearFactEmitida({
    puntoVenta: 1,
    numeroComprobante: '00000012',
    tipoComprobante: 'FACTURA_A',
    fechaEmision: new Date('2024-12-20'),
    fechaVencimiento: new Date('2025-01-20'),
    subtotal: 2066115,
    iva21: 433885,
    total: 2500000,
    montoCobrado: 2500000,
    estado: 'COBRADA',
    descripcion: 'Obra refacción Sucursal 78 - Correo Argentino',
  });

  if (factCobradaFull) {
    const existingCobro = await prisma.cobroFactura.findFirst({
      where: { facturaId: factCobradaFull.id },
    });
    if (!existingCobro) {
      await prisma.cobroFactura.create({
        data: {
          facturaId: factCobradaFull.id,
          monto: 2500000,
          fechaCobro: new Date('2025-01-10'),
          medioPago: 'TRANSFERENCIA',
          movimientoId: cobro1.id,
          observaciones: 'Cobro total por transferencia',
        },
      });
    }
  }

  // Otra COBRADA
  await crearFactEmitida({
    puntoVenta: 1,
    numeroComprobante: '00000013',
    tipoComprobante: 'FACTURA_A',
    fechaEmision: new Date('2025-01-05'),
    fechaVencimiento: new Date('2025-02-05'),
    subtotal: 1528925,
    iva21: 321075,
    total: 1850000,
    montoCobrado: 1850000,
    estado: 'COBRADA',
    descripcion: 'Mantenimiento preventivo diciembre 2024 - Zona Sur',
  });

  // ANULADA
  await crearFactEmitida({
    puntoVenta: 1,
    numeroComprobante: '00000015',
    tipoComprobante: 'FACTURA_A',
    fechaEmision: new Date('2025-01-08'),
    fechaVencimiento: new Date('2025-02-08'),
    subtotal: 500000,
    iva21: 105000,
    total: 605000,
    montoCobrado: 0,
    estado: 'ANULADA',
    descripcion: 'ANULADA - Error en datos, reemplazada por FC 00000018',
  });

  console.log('✅ 6 facturas emitidas creadas (PENDIENTE x2, COBRO_PARCIAL, COBRADA x2, ANULADA).');

  // ── Resumen ────────────────────────────────────────────
  const totalMovs = await prisma.movimiento.count();
  const totalCheques = await prisma.cheque.count();
  const totalFactProv = await prisma.facturaProveedor.count();
  const totalFactEmit = await prisma.facturaEmitida.count();
  const totalVehiculos = await prisma.vehiculo.count();
  const totalMateriales = await prisma.material.count();
  const totalCuentasFin = await prisma.cuentaFinanciera.count();
  const totalBancos = await prisma.banco.count();

  console.log('');
  console.log('📊 Resumen datos de ejemplo:');
  console.log(`   - Bancos: ${totalBancos}`);
  console.log(`   - Cuentas financieras: ${totalCuentasFin}`);
  console.log(`   - Vehículos: ${totalVehiculos}`);
  console.log(`   - Materiales: ${totalMateriales}`);
  console.log(`   - Movimientos: ${totalMovs}`);
  console.log(`   - Facturas proveedor: ${totalFactProv}`);
  console.log(`   - Cheques: ${totalCheques}`);
  console.log(`   - Facturas emitidas: ${totalFactEmit}`);
}

// -------------------------------------------------------
// Seed: Tarjetas (Config categorias de gasto)
// -------------------------------------------------------

async function seedTarjetas() {
  console.log('💳 === SEED TARJETAS ===\n');

  // ===== 0. LIMPIAR DATOS EXISTENTES =====
  console.log('🗑️  Limpiando datos de tarjetas existentes...');
  await prisma.gastoTarjeta.deleteMany({});
  await prisma.cargaTarjeta.deleteMany({});
  await prisma.tarjetaPrecargable.deleteMany({});
  console.log('✅ Datos anteriores eliminados.\n');

  // ===== 1. CONFIGURAR CATEGORÍAS DE GASTO =====
  console.log('📋 Configurando categorías de gasto...');
  const categoriasConfig = [
    { categoria: 'GAS' as const, label: 'Gas', cuentaCodigo: '5.2.01' },
    { categoria: 'FERRETERIA' as const, label: 'Ferretería', cuentaCodigo: '5.1.01' },
    { categoria: 'ESTACIONAMIENTO' as const, label: 'Estacionamiento', cuentaCodigo: '5.2.02' },
    { categoria: 'LAVADERO' as const, label: 'Lavadero', cuentaCodigo: '5.2.04' },
    { categoria: 'NAFTA' as const, label: 'Nafta', cuentaCodigo: '5.2.01' },
    { categoria: 'REPUESTOS' as const, label: 'Repuestos', cuentaCodigo: '5.2.04' },
    {
      categoria: 'MATERIALES_ELECTRICOS' as const,
      label: 'Materiales Eléctricos',
      cuentaCodigo: '5.1.01',
    },
    { categoria: 'PEAJES' as const, label: 'Peajes', cuentaCodigo: '5.2.02' },
    { categoria: 'COMIDA' as const, label: 'Comida', cuentaCodigo: '5.2.02' },
    { categoria: 'HERRAMIENTAS' as const, label: 'Herramientas', cuentaCodigo: '5.2.03' },
    { categoria: 'OTRO' as const, label: 'Otro', cuentaCodigo: '5.2.02' },
  ];

  for (const cfg of categoriasConfig) {
    const cuenta = await prisma.cuentaContable.findUnique({ where: { codigo: cfg.cuentaCodigo } });
    if (!cuenta) {
      console.warn(`⚠️ Cuenta contable ${cfg.cuentaCodigo} no encontrada para ${cfg.categoria}`);
      continue;
    }

    await prisma.configCategoriaGasto.upsert({
      where: { categoria: cfg.categoria },
      update: { label: cfg.label, cuentaContableId: cuenta.id },
      create: { categoria: cfg.categoria, label: cfg.label, cuentaContableId: cuenta.id },
    });
  }
  console.log(`✅ ${categoriasConfig.length} categorías configuradas.\n`);

  // ===== 2. CREAR/BUSCAR BANCOS =====
  console.log('🏦 Buscando/creando bancos...');
  const bancosData = [
    { codigo: 'BNA', nombre: 'Banco de la Nación Argentina', nombreCorto: 'BNA' },
    { codigo: 'GALICIA', nombre: 'Banco de Galicia y Buenos Aires S.A.U.', nombreCorto: 'Galicia' },
    { codigo: 'SANTANDER', nombre: 'Banco Santander Río S.A.', nombreCorto: 'Santander' },
    { codigo: 'BBVA', nombre: 'BBVA Argentina S.A.', nombreCorto: 'BBVA' },
    { codigo: 'MACRO', nombre: 'Banco Macro S.A.', nombreCorto: 'Macro' },
  ];

  const bancosMap = new Map<string, number>();
  for (const b of bancosData) {
    // Buscar por codigo primero
    let banco = await prisma.banco.findFirst({
      where: { OR: [{ codigo: b.codigo }, { nombreCorto: b.nombreCorto }] },
    });

    if (!banco) {
      // Crear si no existe
      banco = await prisma.banco.create({ data: b });
    }
    bancosMap.set(b.codigo, banco.id);
  }
  console.log(`✅ ${bancosData.length} bancos verificados.\n`);

  // ===== 3. BUSCAR EMPLEADOS REFERENTES =====
  console.log('👥 Buscando empleados referentes...');
  const referentes = await prisma.empleado.findMany({
    where: { esReferente: true, fechaEliminacion: null },
    take: 3,
  });

  if (referentes.length === 0) {
    console.warn('⚠️ No hay empleados referentes. Creando uno de ejemplo...');
    const zona = await prisma.zona.findFirst();
    if (!zona) {
      console.error('❌ No hay zonas creadas. Ejecute seed de maestros primero.');
      return;
    }

    const refExample = await prisma.empleado.create({
      data: {
        nombre: 'Juan',
        apellido: 'Pérez',
        telefono: '1123456789',
        tipo: 'TECNICO',
        tipoContrato: 'DEPENDENCIA',
        esReferente: true,
        puesto: 'Técnico Referente',
        zonaId: zona.id,
        inicioRelacionLaboral: new Date('2023-01-01'),
      },
    });
    referentes.push(refExample);
  }
  console.log(`✅ ${referentes.length} empleados referentes encontrados.\n`);

  // ===== 4. BUSCAR/CREAR USUARIO ADMIN =====
  const adminUser = await prisma.usuario.findFirst({ where: { email: 'admin@bauman.com.ar' } });
  if (!adminUser) {
    console.error('❌ Usuario admin no encontrado. Ejecute seed de seguridad primero.');
    return;
  }

  // ===== 5. BUSCAR CENTROS DE COSTO =====
  const centrosCosto = await prisma.centroCosto.findMany({ where: { activo: true }, take: 3 });
  const centroCostoId = centrosCosto[0]?.id || null;

  // ===== 6. CREAR TARJETAS CON CUENTAS FINANCIERAS =====
  console.log('💳 Creando tarjetas...');
  const tarjetasData = [
    {
      tipo: 'PRECARGABLE' as const,
      tipoTarjetaFinanciera: 'DEBITO' as const,
      redProcesadora: 'VISA' as const,
      numeroTarjeta: '4517123456789012',
      alias: 'Tarjeta Juan',
      empleadoId: referentes[0].id,
      bancoId: bancosMap.get('BNA')!,
      estado: 'ACTIVA' as const,
      cuentaNombre: 'TC Precargable - Juan Pérez',
      saldoInicial: 50000,
    },
    {
      tipo: 'PRECARGABLE' as const,
      tipoTarjetaFinanciera: 'DEBITO' as const,
      redProcesadora: 'MASTERCARD' as const,
      numeroTarjeta: '5411234567890123',
      alias: referentes[1] ? `Tarjeta ${referentes[1].nombre}` : 'Tarjeta Técnico 2',
      empleadoId: referentes[1]?.id || referentes[0].id,
      bancoId: bancosMap.get('GALICIA')!,
      estado: 'ACTIVA' as const,
      cuentaNombre: referentes[1]
        ? `TC Precargable - ${referentes[1].nombre} ${referentes[1].apellido}`
        : 'TC Precargable 2',
      saldoInicial: 35000,
    },
    {
      tipo: 'CORPORATIVA' as const,
      tipoTarjetaFinanciera: 'CREDITO' as const,
      redProcesadora: 'VISA' as const,
      numeroTarjeta: '4517987654321098',
      alias: 'Corporativa Director',
      empleadoId: referentes[0].id,
      bancoId: bancosMap.get('SANTANDER')!,
      estado: 'ACTIVA' as const,
      cuentaNombre: 'TC Corporativa - Director',
      saldoInicial: 0,
    },
  ];

  const tarjetasCreadas = [];
  for (const td of tarjetasData) {
    // Crear cuenta financiera
    const cuenta = await prisma.cuentaFinanciera.create({
      data: {
        nombre: td.cuentaNombre,
        tipo: td.tipo === 'PRECARGABLE' ? 'CAJA_CHICA' : 'CUENTA_CORRIENTE',
        bancoId: td.bancoId,
        saldoInicial: td.saldoInicial,
        saldoActual: td.saldoInicial,
        activa: true,
      },
    });

    // Crear tarjeta
    const tarjeta = await prisma.tarjetaPrecargable.create({
      data: {
        tipo: td.tipo,
        tipoTarjetaFinanciera: td.tipoTarjetaFinanciera,
        redProcesadora: td.redProcesadora,
        numeroTarjeta: td.numeroTarjeta,
        alias: td.alias,
        empleadoId: td.empleadoId,
        cuentaFinancieraId: cuenta.id,
        bancoId: td.bancoId,
        estado: td.estado,
      },
    });

    tarjetasCreadas.push({ tarjeta, cuenta, tipo: td.tipo });
  }
  console.log(`✅ ${tarjetasCreadas.length} tarjetas creadas.\n`);

  // ===== 7. CREAR CARGAS PARA PRECARGABLES =====
  console.log('💰 Creando cargas para tarjetas precargables...');
  let cargasCount = 0;
  for (const tc of tarjetasCreadas.filter((t) => t.tipo === 'PRECARGABLE')) {
    const cargas = [
      { monto: 50000, fecha: new Date('2026-02-01'), descripcion: 'Carga inicial' },
      { monto: 20000, fecha: new Date('2026-02-10'), descripcion: 'Recarga' },
    ];

    for (const c of cargas) {
      // Crear movimiento INGRESO
      const movimiento = await prisma.movimiento.create({
        data: {
          tipo: 'INGRESO',
          medioPago: 'TRANSFERENCIA',
          monto: c.monto,
          descripcion: `Carga tarjeta: ${c.descripcion}`,
          fechaMovimiento: c.fecha,
          cuentaId: tc.cuenta.id,
          estado: 'CONFIRMADO',
          registradoPorId: adminUser.id,
        },
      });

      // Crear carga
      await prisma.cargaTarjeta.create({
        data: {
          tarjetaId: tc.tarjeta.id,
          monto: c.monto,
          fecha: c.fecha,
          descripcion: c.descripcion,
          movimientoId: movimiento.id,
          registradoPorId: adminUser.id,
        },
      });

      // Actualizar saldo
      await prisma.cuentaFinanciera.update({
        where: { id: tc.cuenta.id },
        data: { saldoActual: { increment: c.monto } },
      });

      cargasCount++;
    }
  }
  console.log(`✅ ${cargasCount} cargas creadas.\n`);

  // ===== 8. CREAR PROVEEDORES =====
  console.log('🏪 Creando proveedores...');
  const proveedoresData = [
    {
      razonSocial: 'YPF S.A.',
      cuit: '30546099680',
      condicionIva: 'RESPONSABLE_INSCRIPTO' as const,
    },
    {
      razonSocial: 'Shell CAPSA',
      cuit: '30500080563',
      condicionIva: 'RESPONSABLE_INSCRIPTO' as const,
    },
    {
      razonSocial: 'Ferretería El Tornillo',
      cuit: '20123456789',
      condicionIva: 'MONOTRIBUTO' as const,
    },
    { razonSocial: 'Lavadero Express', cuit: '27234567890', condicionIva: 'MONOTRIBUTO' as const },
    {
      razonSocial: 'Estacionamiento Seguro S.R.L.',
      cuit: '30678901234',
      condicionIva: 'RESPONSABLE_INSCRIPTO' as const,
    },
    {
      razonSocial: 'Repuestos del Norte',
      cuit: '20345678901',
      condicionIva: 'MONOTRIBUTO' as const,
    },
  ];

  const proveedores = [];
  for (const p of proveedoresData) {
    const proveedor = await prisma.proveedor.upsert({
      where: { cuit: p.cuit },
      update: {},
      create: p,
    });
    proveedores.push(proveedor);
  }
  console.log(`✅ ${proveedores.length} proveedores creados.\n`);

  // ===== 9. CREAR GASTOS CON FACTURAS =====
  console.log('🧾 Creando gastos con facturas...');
  const gastosData = [
    // Gastos para tarjeta 1
    {
      tarjetaIdx: 0,
      categoria: 'NAFTA' as const,
      monto: 15000,
      fecha: new Date('2026-02-03'),
      concepto: 'Carga completa YPF',
      proveedorIdx: 0, // YPF
      tipoComprobante: 'FACTURA_B' as const,
      puntoVenta: 5,
      numeroComprobante: '00012345',
    },
    {
      tarjetaIdx: 0,
      categoria: 'FERRETERIA' as const,
      monto: 8500,
      fecha: new Date('2026-02-05'),
      concepto: 'Materiales varios obra zona norte',
      proveedorIdx: 2, // Ferretería
      tipoComprobante: 'FACTURA_C' as const,
      puntoVenta: 1,
      numeroComprobante: '00000234',
    },
    {
      tarjetaIdx: 0,
      categoria: 'COMIDA' as const,
      monto: 4500,
      fecha: new Date('2026-02-07'),
      concepto: 'Almuerzo equipo técnico',
    },
    {
      tarjetaIdx: 0,
      categoria: 'ESTACIONAMIENTO' as const,
      monto: 2000,
      fecha: new Date('2026-02-08'),
      concepto: 'Estacionamiento centro',
      proveedorIdx: 4, // Estacionamiento
      tipoComprobante: 'FACTURA_C' as const,
      puntoVenta: 1,
      numeroComprobante: '00000567',
    },
    // Gastos para tarjeta 2
    {
      tarjetaIdx: 1,
      categoria: 'NAFTA' as const,
      monto: 12000,
      fecha: new Date('2026-02-04'),
      concepto: 'Carga Shell',
      proveedorIdx: 1, // Shell
      tipoComprobante: 'FACTURA_B' as const,
      puntoVenta: 3,
      numeroComprobante: '00045678',
    },
    {
      tarjetaIdx: 1,
      categoria: 'LAVADERO' as const,
      monto: 3500,
      fecha: new Date('2026-02-06'),
      concepto: 'Lavado completo camioneta',
      proveedorIdx: 3, // Lavadero
      tipoComprobante: 'FACTURA_C' as const,
      puntoVenta: 1,
      numeroComprobante: '00000123',
    },
    {
      tarjetaIdx: 1,
      categoria: 'REPUESTOS' as const,
      monto: 18500,
      fecha: new Date('2026-02-09'),
      concepto: 'Repuesto bomba hidráulica',
      proveedorIdx: 5, // Repuestos
      tipoComprobante: 'FACTURA_C' as const,
      puntoVenta: 1,
      numeroComprobante: '00000789',
    },
    // Gastos para tarjeta corporativa
    {
      tarjetaIdx: 2,
      categoria: 'COMIDA' as const,
      monto: 25000,
      fecha: new Date('2026-02-05'),
      concepto: 'Cena con cliente importante',
    },
    {
      tarjetaIdx: 2,
      categoria: 'OTRO' as const,
      categoriaOtro: 'Papelería oficina',
      monto: 6500,
      fecha: new Date('2026-02-08'),
      concepto: 'Insumos oficina y papelería',
    },
  ];

  let gastosCount = 0;
  for (const g of gastosData) {
    const tc = tarjetasCreadas[g.tarjetaIdx];
    const configCategoria = await prisma.configCategoriaGasto.findUnique({
      where: { categoria: g.categoria },
    });

    if (!configCategoria) continue;

    // Crear proveedor y factura si corresponde
    let proveedorId: number | null = null;
    let facturaProveedorId: number | null = null;

    if (g.proveedorIdx !== undefined && g.tipoComprobante) {
      const proveedor = proveedores[g.proveedorIdx];
      proveedorId = proveedor.id;

      // Crear factura
      const factura = await prisma.facturaProveedor.create({
        data: {
          proveedorId: proveedor.id,
          tipoComprobante: g.tipoComprobante,
          puntoVenta: g.puntoVenta!,
          numeroComprobante: g.numeroComprobante!,
          fechaEmision: g.fecha,
          subtotal: g.monto,
          total: g.monto,
          totalAPagar: g.monto,
          montoPagado: g.monto,
          saldoPendiente: 0,
          estado: 'PAGADA',
          cuentaContableId: configCategoria.cuentaContableId,
          centroCostoId,
          registradoPorId: adminUser.id,
        },
      });
      facturaProveedorId = factura.id;
    }

    // Crear movimiento EGRESO
    const medioPago = tc.tipo === 'PRECARGABLE' ? 'TARJETA_DEBITO' : 'TARJETA_CREDITO';
    const movimiento = await prisma.movimiento.create({
      data: {
        tipo: 'EGRESO',
        medioPago,
        monto: g.monto,
        descripcion: `${configCategoria.label}: ${g.concepto}`,
        fechaMovimiento: g.fecha,
        cuentaId: tc.cuenta.id,
        cuentaContableId: configCategoria.cuentaContableId,
        centroCostoId,
        empleadoId: tc.tarjeta.empleadoId,
        estado: 'CONFIRMADO',
        registradoPorId: adminUser.id,
      },
    });

    // Crear gasto
    await prisma.gastoTarjeta.create({
      data: {
        tarjetaId: tc.tarjeta.id,
        proveedorId,
        facturaProveedorId,
        categoria: g.categoria,
        categoriaOtro: g.categoriaOtro || null,
        monto: g.monto,
        fecha: g.fecha,
        concepto: g.concepto,
        centroCostoId,
        movimientoId: movimiento.id,
        registradoPorId: adminUser.id,
      },
    });

    // Actualizar saldo (solo para precargables, corporativas no afectan saldo inmediato)
    if (tc.tipo === 'PRECARGABLE') {
      await prisma.cuentaFinanciera.update({
        where: { id: tc.cuenta.id },
        data: { saldoActual: { decrement: g.monto } },
      });
    }

    gastosCount++;
  }
  console.log(`✅ ${gastosCount} gastos creados con sus facturas.\n`);

  console.log('🎉 Seed de tarjetas completado exitosamente!');
  console.log(`   - ${tarjetasCreadas.length} tarjetas`);
  console.log(`   - ${cargasCount} cargas`);
  console.log(`   - ${proveedores.length} proveedores`);
  console.log(`   - ${gastosCount} gastos con facturas`);
}

// -------------------------------------------------------
// CLI: parsear --module=X
// -------------------------------------------------------

function parseModulo(): Modulo {
  const arg = process.argv.find((a) => a.startsWith('--module='));
  if (!arg) return 'todo';

  const valor = arg.split('=')[1] as Modulo;
  if (!MODULOS_VALIDOS.includes(valor)) {
    console.error(`❌ Módulo inválido: "${valor}"`);
    console.error(`   Módulos válidos: ${MODULOS_VALIDOS.join(', ')}`);
    process.exit(1);
  }
  return valor;
}

async function main() {
  const modulo = parseModulo();
  console.log(`🌱 Seed SIBA — módulo: ${modulo}\n`);

  if (modulo === 'seguridad' || modulo === 'todo') {
    await seedSeguridad();
    console.log('');
  }

  if (modulo === 'maestros' || modulo === 'todo') {
    await seedMaestros();
    console.log('');
  }

  if (modulo === 'finanzas' || modulo === 'todo') {
    await seedFinanzas();
    console.log('');
  }

  if (modulo === 'compras' || modulo === 'todo') {
    await seedCompras();
    console.log('');
  }

  if (modulo === 'ejemplos' || modulo === 'todo') {
    await seedEjemplos();
    console.log('');
  }

  if (modulo === 'tarjetas' || modulo === 'todo') {
    await seedTarjetas();
    console.log('');
  }

  console.log('🎉 Seed completado!');
  if (modulo === 'todo' || modulo === 'seguridad') {
    console.log('   - Usuario: admin@bauman.com.ar / admin123');
  }
}

main()
  .catch((e) => {
    console.error('❌ Error en seed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });

import { PrismaClient } from '@prisma/client';
import { fakerES as faker } from '@faker-js/faker';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Empezando el seed del ecosistema de prueba (SIBA)...');

  // ----------------------------------------------------
  // 1. Roles y Permisos (Base)
  // ----------------------------------------------------
  console.log('🛡️  Configurando seguridad base...');

  // Permisos
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
    { codigo: 'vacaciones:leer', modulo: 'Vacaciones', descripcion: 'Ver vacaciones' },
    { codigo: 'vacaciones:escribir', modulo: 'Vacaciones', descripcion: 'Gestionar vacaciones' },
    { codigo: 'sueldos:leer', modulo: 'Sueldos', descripcion: 'Ver sueldos' },
    { codigo: 'sueldos:escribir', modulo: 'Sueldos', descripcion: 'Gestionar sueldos' },
    { codigo: 'ausencias:leer', modulo: 'Ausencias', descripcion: 'Ver ausencias' },
    { codigo: 'ausencias:escribir', modulo: 'Ausencias', descripcion: 'Gestionar ausencias' },
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
      apellido: 'Principale',
      claveHash: hashedPassword,
    },
  });

  await prisma.usuarioRol.upsert({
    where: { usuarioId_rolId: { usuarioId: adminUser.id, rolId: superAdmin.id } },
    update: {},
    create: { usuarioId: adminUser.id, rolId: superAdmin.id },
  });

  console.log('✅ Seguridad base configurada.');

  // ----------------------------------------------------
  // 2. Administración: Zonas
  // ----------------------------------------------------
  console.log('🗺️  Creando Zonas Geográficas...');
  const zonasData = ['Norte', 'Sur', 'Este', 'Oeste', 'CABA Centro'];
  const zonas = [];

  // Create zones strictly
  // Deletion order: Empleado/Vehiculo/Sucursal -> Zona
  console.log('🧹 Limpiando datos antiguos...');
  await prisma.empleado.deleteMany({});
  await prisma.vehiculo.deleteMany({});
  await prisma.sucursal.deleteMany({});
  await prisma.zona.deleteMany({});

  for (const nombreZona of zonasData) {
    const z = await prisma.zona.create({
      data: {
        nombre: nombreZona,
        // Codigo is auto-increment Int, we don't set it manually
        descripcion: `Zona operativa ${nombreZona}`,
      },
    });
    zonas.push(z);
  }

  // ----------------------------------------------------
  // 3. Administración: Clientes y Sucursales
  // ----------------------------------------------------
  console.log('🏢  Creando Clientes y Sucursales...');
  await prisma.sucursal.deleteMany({});
  await prisma.cliente.deleteMany({});

  const TOTAL_CLIENTES = 20;

  for (let i = 0; i < TOTAL_CLIENTES; i++) {
    const esEmpresa = faker.datatype.boolean();
    const nombreCliente = esEmpresa ? faker.company.name() : faker.person.fullName();

    // Crear Cliente
    const cliente = await prisma.cliente.create({
      data: {
        codigo: 1000 + i, // Manual sequence for unique Int code
        razonSocial: nombreCliente,
        cuit: faker.string.numeric(11),
        email: faker.internet.email(),
        telefono: faker.phone.number(),
        direccionFiscal: faker.location.streetAddress(),
        // Removed non-existent fields: tipo, condicionIva, estado
      },
    });

    // Crear 1 a 3 Sucursales para este cliente
    const numSedes = faker.number.int({ min: 1, max: 3 });
    for (let j = 0; j < numSedes; j++) {
      const zonaAleatoria = faker.helpers.arrayElement(zonas);
      await prisma.sucursal.create({
        data: {
          clienteId: cliente.id,
          zonaId: zonaAleatoria.id,
          nombre: j === 0 ? 'Casa Central' : `Sucursal ${faker.location.city()}`,
          direccion: faker.location.streetAddress(),
          telefono: faker.phone.number(),
          contactoNombre: faker.person.fullName(),
          contactoTelefono: faker.phone.number(),
          // Removed: emailContacto, latitud, longitud (not in Sucursal model)
        },
      });
    }
  }

  // ----------------------------------------------------
  // 4. Administración: Vehículos
  // ----------------------------------------------------
  console.log('🚚  Creando Flota de Vehículos...');
  await prisma.vehiculo.deleteMany({});

  const marcas = ['Toyota', 'Ford', 'Renault', 'Volkswagen', 'Peugeot', 'Fiat'];
  const tipos = ['Utilitario', 'Camioneta', 'Auto', 'Camión'];
  const TOTAL_VEHICULOS = 15;

  for (let i = 0; i < TOTAL_VEHICULOS; i++) {
    const marca = faker.helpers.arrayElement(marcas);
    const modelo = faker.vehicle.model();
    const anio = faker.date.past({ years: 10 }).getFullYear();
    const zonaAsignada = faker.datatype.boolean() ? faker.helpers.arrayElement(zonas).id : null;

    const kmActual = faker.number.int({ min: 10000, max: 250000 });
    // const proximoServiceKm = kmActual + faker.number.int({ min: 1000, max: 10000 });

    await prisma.vehiculo.create({
      data: {
        patente: faker.vehicle.vrm().toUpperCase(),
        marca: marca,
        modelo: modelo,
        anio: anio,
        tipo: faker.helpers.arrayElement(tipos),
        zonaId: zonaAsignada,
        kilometros: kmActual,
        estado: faker.helpers.arrayElement(['ACTIVO', 'ACTIVO', 'ACTIVO', 'TALLER']),
      },
    });
  }

  // ----------------------------------------------------
  // 5. Catálogo: Materiales con Historial de Precios
  // ----------------------------------------------------
  console.log('📦  Creando Catálogo de Materiales...');
  await prisma.historialPrecio.deleteMany({});
  await prisma.material.deleteMany({});

  const categorias = ['Limpieza', 'Construcción', 'Oficina', 'Seguridad', 'Electrónica'];
  const unidades = ['Unidades', 'Litros', 'Metros', 'Kilos', 'Packs', 'Cajas'];
  const TOTAL_MATERIALES = 30;

  for (let i = 0; i < TOTAL_MATERIALES; i++) {
    const categoria = faker.helpers.arrayElement(categorias);
    const unidad = faker.helpers.arrayElement(unidades);
    const costoBase = Number(faker.commerce.price({ min: 100, max: 5000 }));
    const margen = faker.number.int({ min: 20, max: 60 });
    const precioVenta = costoBase * (1 + margen / 100);

    const material = await prisma.material.create({
      data: {
        codigoArticulo: faker.commerce.isbn(10).toUpperCase(),
        nombre: faker.commerce.productName(),
        descripcion: faker.commerce.productDescription(),
        presentacion: faker.commerce.productMaterial(),
        unidadMedida: unidad,
        categoria: categoria,
        stockMinimo: faker.number.int({ min: 5, max: 50 }),
        // Pricing Actual
        precioCosto: costoBase,
        porcentajeRentabilidad: margen,
        precioVenta: precioVenta,
      },
    });

    // Crear Historial Simulado
    for (let h = 2; h > 0; h--) {
      const costoViejo = costoBase * (1 - h * 0.1); // 10% menos cada vez
      const ventaViejo = costoViejo * (1 + margen / 100);

      await prisma.historialPrecio.create({
        data: {
          materialId: material.id,
          precioCosto: costoViejo,
          precioVenta: ventaViejo,
          porcentajeRentabilidad: margen,
          fechaCambio: faker.date.past({ years: 1 }),
        },
      });
    }
  }

  // ----------------------------------------------------
  // 6. Empleados
  // ----------------------------------------------------
  console.log('👷  Creando Empleados...');
  await prisma.empleado.deleteMany({});

  const tiposEmpleado: ('TECNICO' | 'ADMINISTRATIVO' | 'GERENTE')[] = [
    'TECNICO',
    'ADMINISTRATIVO',
    'GERENTE',
  ];
  const TOTAL_EMPLEADOS = 10;

  for (let i = 0; i < TOTAL_EMPLEADOS; i++) {
    const zonaAleatoria = faker.datatype.boolean() ? faker.helpers.arrayElement(zonas).id : null;

    await prisma.empleado.create({
      data: {
        nombre: faker.person.firstName(),
        apellido: faker.person.lastName(),
        email: faker.internet.email(),
        direccion: faker.location.streetAddress(),
        telefono: faker.phone.number(),
        inicioRelacionLaboral: faker.date.past({ years: 5 }),
        tipo: faker.helpers.arrayElement(tiposEmpleado),
        contratacion: 'CONTRATO_MARCO',
        zonaId: zonaAleatoria,
      },
    });
  }

  console.log('🏁 Seed de prueba finalizado exitosamente.');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });

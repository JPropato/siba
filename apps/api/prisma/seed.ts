import {
  PrismaClient,
  TipoMovimiento,
  MedioPago,
  CategoriaIngreso,
  CategoriaEgreso,
  EstadoMovimiento,
} from '@prisma/client';
import { fakerES as faker } from '@faker-js/faker';

const prisma = new PrismaClient();

async function main() {
  /**
   * ⚠️ ADVERTENCIA DE SEGURIDAD ⚠️
   * Este script de SEED es DESTRUCTIVO y está diseñado solo para DESARROLLO LOCAL.
   * Ejecutar este script borrará todos los datos de las tablas (tickets, clientes, finanzas, etc.).
   *
   * Para entornos de QAS o Producción, usar: npm run db:seed-essentials
   */
  console.log('🌱 Empezando el seed del ecosistema de DESTRUCCIÓN Y PRUEBA (SIBA)...');

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
  // Deletion order: finanzas -> obras -> ordenTrabajo/historial -> Tickets -> Empleado/Vehiculo/Sucursal -> Zona
  console.log('🧹 Limpiando datos antiguos...');
  // Finanzas
  await prisma.movimiento.deleteMany({});
  await prisma.cuentaFinanciera.deleteMany({});
  // Obras
  await prisma.comentarioObra.deleteMany({});
  await prisma.historialEstadoObra.deleteMany({});
  await prisma.archivoObra.deleteMany({});
  await prisma.itemPresupuesto.deleteMany({});
  await prisma.versionPresupuesto.deleteMany({});
  await prisma.obra.deleteMany({});
  // Tickets
  await prisma.ordenTrabajo.deleteMany({});
  await prisma.ticketHistorial.deleteMany({});
  await prisma.ticket.deleteMany({});
  // Maestros
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

  // ----------------------------------------------------
  // 7. Tickets de Servicio
  // ----------------------------------------------------
  console.log('🎫  Creando Tickets de Servicio...');

  const rubrosTicket: ('CIVIL' | 'ELECTRICIDAD' | 'SANITARIOS' | 'VARIOS')[] = [
    'CIVIL',
    'ELECTRICIDAD',
    'SANITARIOS',
    'VARIOS',
  ];
  const prioridadesTicket: ('PROGRAMADO' | 'EMERGENCIA' | 'URGENCIA')[] = [
    'PROGRAMADO',
    'EMERGENCIA',
    'URGENCIA',
  ];
  const estadosTicket: ('NUEVO' | 'PROGRAMADO' | 'EN_CURSO' | 'FINALIZADO')[] = [
    'NUEVO',
    'PROGRAMADO',
    'EN_CURSO',
    'FINALIZADO',
  ];

  const sucursales = await prisma.sucursal.findMany({ take: 20 });
  const empleados = await prisma.empleado.findMany({ where: { tipo: 'TECNICO' } });

  const descripciones = [
    'Reparación de aire acondicionado',
    'Fuga de agua en baño principal',
    'Instalación de luminarias LED',
    'Mantenimiento preventivo eléctrico',
    'Reparación de piso dañado',
    'Cambio de cerraduras de seguridad',
    'Pintura de oficina',
    'Instalación de cámaras de seguridad',
    'Reparación de portón eléctrico',
    'Limpieza de tanque de agua',
    'Arreglo de filtraciones en techo',
    'Instalación de tomacorrientes adicionales',
    'Reparación de sanitarios',
    'Cambio de vidrios rotos',
    'Mantenimiento de ascensor',
    'Reparación de sistema de alarma',
    'Instalación de extractores de aire',
    'Reparación de cañerías',
    'Cambio de tablero eléctrico',
    'Impermeabilización de terraza',
  ];

  const TOTAL_TICKETS = 25;

  for (let i = 0; i < TOTAL_TICKETS; i++) {
    const sucursalAleatoria = faker.helpers.arrayElement(sucursales);
    const tecnicoAleatorio = faker.datatype.boolean(0.7)
      ? faker.helpers.arrayElement(empleados)
      : null;
    const estadoAleatorio = faker.helpers.arrayElement(estadosTicket);

    await prisma.ticket.create({
      data: {
        descripcion: faker.helpers.arrayElement(descripciones),
        codigoCliente: faker.datatype.boolean(0.3) ? `CLI-${faker.string.numeric(4)}` : null,
        trabajo: faker.datatype.boolean(0.5) ? faker.lorem.sentence() : null,
        observaciones: faker.datatype.boolean(0.4) ? faker.lorem.sentences(2) : null,
        rubro: faker.helpers.arrayElement(rubrosTicket),
        prioridad: faker.helpers.arrayElement(prioridadesTicket),
        estado: estadoAleatorio,
        fechaProgramada: estadoAleatorio !== 'NUEVO' ? faker.date.soon({ days: 14 }) : null,
        fechaFinalizacion: estadoAleatorio === 'FINALIZADO' ? faker.date.recent({ days: 7 }) : null,
        sucursalId: sucursalAleatoria.id,
        tecnicoId: tecnicoAleatorio?.id ?? null,
        creadoPorId: adminUser.id,
      },
    });
  }

  // ----------------------------------------------------
  // 8. Finanzas: Bancos y Cuentas
  // ----------------------------------------------------
  console.log('🏦  Creando Bancos y Cuentas Financieras...');

  // Bancos argentinos principales
  const bancosData = [
    { codigo: '011', nombre: 'Banco de la Nación Argentina', nombreCorto: 'Banco Nación' },
    {
      codigo: '007',
      nombre: 'Banco de Galicia y Buenos Aires S.A.U.',
      nombreCorto: 'Banco Galicia',
    },
    {
      codigo: '014',
      nombre: 'Banco de la Provincia de Buenos Aires',
      nombreCorto: 'Banco Provincia',
    },
    { codigo: '017', nombre: 'BBVA Argentina S.A.', nombreCorto: 'BBVA' },
    { codigo: '027', nombre: 'Banco Supervielle S.A.', nombreCorto: 'Supervielle' },
    { codigo: '034', nombre: 'Banco Patagonia S.A.', nombreCorto: 'Banco Patagonia' },
    { codigo: '044', nombre: 'Banco Credicoop Cooperativo Limitado', nombreCorto: 'Credicoop' },
    { codigo: '072', nombre: 'Banco Santander Argentina S.A.', nombreCorto: 'Santander' },
    { codigo: '083', nombre: 'Banco Itaú Argentina S.A.', nombreCorto: 'Itaú' },
    { codigo: '093', nombre: 'Banco ICBC Argentina S.A.', nombreCorto: 'ICBC' },
    { codigo: '191', nombre: 'Banco Hipotecario S.A.', nombreCorto: 'Hipotecario' },
    { codigo: '285', nombre: 'Banco Macro S.A.', nombreCorto: 'Banco Macro' },
    { codigo: '999', nombre: 'Mercado Pago', nombreCorto: 'Mercado Pago' },
  ];

  for (const bancoData of bancosData) {
    await prisma.banco.upsert({
      where: { codigo: bancoData.codigo },
      update: {},
      create: bancoData,
    });
  }

  // Cuentas financieras demo
  const bancoNacion = await prisma.banco.findUnique({ where: { codigo: '011' } });
  const bancoGalicia = await prisma.banco.findUnique({ where: { codigo: '007' } });
  const mercadoPago = await prisma.banco.findUnique({ where: { codigo: '999' } });

  // Caja Chica
  await prisma.cuentaFinanciera.upsert({
    where: { cbu: 'CAJA-CHICA-001' },
    update: {},
    create: {
      nombre: 'Caja Chica Oficina',
      tipo: 'CAJA_CHICA',
      cbu: 'CAJA-CHICA-001',
      saldoInicial: 50000,
      saldoActual: 50000,
    },
  });

  // Cuenta Corriente Banco Nación
  if (bancoNacion) {
    await prisma.cuentaFinanciera.upsert({
      where: { cbu: '01100012345678901234' },
      update: {},
      create: {
        nombre: 'Banco Nación - Cuenta Corriente',
        tipo: 'CUENTA_CORRIENTE',
        bancoId: bancoNacion.id,
        numeroCuenta: '123456789',
        cbu: '01100012345678901234',
        alias: 'bauman.nacion',
        saldoInicial: 500000,
        saldoActual: 500000,
      },
    });
  }

  // Caja de Ahorro Galicia
  if (bancoGalicia) {
    await prisma.cuentaFinanciera.upsert({
      where: { cbu: '00700098765432109876' },
      update: {},
      create: {
        nombre: 'Banco Galicia - Caja de Ahorro',
        tipo: 'CAJA_AHORRO',
        bancoId: bancoGalicia.id,
        numeroCuenta: '987654321',
        cbu: '00700098765432109876',
        alias: 'bauman.galicia',
        saldoInicial: 250000,
        saldoActual: 250000,
      },
    });
  }
  // Mercado Pago
  if (mercadoPago) {
    await prisma.cuentaFinanciera.upsert({
      where: { cbu: '00000000000000000001' },
      update: {},
      create: {
        nombre: 'Mercado Pago',
        tipo: 'BILLETERA_VIRTUAL',
        bancoId: mercadoPago.id,
        cbu: '00000000000000000001',
        alias: 'bauman.mp',
        saldoInicial: 100000,
        saldoActual: 100000,
      },
    });
  }

  // Inversiones Demo
  console.log('📈 Creando inversiones de demo...');

  // Plazo Fijo Banco Nación
  if (bancoNacion) {
    await prisma.cuentaFinanciera.upsert({
      where: { cbu: 'PF-NACION-001' },
      update: {},
      create: {
        nombre: 'Plazo Fijo Banco Nación',
        tipo: 'INVERSION',
        tipoInversion: 'PLAZO_FIJO',
        bancoId: bancoNacion.id,
        cbu: 'PF-NACION-001',
        saldoInicial: 500000,
        saldoActual: 500000,
        tasaAnual: 78.5,
        fechaVencimiento: new Date('2026-02-15'),
      },
    });
  }

  // FCI Galicia
  if (bancoGalicia) {
    await prisma.cuentaFinanciera.upsert({
      where: { cbu: 'FCI-GALICIA-001' },
      update: {},
      create: {
        nombre: 'FCI Galicia Ahorro Plus',
        tipo: 'INVERSION',
        tipoInversion: 'FCI',
        bancoId: bancoGalicia.id,
        cbu: 'FCI-GALICIA-001',
        saldoInicial: 300000,
        saldoActual: 318500,
        tasaAnual: 65,
        // FCI no tiene vencimiento fijo
      },
    });
  }

  // Cauciones Bursátiles
  await prisma.cuentaFinanciera.upsert({
    where: { cbu: 'CAUCION-001' },
    update: {},
    create: {
      nombre: 'Cauciones Colocadoras 7 días',
      tipo: 'INVERSION',
      tipoInversion: 'CAUCIONES',
      cbu: 'CAUCION-001',
      saldoInicial: 200000,
      saldoActual: 200000,
      tasaAnual: 72,
      fechaVencimiento: new Date('2026-01-27'),
    },
  });

  console.log('✅ Inversiones de demo creadas.');

  // ----------------------------------------------------
  // 9. Obras y Presupuestos Demo
  // ----------------------------------------------------
  console.log('🏗️  Creando Obras y Presupuestos de demo...');

  const clientes = await prisma.cliente.findMany({ take: 10 });
  const ticketsFinalizados = await prisma.ticket.findMany({
    where: { estado: 'FINALIZADO' },
    take: 5,
  });

  const tiposObra: ('OBRA_MAYOR' | 'SERVICIO_MENOR')[] = ['OBRA_MAYOR', 'SERVICIO_MENOR'];
  const estadosObra: (
    | 'BORRADOR'
    | 'PRESUPUESTADO'
    | 'APROBADO'
    | 'EN_EJECUCION'
    | 'FINALIZADO'
    | 'FACTURADO'
  )[] = ['BORRADOR', 'PRESUPUESTADO', 'APROBADO', 'EN_EJECUCION', 'FINALIZADO', 'FACTURADO'];

  for (let i = 0; i < 8; i++) {
    const clienteAleatorio = faker.helpers.arrayElement(clientes);
    const tipoAleatorio = faker.helpers.arrayElement(tiposObra);
    const estadoAleatorio = faker.helpers.arrayElement(estadosObra);
    const ticketAsociado = i < ticketsFinalizados.length ? ticketsFinalizados[i] : null;

    const obra = await prisma.obra.create({
      data: {
        codigo: `OBR-${String(i + 1).padStart(5, '0')}`,
        tipo: tipoAleatorio,
        estado: estadoAleatorio,
        titulo: `${faker.commerce.productName()} - ${clienteAleatorio.razonSocial}`,
        descripcion: faker.lorem.paragraph(),
        fechaSolicitud: faker.date.past({ years: 1 }),
        fechaInicioEstimada: faker.date.soon({ days: 30 }),
        clienteId: clienteAleatorio.id,
        sucursalId: faker.helpers.arrayElement(
          await prisma.sucursal.findMany({ where: { clienteId: clienteAleatorio.id } })
        )?.id,
        ticketId: ticketAsociado?.id,
        montoPresupuestado: Number(faker.commerce.price({ min: 50000, max: 500000 })),
        creadoPorId: adminUser.id,
      },
    });

    // Versión de Presupuesto
    const version = await prisma.versionPresupuesto.create({
      data: {
        obraId: obra.id,
        version: 1,
        esVigente: true,
        subtotal: obra.montoPresupuestado,
        total: obra.montoPresupuestado,
        notas: 'Presupuesto inicial generado automáticamente por el seed.',
      },
    });

    // Items del Presupuesto
    for (let j = 0; j < 3; j++) {
      const materialAleatorio = faker.helpers.arrayElement(
        await prisma.material.findMany({ take: 20 })
      );
      const cantidad = faker.number.int({ min: 1, max: 10 });
      const costoUnitario = Number(materialAleatorio.precioCosto);
      const precioUnitario = Number(materialAleatorio.precioVenta);

      await prisma.itemPresupuesto.create({
        data: {
          versionId: version.id,
          tipo: 'MATERIAL',
          orden: j,
          descripcion: materialAleatorio.nombre,
          cantidad: cantidad,
          unidad: materialAleatorio.unidadMedida,
          costoUnitario: costoUnitario,
          precioUnitario: precioUnitario,
          subtotal: precioUnitario * cantidad,
          materialId: materialAleatorio.id,
        },
      });
    }
  }

  console.log('✅ Obras y Presupuestos de demo creadas.');

  // ----------------------------------------------------
  // 10. Movimientos Financieros Demo
  // ----------------------------------------------------
  console.log('💰 Creando movimientos financieros de demo...');

  // Obtener cuentas creadas
  const cajaChica = await prisma.cuentaFinanciera.findFirst({ where: { tipo: 'CAJA_CHICA' } });
  const ctaCorriente = await prisma.cuentaFinanciera.findFirst({
    where: { tipo: 'CUENTA_CORRIENTE' },
  });
  const cajaAhorro = await prisma.cuentaFinanciera.findFirst({ where: { tipo: 'CAJA_AHORRO' } });
  const billeteraVirtual = await prisma.cuentaFinanciera.findFirst({
    where: { tipo: 'BILLETERA_VIRTUAL' },
  });

  // Obtener algunos clientes para vincular
  const clientesParaVincular = await prisma.cliente.findMany({ take: 5 });

  // Movimientos de demostración
  const movimientosDemo = [
    // INGRESOS
    {
      tipo: 'INGRESO',
      monto: 85000,
      fechaMovimiento: new Date('2026-01-15'),
      medioPago: 'TRANSFERENCIA',
      categoriaIngreso: 'COBRO_FACTURA',
      descripcion: 'Cobro Factura FC-001234 - Instalación aire acondicionado',
      comprobante: 'FC-001234',
      cuentaId: ctaCorriente?.id,
      clienteId: clientesParaVincular[0]?.id,
      estado: 'CONFIRMADO',
    },
    {
      tipo: 'INGRESO',
      monto: 120000,
      fechaMovimiento: new Date('2026-01-14'),
      medioPago: 'TRANSFERENCIA',
      categoriaIngreso: 'COBRO_FACTURA',
      descripcion: 'Cobro Factura FC-001233 - Servicio de mantenimiento mensual',
      comprobante: 'FC-001233',
      cuentaId: ctaCorriente?.id,
      clienteId: clientesParaVincular[1]?.id,
      estado: 'CONFIRMADO',
    },
    {
      tipo: 'INGRESO',
      monto: 50000,
      fechaMovimiento: new Date('2026-01-13'),
      medioPago: 'EFECTIVO',
      categoriaIngreso: 'ANTICIPO_CLIENTE',
      descripcion: 'Anticipo para obra de refrigeración industrial',
      cuentaId: cajaChica?.id,
      clienteId: clientesParaVincular[2]?.id,
      estado: 'CONFIRMADO',
    },
    {
      tipo: 'INGRESO',
      monto: 35000,
      fechaMovimiento: new Date('2026-01-10'),
      medioPago: 'MERCADOPAGO',
      categoriaIngreso: 'COBRO_FACTURA',
      descripcion: 'Cobro por reparación urgente - domicilio particular',
      comprobante: 'FC-001230',
      cuentaId: billeteraVirtual?.id,
      estado: 'CONFIRMADO',
    },
    {
      tipo: 'INGRESO',
      monto: 250000,
      fechaMovimiento: new Date('2026-01-08'),
      medioPago: 'CHEQUE',
      categoriaIngreso: 'COBRO_FACTURA',
      descripcion: 'Cobro parcial proyecto climatización edificio corporativo',
      comprobante: 'FC-001228',
      cuentaId: cajaAhorro?.id,
      clienteId: clientesParaVincular[3]?.id,
      estado: 'CONFIRMADO',
    },
    {
      tipo: 'INGRESO',
      monto: 15000,
      fechaMovimiento: new Date('2026-01-05'),
      medioPago: 'EFECTIVO',
      categoriaIngreso: 'REINTEGRO',
      descripcion: 'Reintegro por devolución de materiales no utilizados',
      cuentaId: cajaChica?.id,
      estado: 'CONFIRMADO',
    },
    // EGRESOS
    {
      tipo: 'EGRESO',
      monto: 45000,
      fechaMovimiento: new Date('2026-01-16'),
      medioPago: 'TRANSFERENCIA',
      categoriaEgreso: 'MATERIALES',
      descripcion: 'Compra de gas refrigerante R410A - 10 kg',
      comprobante: 'FC-PROV-5678',
      cuentaId: ctaCorriente?.id,
      estado: 'CONFIRMADO',
    },
    {
      tipo: 'EGRESO',
      monto: 80000,
      fechaMovimiento: new Date('2026-01-15'),
      medioPago: 'TRANSFERENCIA',
      categoriaEgreso: 'MANO_DE_OBRA',
      descripcion: 'Pago a cuadrilla instalación - Obra edificio Libertador',
      cuentaId: ctaCorriente?.id,
      estado: 'CONFIRMADO',
    },
    {
      tipo: 'EGRESO',
      monto: 25000,
      fechaMovimiento: new Date('2026-01-14'),
      medioPago: 'EFECTIVO',
      categoriaEgreso: 'COMBUSTIBLE',
      descripcion: 'Combustible para flota de vehículos - semana 2',
      cuentaId: cajaChica?.id,
      estado: 'CONFIRMADO',
    },
    {
      tipo: 'EGRESO',
      monto: 12500,
      fechaMovimiento: new Date('2026-01-12'),
      medioPago: 'TARJETA_DEBITO',
      categoriaEgreso: 'HERRAMIENTAS',
      descripcion: 'Compra juego de llaves torque y manómetro digital',
      comprobante: 'TK-45678',
      cuentaId: ctaCorriente?.id,
      estado: 'CONFIRMADO',
    },
    {
      tipo: 'EGRESO',
      monto: 8000,
      fechaMovimiento: new Date('2026-01-11'),
      medioPago: 'EFECTIVO',
      categoriaEgreso: 'VIATICOS',
      descripcion: 'Viáticos técnicos - instalación zona norte',
      cuentaId: cajaChica?.id,
      estado: 'CONFIRMADO',
    },
    {
      tipo: 'EGRESO',
      monto: 150000,
      fechaMovimiento: new Date('2026-01-10'),
      medioPago: 'TRANSFERENCIA',
      categoriaEgreso: 'SUBCONTRATISTA',
      descripcion: 'Pago subcontratista - instalación ductos obra industrial',
      comprobante: 'FC-SUB-234',
      cuentaId: ctaCorriente?.id,
      estado: 'CONFIRMADO',
    },
    {
      tipo: 'EGRESO',
      monto: 35000,
      fechaMovimiento: new Date('2026-01-08'),
      medioPago: 'TRANSFERENCIA',
      categoriaEgreso: 'IMPUESTOS',
      descripcion: 'Pago IIBB período diciembre 2025',
      comprobante: 'VEP-AFIP-123',
      cuentaId: ctaCorriente?.id,
      estado: 'CONFIRMADO',
    },
    {
      tipo: 'EGRESO',
      monto: 18500,
      fechaMovimiento: new Date('2026-01-05'),
      medioPago: 'MERCADOPAGO',
      categoriaEgreso: 'SERVICIOS',
      descripcion: 'Suscripción software gestión + telefonía',
      cuentaId: billeteraVirtual?.id,
      estado: 'CONFIRMADO',
    },
    {
      tipo: 'EGRESO',
      monto: 22000,
      fechaMovimiento: new Date('2026-01-03'),
      medioPago: 'TRANSFERENCIA',
      categoriaEgreso: 'MATERIALES',
      descripcion: 'Compra de cañerías de cobre 1/4 y 3/8',
      comprobante: 'FC-PROV-5670',
      cuentaId: ctaCorriente?.id,
      estado: 'CONFIRMADO',
    },
    // PENDIENTES
    {
      tipo: 'INGRESO',
      monto: 180000,
      fechaMovimiento: new Date('2026-01-20'),
      medioPago: 'TRANSFERENCIA',
      categoriaIngreso: 'COBRO_FACTURA',
      descripcion: 'Factura FC-001240 pendiente de cobro',
      comprobante: 'FC-001240',
      cuentaId: ctaCorriente?.id,
      clienteId: clientesParaVincular[4]?.id,
      estado: 'PENDIENTE',
    },
    {
      tipo: 'EGRESO',
      monto: 95000,
      fechaMovimiento: new Date('2026-01-22'),
      medioPago: 'TRANSFERENCIA',
      categoriaEgreso: 'MATERIALES',
      descripcion: 'Orden de compra equipos split inverter x3',
      comprobante: 'OC-789',
      cuentaId: ctaCorriente?.id,
      estado: 'PENDIENTE',
    },
    // MOVIMIENTOS VINCULADOS A OBRAS Y TICKETS
    {
      tipo: 'EGRESO',
      monto: 15000,
      fechaMovimiento: new Date('2026-01-18'),
      medioPago: 'EFECTIVO',
      categoriaEgreso: 'VIATICOS',
      descripcion: 'Viáticos para inicio de Obra OBR-00001',
      cuentaId: cajaChica?.id,
      obraId: (await prisma.obra.findFirst({ where: { codigo: 'OBR-00001' } }))?.id,
      estado: 'CONFIRMADO',
    },
    {
      tipo: 'INGRESO',
      monto: 300000,
      fechaMovimiento: faker.date.recent({ days: 5 }),
      medioPago: 'TRANSFERENCIA',
      categoriaIngreso: 'COBRO_FACTURA',
      descripcion: 'Cobro total Obra OBR-00002',
      comprobante: 'FC-001245',
      cuentaId: ctaCorriente?.id,
      obraId: (await prisma.obra.findFirst({ where: { codigo: 'OBR-00002' } }))?.id,
      estado: 'CONFIRMADO',
    },
    {
      tipo: 'EGRESO',
      monto: 5000,
      fechaMovimiento: faker.date.recent({ days: 3 }),
      medioPago: 'EFECTIVO',
      categoriaEgreso: 'MATERIALES',
      descripcion: 'Compra repuestos urgentes para Ticket Finalizado',
      cuentaId: cajaChica?.id,
      ticketId: (await prisma.ticket.findFirst({ where: { estado: 'FINALIZADO' } }))?.id,
      estado: 'CONFIRMADO',
    },
  ];

  for (const mov of movimientosDemo) {
    if (mov.cuentaId) {
      await prisma.movimiento.create({
        data: {
          tipo: mov.tipo as TipoMovimiento,
          monto: mov.monto,
          fechaMovimiento: mov.fechaMovimiento,
          medioPago: mov.medioPago as MedioPago,
          categoriaIngreso: mov.categoriaIngreso as CategoriaIngreso,
          categoriaEgreso: mov.categoriaEgreso as CategoriaEgreso,
          descripcion: mov.descripcion,
          comprobante: mov.comprobante,
          cuentaId: mov.cuentaId,
          clienteId: mov.clienteId,
          estado: mov.estado as EstadoMovimiento,
          registradoPorId: adminUser.id,
        },
      });
    }
  }

  // Actualizar saldos de las cuentas
  const cuentasActualizar = [cajaChica, ctaCorriente, cajaAhorro, billeteraVirtual].filter(Boolean);
  for (const cuenta of cuentasActualizar) {
    if (!cuenta) continue;

    const ingresos = await prisma.movimiento.aggregate({
      where: { cuentaId: cuenta.id, tipo: 'INGRESO', estado: 'CONFIRMADO' },
      _sum: { monto: true },
    });

    const egresos = await prisma.movimiento.aggregate({
      where: { cuentaId: cuenta.id, tipo: 'EGRESO', estado: 'CONFIRMADO' },
      _sum: { monto: true },
    });

    const saldoActual =
      Number(cuenta.saldoInicial) +
      Number(ingresos._sum.monto || 0) -
      Number(egresos._sum.monto || 0);

    await prisma.cuentaFinanciera.update({
      where: { id: cuenta.id },
      data: { saldoActual },
    });
  }

  console.log('✅ Movimientos financieros creados.');

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

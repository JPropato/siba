import { PrismaClient, EstadoTicket, RubroTicket, PrioridadTicket } from '@prisma/client';
import fs from 'fs';
import path from 'path';
import csv from 'csv-parser';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const prisma = new PrismaClient();
const PATHS = {
  TICKETS: path.join(__dirname, 'tickets.csv'),
  SUCURSALES: path.join(__dirname, 'sucursales.csv'),
  TECNICOS: path.join(__dirname, 'tecnicos.csv'),
  EDIFICIOS: path.join(__dirname, 'edificios.csv'),
};

const ESTADO_MAPPER: Record<string, EstadoTicket> = {
  REALIZADO: 'FINALIZADO',
  'A REALIZAR': 'PROGRAMADO',
  PENDIENTE: 'NUEVO',
  'EN CURSO': 'EN_CURSO',
  PROGRAMADO: 'PROGRAMADO',
  RECHAZADO: 'RECHAZADO',
  CANCELADO: 'CANCELADO',
};

const RUBRO_MAPPER: Record<string, RubroTicket> = {
  CIVIL: 'CIVIL',
  ELECTRICIDAD: 'ELECTRICIDAD',
  SANITARIO: 'SANITARIOS',
  SANITARIOS: 'SANITARIOS',
  VARIOS: 'VARIOS',
  REFRIGERACION: 'REFRIGERACION',
  LIMPIEZA: 'LIMPIEZA',
  TERMINACIONES: 'TERMINACIONES',
};

const PRIORIDAD_MAPPER: Record<string, PrioridadTicket> = {
  NORMAL: 'BAJA',
  MODERADA: 'MEDIA',
  ALTA: 'ALTA',
  'EMERG. ALTA': 'EMERGENCIA',
  'EMERG PROG': 'URGENCIA',
  URGENTE: 'URGENCIA',
  BAJA: 'BAJA',
  MEDIA: 'MEDIA',
};

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
  const START_INDEX = Number(process.env.START) || 0;
  const LIMIT = Number(process.env.LIMIT) || 15000;

  console.log(`🚀 Iniciando ETL TANDA: ${START_INDEX} hasta ${START_INDEX + LIMIT}...`);

  // 1. Restaurar Cliente si no existe (Post-Cleanup)
  let cliente = await prisma.cliente.findFirst({
    where: {
      OR: [{ cuit: '30546662428' }, { razonSocial: 'Correo Argentino S.A.' }, { codigo: 1000 }],
    },
  });

  if (!cliente) {
    console.log('⏳ Re-creando cliente Correo Argentino S.A....');
    cliente = await prisma.cliente.create({
      data: {
        codigo: 1000,
        razonSocial: 'Correo Argentino S.A.',
        cuit: '30546662428',
        email: 'contacto@correoargentino.com.ar',
        telefono: '0810-777-7787',
        direccionFiscal: 'Av. Paseo Colón 746, CABA',
      },
    });
  } else {
    console.log('✅ Cliente Correo Argentino S.A. ya existe.');
  }

  const admin = await prisma.usuario.findFirst({ where: { email: 'admin@bauman.com.ar' } });
  if (!admin) {
    console.error('❌ Admin no encontrado (admin@bauman.com.ar)');
    process.exit(1);
  }

  // 2. Restaurar Maestros (Zonas/Técnicos/Sucursales) si es la primera tanda
  if (START_INDEX === 0) {
    console.log('⏳ Cargando Maestros (Zonas, Técnicos, Sucursales)...');
    const rawSucs = await readCSV(PATHS.SUCURSALES);
    const rawEdificios = await readCSV(PATHS.EDIFICIOS);
    const allSucsRaw = [...rawSucs, ...rawEdificios];

    for (const z of Array.from(
      new Set(allSucsRaw.map((s) => s['ZONAS']?.trim().toUpperCase()).filter(Boolean))
    )) {
      await prisma.zona.upsert({
        where: { nombre: z as string },
        update: {},
        create: { nombre: z as string, descripcion: `Zona importada: ${z}` },
      });
    }
    await prisma.zona.upsert({
      where: { nombre: 'GENERAL' },
      update: {},
      create: { nombre: 'GENERAL' },
    });

    const rawTecs = await readCSV(PATHS.TECNICOS);
    for (const t of rawTecs) {
      const nombreCompleto = t['NOMBRE']?.trim();
      if (!nombreCompleto) continue;
      const email = `${nombreCompleto.replace(/[^a-zA-Z0-9]/g, '.').toLowerCase()}@bauman.com.ar`;

      const zonaNombre = t['ZONA']?.trim().toUpperCase();
      const zona = await prisma.zona.findFirst({ where: { nombre: zonaNombre } });

      await prisma.empleado.upsert({
        where: { email },
        update: { telefono: t['TELEFONO'] || null },
        create: {
          nombre: nombreCompleto.split(' ').slice(1).join(' ') || 'Técnico',
          apellido: nombreCompleto.split(' ')[0] || 'Importado',
          email,
          telefono: t['TELEFONO'] || null,
          tipo: 'TECNICO',
          contratacion: 'CONTRATO_MARCO',
          zonaId:
            zona?.id || (await prisma.zona.findFirst({ where: { nombre: 'GENERAL' } }))?.id || 1,
          inicioRelacionLaboral: new Date(),
        },
      });
    }

    for (const s of allSucsRaw) {
      const nombre = (s['SUCURSALES '] || s['SUCURSALES'])?.trim();
      if (!nombre) continue;

      const sucursalExistente = await prisma.sucursal.findFirst({
        where: { nombre, clienteId: cliente.id },
      });

      if (!sucursalExistente) {
        const zonaNombre = s['ZONAS']?.trim().toUpperCase();
        const zona = await prisma.zona.findFirst({ where: { nombre: zonaNombre } });
        await prisma.sucursal.create({
          data: {
            nombre,
            direccion: s['DIRECCION'] || 'Sin dirección',
            codigoExterno: s['NIS'] || null,
            clienteId: cliente.id,
            zonaId:
              zona?.id || (await prisma.zona.findFirst({ where: { nombre: 'GENERAL' } }))?.id || 1,
          },
        });
      }
    }

    await prisma.sucursal.upsert({
      where: { id: 1 }, // Solo si existe
      update: {},
      create: {
        nombre: 'Sucursal Histórica',
        direccion: 'Varias',
        clienteId: cliente.id,
        zonaId: (await prisma.zona.findFirst({ where: { nombre: 'GENERAL' } }))?.id || 1,
      },
    });
  }

  // Cache de maestros en memoria para velocidad
  const sucursalMap = new Map();
  (await prisma.sucursal.findMany({ where: { clienteId: cliente.id } })).forEach((s) =>
    sucursalMap.set(s.nombre.toUpperCase(), s.id)
  );

  const tecMap = new Map();
  (await prisma.empleado.findMany({})).forEach((t) =>
    tecMap.set(`${t.apellido} ${t.nombre}`.toUpperCase(), t.id)
  );

  const sucFallbackId =
    (await prisma.sucursal.findFirst({ where: { nombre: 'Sucursal Histórica' } }))?.id || 1;

  // 3. Cargar Tickets
  console.log(`⏳ Procesando tickets de la tanda (${START_INDEX})...`);
  const rawTickets = await readCSV(PATHS.TICKETS);
  const batch = rawTickets.slice(START_INDEX, START_INDEX + LIMIT);

  let count = 0;
  for (const row of batch) {
    try {
      const sucNombre = row['SUCURSALES']?.trim().toUpperCase();
      const tecNombre = row['TECNICO REFERENTE']?.trim().toUpperCase();
      const [d, m, y] = (row['FECHA'] || '').split('/');
      const fechaValida = new Date(Number(y), Number(m) - 1, Number(d));

      await prisma.ticket.create({
        data: {
          descripcion: row['TRABAJO'] || 'Sin descripción',
          rubro: RUBRO_MAPPER[row['RUBRO']?.trim().toUpperCase()] || 'VARIOS',
          prioridad: PRIORIDAD_MAPPER[row['PRIORIDAD']?.trim().toUpperCase()] || 'MEDIA',
          estado: ESTADO_MAPPER[row['ESTADO']?.trim().toUpperCase()] || 'NUEVO',
          fechaCreacion: isNaN(fechaValida.getTime()) ? new Date() : fechaValida,
          sucursalId: sucursalMap.get(sucNombre) || sucFallbackId,
          tecnicoId: tecMap.get(tecNombre) || null,
          creadoPorId: admin.id,
        },
      });
      count++;
      if (count % 1000 === 0) console.log(`✅ ${START_INDEX + count} tickets...`);
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : String(err);
      console.error(`❌ Error ticket ${START_INDEX + count}:`, message);
    }
  }

  console.log(`✅ Tanda finalizada. Procesados: ${count}`);
  await prisma.$disconnect();
}

main().catch((err) => {
  console.error('💥 Error Crítico:', err);
  prisma.$disconnect();
});

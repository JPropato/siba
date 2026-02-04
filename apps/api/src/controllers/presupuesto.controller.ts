import { Request, Response } from 'express';
import { z } from 'zod';
import { TipoItemPresupuesto, Prisma, EstadoObra } from '@prisma/client';
import { prisma } from '../lib/prisma.js';
import pdfService from '../services/pdf.service.js';
import storageService from '../services/storage.service.js';

// --- Schemas ---
const createItemSchema = z.object({
  tipo: z.nativeEnum(TipoItemPresupuesto),
  descripcion: z.string().min(1),
  cantidad: z.number().positive(),
  unidad: z.string().min(1),
  costoUnitario: z.number().min(0),
  precioUnitario: z.number().min(0),
  materialId: z.number().int().optional().nullable(),
  orden: z.number().int().optional(),
});

const updateItemSchema = createItemSchema.partial();

const createVersionSchema = z.object({
  notas: z.string().optional().nullable(),
});

// --- Helper: Get current version or create one ---
async function getOrCreateVersion(obraId: number) {
  // Buscar versión vigente
  let version = await prisma.versionPresupuesto.findFirst({
    where: { obraId, esVigente: true },
    include: {
      items: {
        orderBy: { orden: 'asc' },
        include: { material: true },
      },
    },
  });

  // Si no existe, crear versión 1
  if (!version) {
    version = await prisma.versionPresupuesto.create({
      data: {
        obraId,
        version: 1,
        esVigente: true,
      },
      include: {
        items: {
          orderBy: { orden: 'asc' },
          include: { material: true },
        },
      },
    });
  }

  return version;
}

// --- Recalculate version totals ---
async function recalculateVersionTotals(versionId: number) {
  const items = await prisma.itemPresupuesto.findMany({
    where: { versionId },
  });

  const subtotal = items.reduce((acc, item) => acc + Number(item.subtotal), 0);
  // Por ahora sin IVA, total = subtotal
  const total = subtotal;

  await prisma.versionPresupuesto.update({
    where: { id: versionId },
    data: {
      subtotal: new Prisma.Decimal(subtotal),
      total: new Prisma.Decimal(total),
    },
  });

  // Actualizar monto presupuestado en la obra
  const version = await prisma.versionPresupuesto.findUnique({
    where: { id: versionId },
  });
  if (version) {
    await prisma.obra.update({
      where: { id: version.obraId },
      data: { montoPresupuestado: new Prisma.Decimal(total) },
    });
  }

  return { subtotal, total };
}

// --- Controller Methods ---

/**
 * GET /api/obras/:obraId/presupuesto
 * Obtener la versión vigente del presupuesto con todos sus items
 */
export const getPresupuesto = async (req: Request, res: Response) => {
  try {
    const obraId = Number(req.params.obraId);
    const versionId = req.query.versionId ? Number(req.query.versionId) : null;

    let version;
    if (versionId) {
      version = await prisma.versionPresupuesto.findUnique({
        where: { id: versionId },
        include: {
          items: {
            orderBy: { orden: 'asc' },
            include: { material: true },
          },
        },
      });
      if (!version || version.obraId !== obraId) {
        return res.status(404).json({ error: 'Versión no encontrada' });
      }
    } else {
      version = await getOrCreateVersion(obraId);
    }

    res.json(version);
  } catch (error) {
    console.error('Error al obtener presupuesto:', error);
    res.status(500).json({ error: 'Error al obtener presupuesto' });
  }
};

/**
 * GET /api/obras/:obraId/presupuesto/versiones
 * Obtener todas las versiones de presupuesto de una obra
 */
export const getVersiones = async (req: Request, res: Response) => {
  try {
    const obraId = Number(req.params.obraId);

    const versiones = await prisma.versionPresupuesto.findMany({
      where: { obraId },
      orderBy: { version: 'desc' },
      include: {
        _count: { select: { items: true } },
      },
    });

    res.json(versiones);
  } catch (error) {
    console.error('Error al obtener versiones:', error);
    res.status(500).json({ error: 'Error al obtener versiones' });
  }
};

/**
 * POST /api/obras/:obraId/presupuesto/versiones
 * Crear nueva versión (copia de la vigente)
 */
export const createVersion = async (req: Request, res: Response) => {
  try {
    const obraId = Number(req.params.obraId);
    const body = createVersionSchema.parse(req.body);

    // Obtener versión actual
    const currentVersion = await prisma.versionPresupuesto.findFirst({
      where: { obraId, esVigente: true },
      include: { items: true },
    });

    // Determinar número de nueva versión
    const lastVersion = await prisma.versionPresupuesto.findFirst({
      where: { obraId },
      orderBy: { version: 'desc' },
    });
    const newVersionNum = (lastVersion?.version || 0) + 1;

    // Marcar todas las versiones como no vigentes
    await prisma.versionPresupuesto.updateMany({
      where: { obraId },
      data: { esVigente: false },
    });

    // Crear nueva versión
    const newVersion = await prisma.versionPresupuesto.create({
      data: {
        obraId,
        version: newVersionNum,
        esVigente: true,
        notas: body.notas,
        subtotal: currentVersion?.subtotal || 0,
        total: currentVersion?.total || 0,
      },
    });

    // Copiar items de versión anterior
    if (currentVersion?.items.length) {
      const itemsData = currentVersion.items.map((item) => ({
        versionId: newVersion.id,
        tipo: item.tipo,
        orden: item.orden,
        descripcion: item.descripcion,
        cantidad: item.cantidad,
        unidad: item.unidad,
        costoUnitario: item.costoUnitario,
        precioUnitario: item.precioUnitario,
        subtotal: item.subtotal,
        materialId: item.materialId,
      }));

      await prisma.itemPresupuesto.createMany({
        data: itemsData,
      });
    }

    // Retornar versión completa
    const result = await prisma.versionPresupuesto.findUnique({
      where: { id: newVersion.id },
      include: { items: { orderBy: { orden: 'asc' } } },
    });

    res.status(201).json(result);
  } catch (error) {
    console.error('Error al crear versión:', error);
    if (error instanceof z.ZodError) {
      return res.status(400).json({ error: error.errors });
    }
    res.status(500).json({ error: 'Error al crear versión' });
  }
};

/**
 * POST /api/obras/:obraId/presupuesto/items
 * Agregar item al presupuesto vigente
 */
export const addItem = async (req: Request, res: Response) => {
  try {
    const obraId = Number(req.params.obraId);
    const body = createItemSchema.parse(req.body);

    // Obtener o crear versión vigente
    const version = await getOrCreateVersion(obraId);

    // Calcular subtotal del item
    const subtotal = body.cantidad * body.precioUnitario;

    // Determinar orden
    const maxOrden = await prisma.itemPresupuesto.findFirst({
      where: { versionId: version.id },
      orderBy: { orden: 'desc' },
      select: { orden: true },
    });
    const orden = body.orden ?? (maxOrden?.orden || 0) + 1;

    // Crear item
    const item = await prisma.itemPresupuesto.create({
      data: {
        versionId: version.id,
        tipo: body.tipo,
        orden,
        descripcion: body.descripcion,
        cantidad: body.cantidad,
        unidad: body.unidad,
        costoUnitario: body.costoUnitario,
        precioUnitario: body.precioUnitario,
        subtotal,
        materialId: body.materialId,
      },
    });

    // Recalcular totales
    await recalculateVersionTotals(version.id);

    res.status(201).json(item);
  } catch (error) {
    console.error('Error al agregar item:', error);
    if (error instanceof z.ZodError) {
      return res.status(400).json({ error: error.errors });
    }
    res.status(500).json({ error: 'Error al agregar item' });
  }
};

/**
 * PUT /api/obras/:obraId/presupuesto/items/:itemId
 * Actualizar un item
 */
export const updateItem = async (req: Request, res: Response) => {
  try {
    const itemId = Number(req.params.itemId);
    const body = updateItemSchema.parse(req.body);

    const item = await prisma.itemPresupuesto.findUnique({
      where: { id: itemId },
    });

    if (!item) {
      return res.status(404).json({ error: 'Item no encontrado' });
    }

    // Calcular nuevo subtotal si cambian cantidad o precio
    const cantidad = body.cantidad ?? Number(item.cantidad);
    const precioUnitario = body.precioUnitario ?? Number(item.precioUnitario);
    const subtotal = cantidad * precioUnitario;

    const updatedItem = await prisma.itemPresupuesto.update({
      where: { id: itemId },
      data: {
        ...body,
        subtotal,
      },
    });

    // Recalcular totales
    await recalculateVersionTotals(item.versionId);

    res.json(updatedItem);
  } catch (error) {
    console.error('Error al actualizar item:', error);
    if (error instanceof z.ZodError) {
      return res.status(400).json({ error: error.errors });
    }
    res.status(500).json({ error: 'Error al actualizar item' });
  }
};

/**
 * DELETE /api/obras/:obraId/presupuesto/items/:itemId
 * Eliminar un item
 */
export const deleteItem = async (req: Request, res: Response) => {
  try {
    const itemId = Number(req.params.itemId);

    const item = await prisma.itemPresupuesto.findUnique({
      where: { id: itemId },
    });

    if (!item) {
      return res.status(404).json({ error: 'Item no encontrado' });
    }

    await prisma.itemPresupuesto.delete({
      where: { id: itemId },
    });

    // Recalcular totales
    await recalculateVersionTotals(item.versionId);

    res.json({ message: 'Item eliminado' });
  } catch (error) {
    console.error('Error al eliminar item:', error);
    res.status(500).json({ error: 'Error al eliminar item' });
  }
};

/**
 * PUT /api/obras/:obraId/presupuesto/items/reorder
 * Reordenar items
 */
export const reorderItems = async (req: Request, res: Response) => {
  try {
    const obraId = Number(req.params.obraId);
    const { items } = req.body as { items: { id: number; orden: number }[] };

    if (!items || !Array.isArray(items)) {
      return res.status(400).json({ error: 'Se requiere array de items con id y orden' });
    }

    // Obtener versión vigente
    const version = await prisma.versionPresupuesto.findFirst({
      where: { obraId, esVigente: true },
    });

    if (!version) {
      return res.status(404).json({ error: 'No hay versión de presupuesto' });
    }

    // Actualizar orden de cada item
    await Promise.all(
      items.map((item) =>
        prisma.itemPresupuesto.update({
          where: { id: item.id },
          data: { orden: item.orden },
        })
      )
    );

    res.json({ message: 'Items reordenados' });
  } catch (error) {
    console.error('Error al reordenar items:', error);
    res.status(500).json({ error: 'Error al reordenar items' });
  }
};

/**
 * POST /api/obras/:obraId/presupuesto/generar-pdf
 * Genera el PDF del presupuesto y lo guarda en MinIO
 */
export const generarPDF = async (req: Request, res: Response) => {
  try {
    const obraId = Number(req.params.obraId);
    const { versionId } = req.body;

    // 1. Obtener datos de la obra y versión
    const obra = await prisma.obra.findUnique({
      where: { id: obraId },
      include: {
        cliente: true,
        sucursal: true,
      },
    });

    if (!obra) {
      return res.status(404).json({ error: 'Obra no encontrada' });
    }

    const version = versionId
      ? await prisma.versionPresupuesto.findUnique({
          where: { id: versionId },
          include: { items: { orderBy: { orden: 'asc' } } },
        })
      : await prisma.versionPresupuesto.findFirst({
          where: { obraId, esVigente: true },
          include: { items: { orderBy: { orden: 'asc' } } },
        });

    if (!version || version.obraId !== obraId) {
      return res.status(404).json({ error: 'Versión no encontrada' });
    }

    // 2. Preparar datos para el PDF
    const pdfData = {
      codigo: obra.codigo,
      titulo: obra.titulo,
      cliente: obra.cliente.razonSocial,
      sucursal: obra.sucursal?.nombre || undefined,
      fecha: new Date().toLocaleDateString('es-AR'),
      validezDias: obra.validezDias || 30,
      items: version.items.map((item) => ({
        tipo: item.tipo,
        descripcion: item.descripcion,
        cantidad: Number(item.cantidad),
        unidad: item.unidad,
        precioUnitario: Number(item.precioUnitario),
        subtotal: Number(item.subtotal),
      })),
      subtotal: Number(version.subtotal),
      total: Number(version.total),
      condicionesPago: obra.condicionesPago || undefined,
    };

    // 3. Generar Buffer del PDF
    const pdfBuffer = await pdfService.generarPresupuesto(pdfData);

    // 4. Subir a MinIO
    const filename = `Presupuesto_${obra.codigo}_v${version.version}.pdf`;
    const uploadResult = await storageService.uploadBuffer(pdfBuffer, filename, 'application/pdf');

    // 5. Crear registro de ArchivoObra y vincular a la versión
    const archivo = await prisma.archivoObra.create({
      data: {
        obraId,
        tipoArchivo: 'PRESUPUESTO_PDF',
        nombreOriginal: filename,
        nombreStorage: uploadResult.nombreStorage,
        mimeType: 'application/pdf',
        tamanio: uploadResult.tamanio,
        url: uploadResult.url,
      },
    });

    await prisma.versionPresupuesto.update({
      where: { id: version.id },
      data: { archivoPdfId: archivo.id },
    });

    // 6. Cambiar estado de la obra a PRESUPUESTADO si estaba en BORRADOR
    if (obra.estado === EstadoObra.BORRADOR) {
      await prisma.obra.update({
        where: { id: obraId },
        data: { estado: EstadoObra.PRESUPUESTADO },
      });
    }

    res.json({
      success: true,
      message: 'PDF generado correctamente',
      archivo: {
        id: archivo.id,
        url: archivo.url,
        filename: archivo.nombreOriginal,
      },
    });
  } catch (error) {
    console.error('Error al generar PDF:', error);
    res.status(500).json({
      error: 'Error al generar PDF',
      details: error instanceof Error ? error.message : String(error),
    });
  }
};

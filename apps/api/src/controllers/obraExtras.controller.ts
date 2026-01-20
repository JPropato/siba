import { Request, Response } from 'express';
import { prisma } from '../index.js';
import { z } from 'zod';
import multer from 'multer';
import path from 'path';
import fs from 'fs';

// --- Comentarios Controller ---

const CreateComentarioSchema = z.object({
  contenido: z.string().min(1, 'El contenido es requerido'),
});

export const getComentarios = async (req: Request, res: Response) => {
  try {
    const obraId = Number(req.params.obraId);

    const comentarios = await prisma.comentarioObra.findMany({
      where: { obraId },
      include: {
        usuario: {
          select: { id: true, nombre: true, apellido: true },
        },
      },
      orderBy: { fechaCreacion: 'desc' },
    });

    res.json(comentarios);
  } catch (error) {
    console.error('[ComentariosController] Error:', error);
    res.status(500).json({ error: 'Error al obtener comentarios' });
  }
};

export const createComentario = async (req: Request, res: Response) => {
  try {
    const obraId = Number(req.params.obraId);
    const userId = req.user?.id || 1;

    const validatedData = CreateComentarioSchema.parse(req.body);

    const comentario = await prisma.comentarioObra.create({
      data: {
        obraId,
        usuarioId: userId,
        contenido: validatedData.contenido,
      },
      include: {
        usuario: {
          select: { id: true, nombre: true, apellido: true },
        },
      },
    });

    res.status(201).json(comentario);
  } catch (error) {
    console.error('[ComentariosController] Error:', error);
    if (error instanceof z.ZodError) {
      return res.status(400).json({ error: error.errors });
    }
    res.status(500).json({ error: 'Error al crear comentario' });
  }
};

export const deleteComentario = async (req: Request, res: Response) => {
  try {
    const comentarioId = Number(req.params.comentarioId);

    await prisma.comentarioObra.delete({
      where: { id: comentarioId },
    });

    res.status(204).send();
  } catch (error) {
    console.error('[ComentariosController] Error:', error);
    res.status(500).json({ error: 'Error al eliminar comentario' });
  }
};

// --- Historial Controller ---

export const getHistorial = async (req: Request, res: Response) => {
  try {
    const obraId = Number(req.params.obraId);

    const historial = await prisma.historialEstadoObra.findMany({
      where: { obraId },
      include: {
        usuario: {
          select: { id: true, nombre: true, apellido: true },
        },
      },
      orderBy: { fechaCambio: 'desc' },
    });

    res.json(historial);
  } catch (error) {
    console.error('[HistorialController] Error:', error);
    res.status(500).json({ error: 'Error al obtener historial' });
  }
};

// --- Archivos Controller ---

// Configurar multer para subida de archivos
const uploadsDir = path.join(process.cwd(), 'uploads', 'obras');
if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir, { recursive: true });
}

const storage = multer.diskStorage({
  destination: (_req, _file, cb) => {
    cb(null, uploadsDir);
  },
  filename: (_req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1e9);
    const ext = path.extname(file.originalname);
    cb(null, `obra-${uniqueSuffix}${ext}`);
  },
});

export const upload = multer({
  storage,
  limits: { fileSize: 10 * 1024 * 1024 }, // 10MB
  fileFilter: (_req, file, cb) => {
    const allowedMimes = [
      'image/jpeg',
      'image/png',
      'image/gif',
      'image/webp',
      'application/pdf',
      'application/msword',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      'application/vnd.ms-excel',
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    ];
    if (allowedMimes.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error('Tipo de archivo no permitido'));
    }
  },
});

export const getArchivos = async (req: Request, res: Response) => {
  try {
    const obraId = Number(req.params.obraId);

    const archivos = await prisma.archivoObra.findMany({
      where: { obraId },
      orderBy: { fechaCreacion: 'desc' },
    });

    res.json(archivos);
  } catch (error) {
    console.error('[ArchivosController] Error:', error);
    res.status(500).json({ error: 'Error al obtener archivos' });
  }
};

export const uploadArchivo = async (req: Request, res: Response) => {
  try {
    const obraId = Number(req.params.obraId);
    const file = req.file;
    const tipoArchivo = req.body.tipoArchivo || 'OTRO';

    if (!file) {
      return res.status(400).json({ error: 'No se proporcionó archivo' });
    }

    const archivo = await prisma.archivoObra.create({
      data: {
        obraId,
        tipoArchivo,
        nombreOriginal: file.originalname,
        nombreStorage: file.filename,
        mimeType: file.mimetype,
        tamanio: file.size,
        url: `/uploads/obras/${file.filename}`,
      },
    });

    res.status(201).json(archivo);
  } catch (error) {
    console.error('[ArchivosController] Error:', error);
    res.status(500).json({ error: 'Error al subir archivo' });
  }
};

export const deleteArchivo = async (req: Request, res: Response) => {
  try {
    const archivoId = Number(req.params.archivoId);

    const archivo = await prisma.archivoObra.findUnique({
      where: { id: archivoId },
    });

    if (!archivo) {
      return res.status(404).json({ error: 'Archivo no encontrado' });
    }

    // Eliminar archivo físico
    const filePath = path.join(uploadsDir, archivo.nombreStorage);
    if (fs.existsSync(filePath)) {
      fs.unlinkSync(filePath);
    }

    // Eliminar registro
    await prisma.archivoObra.delete({
      where: { id: archivoId },
    });

    res.status(204).send();
  } catch (error) {
    console.error('[ArchivosController] Error:', error);
    res.status(500).json({ error: 'Error al eliminar archivo' });
  }
};

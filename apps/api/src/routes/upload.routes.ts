import { Router } from 'express';
import multer from 'multer';
import { PrismaClient } from '@prisma/client';
import storageService from '../services/storage.service.js';

const router = Router();
const prisma = new PrismaClient();

// Configure multer for memory storage
const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 10 * 1024 * 1024, // 10MB limit
  },
  fileFilter: (_req, file, cb) => {
    // Allow images and common document types
    const allowedMimes = [
      'image/jpeg',
      'image/png',
      'image/gif',
      'image/webp',
      'application/pdf',
      'application/msword',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    ];

    if (allowedMimes.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error(`Tipo de archivo no permitido: ${file.mimetype}`));
    }
  },
});

/**
 * POST /api/upload
 * Upload a single file to MinIO
 */
router.post('/', upload.single('file'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'No se proporcionó ningún archivo' });
    }

    // Upload to MinIO
    const fileData = await storageService.uploadFile(req.file);

    // Save reference in database
    const archivo = await prisma.archivo.create({
      data: {
        nombreOriginal: fileData.nombreOriginal,
        nombreStorage: fileData.nombreStorage,
        mimeType: fileData.mimeType,
        tamanio: fileData.tamanio,
        bucket: fileData.bucket,
        url: fileData.url,
        ordenTrabajoId: req.body.ordenTrabajoId ? parseInt(req.body.ordenTrabajoId, 10) : null,
        ticketId: req.body.ticketId ? parseInt(req.body.ticketId, 10) : null,
      },
    });

    return res.status(201).json({
      success: true,
      data: archivo,
    });
  } catch (error) {
    console.error('[Upload] Error:', error);
    return res.status(500).json({
      error: error instanceof Error ? error.message : 'Error al subir archivo',
    });
  }
});

/**
 * DELETE /api/upload/:id
 * Delete a file from MinIO and database
 */
router.delete('/:id', async (req, res) => {
  try {
    const id = parseInt(req.params.id, 10);

    const archivo = await prisma.archivo.findUnique({ where: { id } });
    if (!archivo) {
      return res.status(404).json({ error: 'Archivo no encontrado' });
    }

    // Delete from MinIO
    await storageService.deleteFile(archivo.nombreStorage, archivo.bucket);

    // Delete from database
    await prisma.archivo.delete({ where: { id } });

    return res.json({ success: true, message: 'Archivo eliminado' });
  } catch (error) {
    console.error('[Upload] Delete Error:', error);
    return res.status(500).json({
      error: error instanceof Error ? error.message : 'Error al eliminar archivo',
    });
  }
});

export default router;

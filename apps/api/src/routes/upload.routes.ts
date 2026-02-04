import { Router } from 'express';
import multer from 'multer';
import { PrismaClient } from '@prisma/client';
import { fileTypeFromBuffer } from 'file-type';
import storageService from '../services/storage.service.js';
import { authenticateToken } from '../middlewares/auth.middleware.js';

const router = Router();
const prisma = new PrismaClient();

// Proteger TODAS las rutas de upload con autenticación
router.use(authenticateToken);

/**
 * Valida el archivo usando magic bytes (contenido real)
 * Previene archivos maliciosos disfrazados con MIME type falso
 */
async function validateFileUpload(file: Express.Multer.File) {
  // 1. Validar MIME type declarado
  const allowedMimeTypes = [
    'image/jpeg',
    'image/png',
    'image/gif',
    'image/webp',
    'application/pdf',
    'application/msword',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  ];

  if (!allowedMimeTypes.includes(file.mimetype)) {
    throw new Error(`Tipo de archivo declarado no permitido: ${file.mimetype}`);
  }

  // 2. Validar contenido real (magic bytes)
  const fileType = await fileTypeFromBuffer(file.buffer);

  if (!fileType) {
    throw new Error('No se pudo determinar el tipo de archivo desde su contenido');
  }

  const allowedExtensions = ['jpg', 'jpeg', 'png', 'gif', 'webp', 'pdf', 'doc', 'docx'];
  if (!allowedExtensions.includes(fileType.ext)) {
    throw new Error(
      `Tipo de archivo real no permitido: ${fileType.ext}. El contenido del archivo no coincide con los tipos permitidos.`
    );
  }

  // 3. Validar que el MIME declarado coincida con el real
  if (file.mimetype !== fileType.mime) {
    // Para algunos casos, el MIME puede variar ligeramente (ej: image/jpg vs image/jpeg)
    const mimeVariants: Record<string, string[]> = {
      'image/jpeg': ['image/jpeg', 'image/jpg'],
    };

    const declaredVariants = mimeVariants[fileType.mime] || [fileType.mime];
    if (!declaredVariants.includes(file.mimetype)) {
      throw new Error(
        `MIME type declarado (${file.mimetype}) no coincide con el contenido real (${fileType.mime})`
      );
    }
  }

  // 4. Sanitizar nombre de archivo
  const sanitizedFilename = file.originalname
    .replace(/[^a-zA-Z0-9.-]/g, '_') // Solo alfanuméricos, puntos y guiones
    .replace(/\.{2,}/g, '.') // Prevenir ../ path traversal
    .substring(0, 255); // Limitar longitud

  return {
    isValid: true,
    mimeType: fileType.mime,
    extension: fileType.ext,
    sanitizedFilename,
  };
}

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

    // Validar archivo con magic bytes
    const validation = await validateFileUpload(req.file);
    if (!validation.isValid) {
      return res.status(400).json({ error: 'Archivo no válido' });
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

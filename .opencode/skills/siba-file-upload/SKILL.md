---
name: siba-file-upload
description: Patrones para subir archivos con MinIO, drag & drop y previews
---

# SIBA File Upload

Lineamientos para implementar carga de archivos en SIBA.

## Cuándo Usar

- Subir **imágenes o documentos**
- Implementar **drag & drop**
- Mostrar **previews** de archivos
- Gestionar archivos en **MinIO/S3**

---

## Arquitectura

```
Frontend                    Backend                     MinIO
┌──────────┐               ┌──────────┐               ┌──────────┐
│ Dropzone │──multipart───>│ Multer   │──putObject───>│ Bucket   │
│          │               │          │               │          │
│ Preview  │<──url────────-│ Storage  │<──getUrl─────-│          │
└──────────┘               │ Service  │               └──────────┘
                           └──────────┘
```

---

## Backend: Storage Service

```typescript
// services/storage.service.ts
import { Client } from 'minio';

const minio = new Client({
  endPoint: process.env.STORAGE_ENDPOINT!,
  port: Number(process.env.STORAGE_PORT),
  useSSL: process.env.NODE_ENV === 'production',
  accessKey: process.env.STORAGE_ACCESS_KEY!,
  secretKey: process.env.STORAGE_SECRET_KEY!,
});

const BUCKET = process.env.STORAGE_BUCKET!;

export const storageService = {
  // Subir archivo
  async upload(file: Express.Multer.File, folder: string): Promise<string> {
    const fileName = `${folder}/${Date.now()}-${file.originalname}`;

    await minio.putObject(BUCKET, fileName, file.buffer, file.size, {
      'Content-Type': file.mimetype,
    });

    return fileName;
  },

  // Obtener URL temporal (signed)
  async getUrl(fileName: string, expirySeconds = 3600): Promise<string> {
    return minio.presignedGetObject(BUCKET, fileName, expirySeconds);
  },

  // Eliminar archivo
  async delete(fileName: string): Promise<void> {
    await minio.removeObject(BUCKET, fileName);
  },
};
```

---

## Backend: Route con Multer

```typescript
// routes/upload.routes.ts
import { Router } from 'express';
import multer from 'multer';
import { storageService } from '../services/storage.service';

const router = Router();

// Configurar multer (memoria)
const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 10 * 1024 * 1024 }, // 10MB
  fileFilter: (req, file, cb) => {
    const allowedTypes = ['image/jpeg', 'image/png', 'image/webp', 'application/pdf'];
    if (allowedTypes.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error('Tipo de archivo no permitido'));
    }
  },
});

// Subir un archivo
router.post('/single', upload.single('file'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'No se recibió archivo' });
    }

    const folder = req.body.folder || 'uploads';
    const fileName = await storageService.upload(req.file, folder);
    const url = await storageService.getUrl(fileName);

    res.json({ fileName, url });
  } catch (error) {
    res.status(500).json({ error: 'Error al subir archivo' });
  }
});

// Subir múltiples archivos
router.post('/multiple', upload.array('files', 5), async (req, res) => {
  try {
    const files = req.files as Express.Multer.File[];
    const folder = req.body.folder || 'uploads';

    const results = await Promise.all(
      files.map(async (file) => {
        const fileName = await storageService.upload(file, folder);
        const url = await storageService.getUrl(fileName);
        return { fileName, url, originalName: file.originalname };
      })
    );

    res.json({ files: results });
  } catch (error) {
    res.status(500).json({ error: 'Error al subir archivos' });
  }
});

export default router;
```

---

## Frontend: Componente Dropzone

```tsx
// components/ui/FileDropzone.tsx
import { useCallback, useState } from 'react';
import { Upload, X, File, Image } from 'lucide-react';
import { cn } from '@/lib/utils';

interface FileDropzoneProps {
  onFilesSelected: (files: File[]) => void;
  accept?: string;
  multiple?: boolean;
  maxSize?: number; // bytes
  className?: string;
}

export const FileDropzone = ({
  onFilesSelected,
  accept = 'image/*,application/pdf',
  multiple = false,
  maxSize = 10 * 1024 * 1024,
  className,
}: FileDropzoneProps) => {
  const [isDragOver, setIsDragOver] = useState(false);

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      setIsDragOver(false);

      const files = Array.from(e.dataTransfer.files);
      const validFiles = files.filter((f) => f.size <= maxSize);

      if (validFiles.length > 0) {
        onFilesSelected(multiple ? validFiles : [validFiles[0]]);
      }
    },
    [onFilesSelected, multiple, maxSize]
  );

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    onFilesSelected(files);
  };

  return (
    <div
      onDragOver={(e) => {
        e.preventDefault();
        setIsDragOver(true);
      }}
      onDragLeave={() => setIsDragOver(false)}
      onDrop={handleDrop}
      className={cn(
        'border-2 border-dashed rounded-xl p-8 text-center transition-colors cursor-pointer',
        isDragOver
          ? 'border-brand bg-brand/5'
          : 'border-slate-200 dark:border-slate-700 hover:border-brand',
        className
      )}
    >
      <input
        type="file"
        accept={accept}
        multiple={multiple}
        onChange={handleInputChange}
        className="hidden"
        id="file-input"
      />
      <label htmlFor="file-input" className="cursor-pointer">
        <Upload className="h-10 w-10 mx-auto text-slate-400 mb-4" />
        <p className="text-slate-600 dark:text-slate-400">
          Arrastrá archivos aquí o <span className="text-brand font-semibold">buscá</span>
        </p>
        <p className="text-sm text-slate-400 mt-1">Máximo {Math.round(maxSize / 1024 / 1024)}MB</p>
      </label>
    </div>
  );
};
```

---

## Frontend: Preview de Archivo

```tsx
// components/ui/FilePreview.tsx
interface FilePreviewProps {
  file: File | { url: string; name: string };
  onRemove?: () => void;
}

export const FilePreview = ({ file, onRemove }: FilePreviewProps) => {
  const isImage =
    'type' in file ? file.type.startsWith('image/') : file.url.match(/\.(jpg|jpeg|png|webp|gif)$/i);

  const url = 'url' in file ? file.url : URL.createObjectURL(file);
  const name = 'name' in file ? file.name : file.name;

  return (
    <div className="relative group border rounded-lg p-2 flex items-center gap-3">
      {isImage ? (
        <img src={url} alt={name} className="h-12 w-12 object-cover rounded" />
      ) : (
        <div className="h-12 w-12 bg-slate-100 dark:bg-slate-800 rounded flex items-center justify-center">
          <File className="h-6 w-6 text-slate-400" />
        </div>
      )}

      <span className="text-sm truncate flex-1">{name}</span>

      {onRemove && (
        <button onClick={onRemove} className="p-1 hover:bg-red-100 rounded-full text-red-500">
          <X className="h-4 w-4" />
        </button>
      )}
    </div>
  );
};
```

---

## Hook de Upload

```tsx
// hooks/useFileUpload.ts
import { useState } from 'react';
import { api } from '@/lib/api';
import { toast } from 'sonner';

export const useFileUpload = (folder = 'uploads') => {
  const [isUploading, setIsUploading] = useState(false);
  const [progress, setProgress] = useState(0);

  const upload = async (files: File[]): Promise<{ fileName: string; url: string }[]> => {
    setIsUploading(true);
    setProgress(0);

    try {
      const formData = new FormData();
      formData.append('folder', folder);
      files.forEach((f) => formData.append('files', f));

      const response = await api.post('/upload/multiple', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
        onUploadProgress: (e) => {
          setProgress(Math.round((e.loaded * 100) / (e.total || 1)));
        },
      });

      toast.success('Archivos subidos correctamente');
      return response.data.files;
    } catch (error) {
      toast.error('Error al subir archivos');
      throw error;
    } finally {
      setIsUploading(false);
    }
  };

  return { upload, isUploading, progress };
};
```

---

## Checklist

- [ ] MinIO configurado con bucket creado
- [ ] Multer con límites de tamaño y tipos
- [ ] Storage service para upload/download/delete
- [ ] Dropzone con drag & drop
- [ ] Preview de imágenes y archivos
- [ ] Progress bar durante upload
- [ ] Validación de tipos y tamaño en frontend y backend

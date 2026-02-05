import {
  Loader2,
  CloudUpload,
  AlertCircle,
  Eye,
  Trash2,
  FileText,
  FileIcon,
  Paperclip,
} from 'lucide-react';
import { useState, useRef, useCallback } from 'react';
import type { Archivo } from '../types';

interface FileUploadProps {
  onUpload: (file: File) => Promise<Archivo>;
  onDelete?: (fileId: number) => Promise<void>;
  files?: Archivo[];
  maxFiles?: number;
  accept?: string;
  disabled?: boolean;
}

export default function FileUpload({
  onUpload,
  onDelete,
  files = [],
  maxFiles = 5,
  accept = 'image/*,application/pdf',
  disabled = false,
}: FileUploadProps) {
  const [isDragging, setIsDragging] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const handleFiles = useCallback(
    async (fileList: FileList) => {
      if (files.length >= maxFiles) {
        setError(`Máximo ${maxFiles} archivos permitidos`);
        return;
      }

      setError(null);
      setIsUploading(true);

      try {
        for (const file of Array.from(fileList)) {
          if (files.length >= maxFiles) break;
          await onUpload(file);
        }
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Error al subir archivo');
      } finally {
        setIsUploading(false);
      }
    },
    [files.length, maxFiles, onUpload]
  );

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      setIsDragging(false);
      if (e.dataTransfer.files.length > 0) {
        handleFiles(e.dataTransfer.files);
      }
    },
    [handleFiles]
  );

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = () => {
    setIsDragging(false);
  };

  const handleClick = () => {
    inputRef.current?.click();
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      handleFiles(e.target.files);
    }
  };

  const handleRemove = async (fileId: number) => {
    if (onDelete) {
      try {
        await onDelete(fileId);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Error al eliminar archivo');
      }
    }
  };

  const formatSize = (bytes: number) => {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  };

  const isImage = (mimeType: string) => mimeType.startsWith('image/');

  return (
    <div className="space-y-4">
      {/* Drop Zone */}
      <div
        onClick={handleClick}
        onDrop={handleDrop}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        className={`
          relative border-2 border-dashed rounded-xl p-8 text-center cursor-pointer
          transition-all duration-200
          ${
            isDragging
              ? 'border-gold bg-gold/10'
              : 'border-slate-300 dark:border-slate-700 hover:border-gold/50'
          }
          ${disabled ? 'opacity-50 cursor-not-allowed' : ''}
        `}
      >
        <input
          ref={inputRef}
          type="file"
          accept={accept}
          multiple
          onChange={handleInputChange}
          className="hidden"
          disabled={disabled}
        />

        {isUploading ? (
          <div className="flex flex-col items-center gap-2">
            <Loader2 className="h-8 w-8 animate-spin" />
            <p className="text-sm text-slate-500">Subiendo...</p>
          </div>
        ) : (
          <div className="flex flex-col items-center gap-2">
            <div className="size-12 rounded-full bg-gold/10 flex items-center justify-center">
              <CloudUpload className="h-6 w-6 text-gold" />
            </div>
            <p className="text-sm font-medium text-slate-700 dark:text-slate-300">
              Arrastrá archivos aquí o hacé click
            </p>
            <p className="text-xs text-slate-400">Imágenes y PDF · Máx. 10MB</p>
          </div>
        )}
      </div>

      {/* Error */}
      {error && (
        <div className="flex items-center gap-2 px-3 py-2 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg">
          <AlertCircle className="h-[18px] w-[18px] text-red-500" />
          <p className="text-sm text-red-600 dark:text-red-400">{error}</p>
        </div>
      )}

      {/* File List */}
      {files.length > 0 && (
        <div className="space-y-2">
          {files.map((file) => (
            <div
              key={file.id}
              className="flex items-center gap-3 p-3 bg-slate-50 dark:bg-slate-900 rounded-lg border border-slate-200 dark:border-slate-800"
            >
              {/* Thumbnail or Icon */}
              {isImage(file.mimeType) && file.url ? (
                <img
                  src={file.url}
                  alt={file.nombreOriginal}
                  className="size-10 rounded object-cover"
                />
              ) : (
                <div className="size-10 rounded bg-slate-200 dark:bg-slate-800 flex items-center justify-center">
                  {file.mimeType === 'application/pdf' ? (
                    <FileIcon className="h-5 w-5 text-slate-500" />
                  ) : (
                    <Paperclip className="h-5 w-5 text-slate-500" />
                  )}
                </div>
              )}

              {/* File Info */}
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-slate-700 dark:text-slate-300 truncate">
                  {file.nombreOriginal}
                </p>
                <p className="text-xs text-slate-400">{formatSize(file.tamanio)}</p>
              </div>

              {/* Actions */}
              <div className="flex items-center gap-1">
                {file.url && (
                  <a
                    href={file.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="p-2 text-slate-400 hover:text-gold hover:bg-gold/10 rounded-lg transition-colors"
                    title="Ver archivo"
                    aria-label="Ver archivo"
                  >
                    <Eye className="h-[18px] w-[18px]" />
                  </a>
                )}
                {onDelete && (
                  <button
                    onClick={() => handleRemove(file.id)}
                    className="p-2 text-slate-400 hover:text-red-500 hover:bg-red-500/10 rounded-lg transition-colors"
                    title="Eliminar"
                    aria-label="Eliminar"
                  >
                    <Trash2 className="h-[18px] w-[18px]" />
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

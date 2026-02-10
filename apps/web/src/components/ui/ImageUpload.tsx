import { useRef, useState, useCallback } from 'react';
import { Upload, X, Loader2, User } from 'lucide-react';
import api from '../../lib/api';

interface ImageUploadProps {
  value?: string | null;
  onChange: (url: string | null) => void;
  label?: string;
  disabled?: boolean;
}

export function ImageUpload({ value, onChange, label, disabled }: ImageUploadProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleFileSelect = useCallback(
    async (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (!file) return;

      // Validate client-side
      const maxSize = 5 * 1024 * 1024; // 5MB
      if (file.size > maxSize) {
        setError('La imagen no puede superar 5MB');
        return;
      }

      if (!file.type.startsWith('image/')) {
        setError('Solo se permiten imágenes');
        return;
      }

      setError(null);
      setIsUploading(true);

      try {
        const formData = new FormData();
        formData.append('file', file);

        const res = await api.post('/upload', formData, {
          headers: { 'Content-Type': 'multipart/form-data' },
        });

        onChange(res.data.data.url);
      } catch {
        setError('Error al subir la imagen');
      } finally {
        setIsUploading(false);
        // Reset input so same file can be re-selected
        if (inputRef.current) inputRef.current.value = '';
      }
    },
    [onChange]
  );

  const handleRemove = useCallback(() => {
    onChange(null);
    setError(null);
  }, [onChange]);

  return (
    <div className="space-y-1">
      {label && (
        <label className="block text-sm font-medium text-slate-700 dark:text-slate-300">
          {label}
        </label>
      )}
      <div className="flex items-center gap-4">
        {/* Preview */}
        <div
          className="relative h-20 w-20 shrink-0 overflow-hidden rounded-full border-2 border-dashed border-slate-200 bg-slate-50 dark:border-slate-700 dark:bg-slate-800 cursor-pointer group"
          onClick={() => !disabled && !isUploading && inputRef.current?.click()}
        >
          {isUploading ? (
            <div className="flex h-full w-full items-center justify-center">
              <Loader2 className="h-6 w-6 animate-spin text-slate-400" />
            </div>
          ) : value ? (
            <>
              <img src={value} alt="Foto" className="h-full w-full object-cover" />
              <div className="absolute inset-0 flex items-center justify-center bg-black/40 opacity-0 transition-opacity group-hover:opacity-100">
                <Upload className="h-5 w-5 text-white" />
              </div>
            </>
          ) : (
            <div className="flex h-full w-full items-center justify-center text-slate-300 dark:text-slate-600 group-hover:text-slate-400 transition-colors">
              <User className="h-8 w-8" />
            </div>
          )}
        </div>

        {/* Actions */}
        <div className="flex flex-col gap-1">
          <button
            type="button"
            disabled={disabled || isUploading}
            onClick={() => inputRef.current?.click()}
            className="text-sm font-medium text-brand hover:text-brand/80 disabled:text-slate-400 disabled:cursor-not-allowed transition-colors text-left"
          >
            {value ? 'Cambiar foto' : 'Subir foto'}
          </button>
          {value && (
            <button
              type="button"
              disabled={disabled || isUploading}
              onClick={handleRemove}
              className="flex items-center gap-1 text-xs text-red-500 hover:text-red-600 disabled:text-slate-400 transition-colors"
            >
              <X className="h-3 w-3" />
              Quitar
            </button>
          )}
          <span className="text-xs text-slate-400">JPG, PNG o WebP. Máx 5MB</span>
        </div>
      </div>

      {error && <p className="text-xs text-red-500 mt-1">{error}</p>}

      <input
        ref={inputRef}
        type="file"
        accept="image/jpeg,image/png,image/webp,image/gif"
        onChange={handleFileSelect}
        className="hidden"
      />
    </div>
  );
}

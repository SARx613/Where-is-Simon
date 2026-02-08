'use client';

import { useState, useRef } from 'react';
import { createClient } from '@/lib/supabase';
import { Database } from '@/types/supabase';
import { Upload, X, Loader, AlertCircle } from 'lucide-react';
import heic2any from 'heic2any';

type Photo = Database['public']['Tables']['photos']['Row'];

interface PhotoUploadProps {
  eventId: string;
  onUploadComplete: () => void;
  onPhotoUploaded?: (photo: Photo) => void;
}

export default function PhotoUpload({ eventId, onUploadComplete, onPhotoUploaded }: PhotoUploadProps) {
  const [dragActive, setDragActive] = useState(false);
  const [files, setFiles] = useState<File[]>([]);
  const [uploading, setUploading] = useState(false);
  const [progress, setProgress] = useState<{ [key: string]: string }>({}); // filename -> status
  const supabase = createClient();
  const inputRef = useRef<HTMLInputElement>(null);

  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setDragActive(true);
    } else if (e.type === 'dragleave') {
      setDragActive(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      handleFiles(Array.from(e.dataTransfer.files));
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    e.preventDefault();
    if (e.target.files && e.target.files.length > 0) {
      handleFiles(Array.from(e.target.files));
    }
  };

  const handleFiles = (newFiles: File[]) => {
    // Accept images + HEIC
    const validFiles = newFiles.filter(file =>
      file.type.startsWith('image/') ||
      file.name.toLowerCase().endsWith('.heic') ||
      file.name.toLowerCase().endsWith('.heif')
    );
    setFiles(prev => [...prev, ...validFiles]);
  };

  const removeFile = (index: number) => {
    setFiles(prev => prev.filter((_, i) => i !== index));
  };

  // Helper to resize and compress image
  const processImage = async (file: File): Promise<{ file: File, width: number, height: number }> => {
    let srcFile = file;

    // 1. Convert HEIC if needed
    if (file.name.toLowerCase().endsWith('.heic') || file.name.toLowerCase().endsWith('.heif')) {
       try {
        const convertedBlob = await heic2any({
          blob: file,
          toType: 'image/jpeg',
          quality: 0.8
        });
        const blob = Array.isArray(convertedBlob) ? convertedBlob[0] : convertedBlob;
        srcFile = new File([blob], file.name.replace(/\.(heic|heif)$/i, '.jpg'), { type: 'image/jpeg' });
      } catch (e) {
        throw new Error(`Échec conversion HEIC: ${e instanceof Error ? e.message : String(e)}`);
      }
    }

    // 2. Resize & Compress using Canvas
    return new Promise((resolve, reject) => {
      const img = new Image();
      const objectUrl = URL.createObjectURL(srcFile);

      img.onload = () => {
        URL.revokeObjectURL(objectUrl);

        const MAX_SIZE = 1920;
        let width = img.naturalWidth;
        let height = img.naturalHeight;

        if (width > MAX_SIZE || height > MAX_SIZE) {
          if (width > height) {
            height = Math.round(height * (MAX_SIZE / width));
            width = MAX_SIZE;
          } else {
            width = Math.round(width * (MAX_SIZE / height));
            height = MAX_SIZE;
          }
        }

        const canvas = document.createElement('canvas');
        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext('2d');
        if (!ctx) {
          reject(new Error("Canvas context not available"));
          return;
        }

        ctx.drawImage(img, 0, 0, width, height);

        canvas.toBlob((blob) => {
          if (!blob) {
             reject(new Error("Compression failed"));
             return;
          }
          const processedFile = new File([blob], srcFile.name.replace(/\.[^/.]+$/, ".jpg"), {
            type: 'image/jpeg',
            lastModified: Date.now(),
          });
          resolve({ file: processedFile, width, height });
        }, 'image/jpeg', 0.8);
      };

      img.onerror = () => {
         URL.revokeObjectURL(objectUrl);
         reject(new Error("Impossible de lire l'image"));
      };

      img.src = objectUrl;
    });
  };

  const uploadFiles = async () => {
    setUploading(true);
    let hasErrors = false;

    // Process files sequentially
    for (const file of files) {
      const statusKey = file.name;
      // Skip if already marked done (in case of retry logic, though not fully impl here)
      if (progress[statusKey] === 'Terminé') continue;

      setProgress(prev => ({ ...prev, [statusKey]: 'Compression...' }));

      try {
        // Standardize & Compress
        const { file: fileToUpload, width, height } = await processImage(file);

        // Upload to Storage
        setProgress(prev => ({ ...prev, [statusKey]: 'Upload...' }));
        const fileExt = 'jpg'; // We force everything to jpg
        const fileName = `${eventId}/${Math.random().toString(36).substring(2)}.${fileExt}`;

        const { error: uploadError } = await supabase.storage
          .from('photos')
          .upload(fileName, fileToUpload);

        if (uploadError) {
          throw new Error(`Erreur Upload: ${uploadError.message}`);
        }

        const { data: { publicUrl } } = supabase.storage
          .from('photos')
          .getPublicUrl(fileName);

        // Insert into DB
        // NOTE: We assume 'status' column exists now. If not, this might fail, but we added it to schema.
        const { data: photoData, error: dbError } = await supabase
          .from('photos')
          .insert({
            event_id: eventId,
            url: publicUrl,
            original_name: file.name,
            width: width,
            height: height,
            status: 'processing'
          })
          .select()
          .single();

        if (dbError) {
          throw new Error(`Erreur Base de données: ${dbError.message}`);
        }

        // Notify parent immediately
        if (onPhotoUploaded && photoData) {
            onPhotoUploaded(photoData);
        }

        // Trigger Server-Side Processing
        fetch('/api/photos/process', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ photoId: photoData.id, imageUrl: publicUrl }),
        }).catch(err => console.error("Async process trigger failed", err));

        setProgress(prev => ({ ...prev, [statusKey]: 'Terminé' }));

        // Remove from list if successful to declutter?
        // User wants "immediate" feedback in the gallery.
        // We can keep it here with "Terminé" or remove it.
        // Let's keep it to show progress until all done.

      } catch (error: unknown) {
        hasErrors = true;
        let msg = "Erreur inconnue";
        if (error instanceof Error) msg = error.message;
        else if (typeof error === 'object' && error !== null && 'message' in error) msg = (error as any).message;

        console.error("Upload error details for", file.name, error);
        setProgress(prev => ({ ...prev, [statusKey]: 'Erreur: ' + msg }));
      }
    }

    setUploading(false);

    // Once batch is done, clear successful ones
    setFiles(prev => prev.filter(f => progress[f.name] !== 'Terminé'));
    onUploadComplete();
  };

  return (
    <div className="space-y-4">
      <div
        className={`border-2 border-dashed rounded-lg p-8 text-center transition ${
          dragActive ? 'border-indigo-600 bg-indigo-50' : 'border-gray-300'
        }`}
        onDragEnter={handleDrag}
        onDragLeave={handleDrag}
        onDragOver={handleDrag}
        onDrop={handleDrop}
      >
        <div className="flex flex-col items-center justify-center space-y-3">
          <Upload className="h-10 w-10 text-gray-400" />
          <p className="text-gray-600">Glissez-déposez vos photos ici</p>
          <span className="text-gray-400 text-sm">ou</span>
          <button
            type="button"
            onClick={() => inputRef.current?.click()}
            className="px-4 py-2 bg-white border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 hover:bg-gray-50"
          >
            Sélectionner des fichiers
          </button>
          <input
            ref={inputRef}
            type="file"
            multiple
            accept="image/*,.heic,.heif"
            className="hidden"
            onChange={handleChange}
          />
        </div>
      </div>

      {files.length > 0 && (
        <div className="bg-white rounded-lg shadow overflow-hidden">
          <div className="px-4 py-3 border-b bg-gray-50 flex justify-between items-center">
            <h3 className="font-medium text-gray-900">{files.length} fichiers sélectionnés</h3>
            {!uploading && (
              <button
                onClick={() => setFiles([])}
                className="text-sm text-red-600 hover:text-red-800"
              >
                Tout effacer
              </button>
            )}
          </div>
          <ul className="divide-y divide-gray-200 max-h-60 overflow-y-auto">
            {files.map((file, i) => (
              <li key={i} className="px-4 py-3 flex items-center justify-between">
                <span className="truncate max-w-xs text-sm text-gray-700">{file.name}</span>
                {progress[file.name] ? (
                  <span className={`text-sm flex items-center ${
                    progress[file.name].startsWith('Erreur') ? 'text-red-600' :
                    progress[file.name] === 'Terminé' ? 'text-green-600' : 'text-indigo-600'
                  }`}>
                    {progress[file.name].startsWith('Erreur') && <AlertCircle size={14} className="mr-1"/>}
                    {progress[file.name]}
                  </span>
                ) : (
                  <button onClick={() => removeFile(i)} className="text-gray-400 hover:text-gray-600">
                    <X size={16} />
                  </button>
                )}
              </li>
            ))}
          </ul>
          {!uploading && (
             <div className="p-4 bg-gray-50 border-t">
               <button
                 onClick={uploadFiles}
                 className="w-full py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 flex justify-center items-center"
               >
                 Commencer l&apos;upload et l&apos;analyse
               </button>
             </div>
          )}
        </div>
      )}

      {uploading && (
        <div className="text-center text-sm text-gray-500">
          <Loader className="animate-spin h-5 w-5 mx-auto mb-2 text-indigo-600" />
          Veuillez patienter, traitement des photos en cours...
        </div>
      )}
    </div>
  );
}

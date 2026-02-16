'use client';

import { useEffect, useState, useRef } from 'react';
import { Camera, Upload, X, RefreshCw } from 'lucide-react';
import { getFaceDescriptor, loadFaceModels } from '@/lib/face-rec';

interface SelfieCaptureProps {
  onDescriptorComputed: (descriptor: Float32Array, imageUrl: string) => void;
}

export default function SelfieCapture({ onDescriptorComputed }: SelfieCaptureProps) {
  const [mode, setMode] = useState<'initial' | 'camera' | 'upload'>('initial');
  const [image, setImage] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [modelsReady, setModelsReady] = useState(false);
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    let mounted = true;
    loadFaceModels()
      .then(() => {
        if (mounted) setModelsReady(true);
      })
      .catch((error) => {
        console.error('Model preload failed', error);
        if (mounted) setErrorMessage('Impossible de charger les modèles IA. Réessayez dans quelques secondes.');
      });

    return () => {
      mounted = false;
    };
  }, []);

  // Camera Logic
  const startCamera = async () => {
    setErrorMessage(null);
    setMode('camera');
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: true });
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
      }
    } catch (err) {
      console.error("Camera error", err);
      setErrorMessage("Impossible d'accéder à la caméra.");
      setMode('initial');
    }
  };

  const takePhoto = () => {
    if (videoRef.current && canvasRef.current) {
      const video = videoRef.current;
      const canvas = canvasRef.current;
      canvas.width = video.videoWidth;
      canvas.height = video.videoHeight;
      const ctx = canvas.getContext('2d');
      if (ctx) {
        ctx.drawImage(video, 0, 0);
        const dataUrl = canvas.toDataURL('image/jpeg');
        setImage(dataUrl);
        processImage(dataUrl);

        // Stop stream
        const stream = video.srcObject as MediaStream;
        stream?.getTracks().forEach(track => track.stop());
      }
    }
  };

  // Upload Logic
  const handleUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      const reader = new FileReader();
      reader.onload = (ev) => {
        if (ev.target?.result) {
          const dataUrl = ev.target.result as string;
          setImage(dataUrl);
          setMode('upload');
          processImage(dataUrl);
        }
      };
      reader.readAsDataURL(file);
    }
  };

  const processImage = async (dataUrl: string) => {
    setErrorMessage(null);
    setLoading(true);
    const img = new Image();
    img.src = dataUrl;

    try {
      await Promise.race([
        new Promise<void>((resolve, reject) => {
          img.onload = () => resolve();
          img.onerror = () => reject(new Error("Impossible de charger l'image."));
        }),
        new Promise<void>((_, reject) => setTimeout(() => reject(new Error('Chargement de la photo trop long.')), 10000)),
      ]);
    } catch (loadErr) {
      console.error('Image load error', loadErr);
      setErrorMessage(loadErr instanceof Error ? loadErr.message : "Erreur de chargement.");
      setImage(null);
      setMode('initial');
      setLoading(false);
      return;
    }

    try {
      const descriptor = await Promise.race([
        getFaceDescriptor(img),
        new Promise<undefined>((_, reject) =>
          setTimeout(() => reject(new Error(
            'Analyse trop longue (>45s). Vérifiez que votre navigateur supporte WebGL et réessayez.'
          )), 45000)
        ),
      ]);
      if (descriptor) {
        onDescriptorComputed(descriptor, dataUrl);
      } else {
        setErrorMessage("Aucun visage détecté. Essayez avec une photo plus rapprochée et bien éclairée.");
        setImage(null);
        setMode('initial');
      }
    } catch (error) {
      console.error('Face detection error', error);
      setErrorMessage(error instanceof Error ? error.message : "Erreur lors de l'analyse du visage.");
      setImage(null);
      setMode('initial');
    } finally {
      setLoading(false);
    }
  };

  const reset = () => {
    setImage(null);
    setMode('initial');
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center p-8 bg-white rounded-lg shadow-lg">
        <RefreshCw className="animate-spin text-indigo-600 mb-4" size={32} />
        <p>Analyse de votre visage...</p>
      </div>
    );
  }

  if (image) {
    return (
      <div className="flex flex-col items-center bg-white p-6 rounded-lg shadow-lg">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={image} alt="Selfie" className="w-48 h-48 object-cover rounded-full border-4 border-indigo-100 mb-4" />
        <p className="text-green-600 font-medium mb-4 flex items-center">
          <span className="mr-2">✓</span> Visage détecté
        </p>
        <button onClick={reset} className="text-sm text-gray-500 hover:text-gray-700 underline">
          Recommencer
        </button>
      </div>
    );
  }

  return (
    <div className="bg-white p-8 rounded-lg shadow-xl max-w-md w-full mx-auto">
      <h3 className="text-2xl font-bold text-center mb-6 text-gray-800">Trouvez vos photos</h3>

      {mode === 'initial' && (
        <div className="space-y-4">
          {errorMessage && <p className="text-sm text-red-600">{errorMessage}</p>}
          {!modelsReady && <p className="text-xs text-gray-500">Initialisation des modèles IA...</p>}
          <button
            onClick={startCamera}
            disabled={!modelsReady}
            className="w-full bg-indigo-600 text-white py-3 rounded-lg font-medium hover:bg-indigo-700 flex items-center justify-center transition"
          >
            <Camera className="mr-2" />
            Prendre un selfie
          </button>

          <div className="relative">
            <div className="absolute inset-0 flex items-center">
              <span className="w-full border-t border-gray-200" />
            </div>
            <div className="relative flex justify-center text-sm">
              <span className="px-2 bg-white text-gray-500">ou</span>
            </div>
          </div>

          <label className="w-full bg-white border border-gray-300 text-gray-700 py-3 rounded-lg font-medium hover:bg-gray-50 flex items-center justify-center cursor-pointer transition">
            <Upload className="mr-2" />
            Uploader une photo
            <input type="file" accept="image/*" className="hidden" onChange={handleUpload} />
          </label>
        </div>
      )}

      {mode === 'camera' && (
        <div className="relative bg-black rounded-lg overflow-hidden">
          <video ref={videoRef} autoPlay playsInline className="w-full" />
          <canvas ref={canvasRef} className="hidden" />
          <button
            onClick={takePhoto}
            className="absolute bottom-4 left-1/2 transform -translate-x-1/2 bg-white rounded-full p-4 shadow-lg hover:scale-105 transition"
          >
            <div className="w-6 h-6 bg-red-500 rounded-full border-2 border-white"></div>
          </button>
          <button
            onClick={() => setMode('initial')}
            className="absolute top-2 right-2 text-white bg-black/50 rounded-full p-2"
          >
            <X size={20} />
          </button>
        </div>
      )}
    </div>
  );
}

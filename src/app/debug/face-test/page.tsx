'use client';

export const dynamic = 'force-dynamic';

import { useState, useRef } from 'react';
import { debugDetectFaces, loadAllDetectors, type DetectorBackend } from '@/lib/face-rec';

type TestResult = {
  backend: DetectorBackend;
  loadMs: number;
  detectMs: number;
  faces: number;
  error?: string;
};

export default function FaceTestPage() {
  const [imageUrl, setImageUrl] = useState<string | null>(null);
  const [results, setResults] = useState<TestResult[]>([]);
  const [running, setRunning] = useState(false);
  const [preloading, setPreloading] = useState(false);
  const [preloaded, setPreloaded] = useState(false);
  const imgRef = useRef<HTMLImageElement>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const url = URL.createObjectURL(file);
    setImageUrl(url);
    setResults([]);
  };

  const handlePreload = async () => {
    setPreloading(true);
    try {
      await loadAllDetectors();
      setPreloaded(true);
    } catch (err) {
      console.error('Preload failed', err);
    } finally {
      setPreloading(false);
    }
  };

  const handleRunTests = async () => {
    if (!imgRef.current) return;
    setRunning(true);
    setResults([]);

    const backends: DetectorBackend[] = ['ssdMobilenetv1', 'tinyFaceDetector'];
    const newResults: TestResult[] = [];

    for (const backend of backends) {
      const result = await debugDetectFaces(imgRef.current, backend);
      newResults.push(result);
      setResults([...newResults]);
    }

    setRunning(false);
  };

  return (
    <div className="max-w-2xl mx-auto p-8">
      <h1 className="text-2xl font-bold mb-2">Face Detection Debug</h1>
      <p className="text-sm text-gray-500 mb-6">
        Upload a photo and test both detector backends. Results show model load time,
        detection time, and number of faces found.
      </p>

      <div className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Select test image</label>
          <input
            type="file"
            accept="image/*"
            onChange={handleFileChange}
            className="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded file:border-0 file:text-sm file:font-semibold file:bg-indigo-50 file:text-indigo-700 hover:file:bg-indigo-100"
          />
        </div>

        {imageUrl && (
          <div className="border rounded-lg p-4 bg-gray-50">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              ref={imgRef}
              src={imageUrl}
              alt="Test"
              className="max-h-64 mx-auto rounded"
              crossOrigin="anonymous"
            />
          </div>
        )}

        <div className="flex gap-3">
          <button
            onClick={handlePreload}
            disabled={preloading || preloaded}
            className="px-4 py-2 bg-gray-600 text-white rounded hover:bg-gray-700 disabled:opacity-50 text-sm"
          >
            {preloading ? 'Loading models...' : preloaded ? 'Models loaded' : '1. Pre-load all models'}
          </button>

          <button
            onClick={handleRunTests}
            disabled={!imageUrl || running}
            className="px-4 py-2 bg-indigo-600 text-white rounded hover:bg-indigo-700 disabled:opacity-50 text-sm"
          >
            {running ? 'Testing...' : '2. Run detection tests'}
          </button>
        </div>

        {results.length > 0 && (
          <div className="border rounded-lg overflow-hidden">
            <table className="w-full text-sm">
              <thead className="bg-gray-100">
                <tr>
                  <th className="text-left p-3">Backend</th>
                  <th className="text-right p-3">Model Load</th>
                  <th className="text-right p-3">Detection</th>
                  <th className="text-right p-3">Faces</th>
                  <th className="text-left p-3">Status</th>
                </tr>
              </thead>
              <tbody>
                {results.map((r) => (
                  <tr key={r.backend} className="border-t">
                    <td className="p-3 font-mono text-xs">{r.backend}</td>
                    <td className="p-3 text-right">{r.loadMs} ms</td>
                    <td className="p-3 text-right">{r.detectMs} ms</td>
                    <td className="p-3 text-right font-bold">{r.faces}</td>
                    <td className="p-3">
                      {r.error ? (
                        <span className="text-red-600">{r.error}</span>
                      ) : r.faces > 0 ? (
                        <span className="text-green-600 font-medium">OK</span>
                      ) : (
                        <span className="text-yellow-600">No face</span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        <div className="text-xs text-gray-400 mt-8">
          <p>Models: SSD MobileNet v1 (~7 MB), TinyFaceDetector (~190 KB)</p>
          <p>Library: @vladmandic/face-api (TF.js v4.x)</p>
          <p>All detection runs 100% client-side in your browser.</p>
        </div>
      </div>
    </div>
  );
}

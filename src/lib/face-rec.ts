import * as faceapi from '@vladmandic/face-api';

export { faceapi };

export type DetectorBackend = 'ssdMobilenetv1' | 'tinyFaceDetector';

const MODEL_URL = '/models';
const MAX_DETECTION_SIZE_SINGLE = 640;
const MAX_DETECTION_SIZE_MULTI = 1400;

function prepareDetectionInput(
  imageElement: HTMLImageElement | HTMLVideoElement | HTMLCanvasElement,
  maxDetectionSize: number
): HTMLImageElement | HTMLVideoElement | HTMLCanvasElement {
  let width: number;
  let height: number;

  if (imageElement instanceof HTMLVideoElement) {
    width = imageElement.videoWidth;
    height = imageElement.videoHeight;
  } else if (imageElement instanceof HTMLCanvasElement) {
    width = imageElement.width;
    height = imageElement.height;
  } else {
    width = imageElement.naturalWidth;
    height = imageElement.naturalHeight;
  }

  if (!width || !height) return imageElement;
  if (Math.max(width, height) <= maxDetectionSize) return imageElement;

  const scale = maxDetectionSize / Math.max(width, height);
  const targetWidth = Math.max(1, Math.round(width * scale));
  const targetHeight = Math.max(1, Math.round(height * scale));

  const canvas = document.createElement('canvas');
  canvas.width = targetWidth;
  canvas.height = targetHeight;
  const ctx = canvas.getContext('2d');
  if (!ctx) return imageElement;

  ctx.drawImage(imageElement, 0, 0, targetWidth, targetHeight);
  return canvas;
}

function getDetectorOptions(backend: DetectorBackend, minConfidence: number): faceapi.TinyFaceDetectorOptions | faceapi.SsdMobilenetv1Options {
  if (backend === 'tinyFaceDetector') {
    return new faceapi.TinyFaceDetectorOptions({ inputSize: 416, scoreThreshold: minConfidence });
  }
  return new faceapi.SsdMobilenetv1Options({ minConfidence });
}

// Load shared models (landmarks + recognition). Always needed.
async function loadSharedModels() {
  if (!faceapi.nets.faceLandmark68Net.params) {
    await faceapi.nets.faceLandmark68Net.loadFromUri(MODEL_URL);
  }
  if (!faceapi.nets.faceRecognitionNet.params) {
    await faceapi.nets.faceRecognitionNet.loadFromUri(MODEL_URL);
  }
}

// Load a specific detector backend.
async function loadDetector(backend: DetectorBackend) {
  if (backend === 'tinyFaceDetector') {
    if (!faceapi.nets.tinyFaceDetector.params) {
      await faceapi.nets.tinyFaceDetector.loadFromUri(MODEL_URL);
    }
  } else {
    if (!faceapi.nets.ssdMobilenetv1.params) {
      await faceapi.nets.ssdMobilenetv1.loadFromUri(MODEL_URL);
    }
  }
}

/** Load all models for a given detector backend. */
export async function loadFaceModels(backend: DetectorBackend = 'ssdMobilenetv1') {
  await Promise.all([loadDetector(backend), loadSharedModels()]);
}

/** Load ALL detector backends (for the debug/test page). */
export async function loadAllDetectors() {
  await Promise.all([
    loadDetector('ssdMobilenetv1'),
    loadDetector('tinyFaceDetector'),
    loadSharedModels(),
  ]);
}

/**
 * Detect a single face and return its 128-dim descriptor.
 * Tries single-face first, then falls back to multi-face picking the largest.
 */
export async function getFaceDescriptor(
  imageElement: HTMLImageElement | HTMLVideoElement,
  backend: DetectorBackend = 'ssdMobilenetv1',
): Promise<Float32Array | undefined> {
  await loadFaceModels(backend);
  const input = prepareDetectionInput(imageElement, MAX_DETECTION_SIZE_SINGLE);

  const single = await faceapi
    .detectSingleFace(input, getDetectorOptions(backend, 0.35))
    .withFaceLandmarks()
    .withFaceDescriptor();

  if (single) return single.descriptor;

  const allDetections = await faceapi
    .detectAllFaces(input, getDetectorOptions(backend, 0.3))
    .withFaceLandmarks()
    .withFaceDescriptors();

  if (allDetections.length === 0) return undefined;

  const best = allDetections.reduce((prev, curr) => {
    const prevArea = prev.detection.box.width * prev.detection.box.height;
    const currArea = curr.detection.box.width * curr.detection.box.height;
    return currArea > prevArea ? curr : prev;
  });

  return best.descriptor;
}

/**
 * Detect all faces in an image and return their descriptors.
 * Two-pass strategy: first pass at higher confidence, second at lower.
 */
export async function getAllFaceDescriptors(
  imageElement: HTMLImageElement,
  backend: DetectorBackend = 'ssdMobilenetv1',
): Promise<faceapi.WithFaceDescriptor<faceapi.WithFaceLandmarks<{ detection: faceapi.FaceDetection }>>[]> {
  await loadFaceModels(backend);
  const input = prepareDetectionInput(imageElement, MAX_DETECTION_SIZE_MULTI);

  const firstPass = await faceapi
    .detectAllFaces(input, getDetectorOptions(backend, 0.25))
    .withFaceLandmarks()
    .withFaceDescriptors();

  if (firstPass.length > 0) return firstPass;

  const secondPass = await faceapi
    .detectAllFaces(input, getDetectorOptions(backend, 0.15))
    .withFaceLandmarks()
    .withFaceDescriptors();

  return secondPass;
}

/**
 * Debug helper: run detection with a specific backend and return timing + results.
 */
export async function debugDetectFaces(
  imageElement: HTMLImageElement,
  backend: DetectorBackend,
): Promise<{ backend: DetectorBackend; loadMs: number; detectMs: number; faces: number; error?: string }> {
  try {
    const t0 = performance.now();
    await loadFaceModels(backend);
    const loadMs = Math.round(performance.now() - t0);

    const t1 = performance.now();
    const input = prepareDetectionInput(imageElement, MAX_DETECTION_SIZE_MULTI);
    const detections = await faceapi
      .detectAllFaces(input, getDetectorOptions(backend, 0.2))
      .withFaceLandmarks()
      .withFaceDescriptors();
    const detectMs = Math.round(performance.now() - t1);

    return { backend, loadMs, detectMs, faces: detections.length };
  } catch (err) {
    return { backend, loadMs: 0, detectMs: 0, faces: 0, error: err instanceof Error ? err.message : String(err) };
  }
}

import * as faceapi from 'face-api.js';

// Configuration for the models
const MODEL_URL = '/models';
const MAX_DETECTION_SIZE = 640;

function prepareDetectionInput(imageElement: HTMLImageElement | HTMLVideoElement): HTMLImageElement | HTMLVideoElement | HTMLCanvasElement {
  const width = imageElement instanceof HTMLVideoElement ? imageElement.videoWidth : imageElement.naturalWidth;
  const height = imageElement instanceof HTMLVideoElement ? imageElement.videoHeight : imageElement.naturalHeight;

  if (!width || !height) return imageElement;
  if (Math.max(width, height) <= MAX_DETECTION_SIZE) return imageElement;

  const scale = MAX_DETECTION_SIZE / Math.max(width, height);
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

export async function loadFaceModels() {
  if (!faceapi.nets.ssdMobilenetv1.params) {
    await faceapi.nets.ssdMobilenetv1.loadFromUri(MODEL_URL);
  }
  if (!faceapi.nets.faceLandmark68Net.params) {
    await faceapi.nets.faceLandmark68Net.loadFromUri(MODEL_URL);
  }
  if (!faceapi.nets.faceRecognitionNet.params) {
    await faceapi.nets.faceRecognitionNet.loadFromUri(MODEL_URL);
  }
}

export async function getFaceDescriptor(imageElement: HTMLImageElement | HTMLVideoElement): Promise<Float32Array | undefined> {
  // Ensure models are loaded
  await loadFaceModels();
  const input = prepareDetectionInput(imageElement);

  // Detect single face with highest confidence
  // We use SsdMobilenetv1 for better accuracy than TinyFaceDetector
  const detection = await faceapi
    .detectSingleFace(input, new faceapi.SsdMobilenetv1Options({ minConfidence: 0.35 }))
    .withFaceLandmarks()
    .withFaceDescriptor();

  if (!detection) {
    return undefined;
  }

  return detection.descriptor;
}

export async function getAllFaceDescriptors(imageElement: HTMLImageElement): Promise<faceapi.WithFaceDescriptor<faceapi.WithFaceLandmarks<{ detection: faceapi.FaceDetection }>>[]> {
    await loadFaceModels();
    const input = prepareDetectionInput(imageElement);

    const detections = await faceapi
        .detectAllFaces(input, new faceapi.SsdMobilenetv1Options({ minConfidence: 0.35 }))
        .withFaceLandmarks()
        .withFaceDescriptors();

    return detections;
}

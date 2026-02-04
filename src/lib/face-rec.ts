import * as faceapi from 'face-api.js';

// Configuration for the models
const MODEL_URL = '/models';

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

  // Detect single face with highest confidence
  // We use SsdMobilenetv1 for better accuracy than TinyFaceDetector
  const detection = await faceapi
    .detectSingleFace(imageElement, new faceapi.SsdMobilenetv1Options())
    .withFaceLandmarks()
    .withFaceDescriptor();

  if (!detection) {
    return undefined;
  }

  return detection.descriptor;
}

export async function getAllFaceDescriptors(imageElement: HTMLImageElement): Promise<faceapi.WithFaceDescriptor<faceapi.WithFaceLandmarks<{ detection: faceapi.FaceDetection }>>[]> {
    await loadFaceModels();

    const detections = await faceapi
        .detectAllFaces(imageElement, new faceapi.SsdMobilenetv1Options())
        .withFaceLandmarks()
        .withFaceDescriptors();

    return detections;
}

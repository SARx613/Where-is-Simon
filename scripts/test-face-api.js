// scripts/test-face-api.js
const faceapi = require('face-api.js');
const { Canvas, Image, ImageData, loadImage } = require('canvas');
const path = require('path');
const fs = require('fs');

async function testFaceApi() {
  console.log('--- STARTING FACE-API TEST ---');

  // 1. Monkey Patch
  try {
    faceapi.env.monkeyPatch({ Canvas, Image, ImageData });
    console.log('✅ Environment patched successfully');
  } catch (e) {
    console.error('❌ Failed to patch environment:', e);
    process.exit(1);
  }

  // 2. Load Models
  const MODEL_PATH = path.join(process.cwd(), 'public/models');
  console.log(`ℹ️ Loading models from: ${MODEL_PATH}`);

  if (!fs.existsSync(MODEL_PATH)) {
    console.error('❌ Model directory does not exist!');
    process.exit(1);
  }

  try {
    await faceapi.nets.ssdMobilenetv1.loadFromDisk(MODEL_PATH);
    await faceapi.nets.faceLandmark68Net.loadFromDisk(MODEL_PATH);
    await faceapi.nets.faceRecognitionNet.loadFromDisk(MODEL_PATH);
    console.log('✅ Models loaded successfully');
  } catch (e) {
    console.error('❌ Failed to load models:', e);
    process.exit(1);
  }

  // 3. Create a dummy image (black square)
  const canvas = new Canvas(200, 200);
  const ctx = canvas.getContext('2d');
  ctx.fillStyle = 'black';
  ctx.fillRect(0, 0, 200, 200);

  // Draw a "face" (simple circles) to see if detector crashes or just returns nothing
  ctx.fillStyle = 'white';
  ctx.beginPath();
  ctx.arc(70, 70, 20, 0, Math.PI * 2); // left eye
  ctx.arc(130, 70, 20, 0, Math.PI * 2); // right eye
  ctx.arc(100, 130, 30, 0, Math.PI, false); // mouth
  ctx.fill();

  console.log('ℹ️ Analyzing generated test image...');

  try {
    const detections = await faceapi
      .detectAllFaces(canvas, new faceapi.SsdMobilenetv1Options({ minConfidence: 0.1 })) // Low confidence to catch crude drawing
      .withFaceLandmarks()
      .withFaceDescriptors();

    console.log(`✅ Detection complete. Found ${detections.length} faces.`);
    if (detections.length > 0) {
        console.log('   (Note: Found a face in crude drawing! Model is very active.)');
    } else {
        console.log('   (Note: No face found in crude drawing, expected behavior for high-quality model on bad data.)');
    }
  } catch (e) {
    console.error('❌ Detection crashed:', e);
    process.exit(1);
  }

  console.log('--- TEST COMPLETED SUCCESSFULLY ---');
}

testFaceApi();

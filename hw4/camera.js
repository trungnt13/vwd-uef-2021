var VIDEO = null;
var MODEL = null;
var AUDIO = null;
var GAIN = null;
var SIZE = 300;
var CANVAS;
var EFFECT;
var EFFECT_INDEX = 0;

///////////////////////////////// Initialization
function initializeCamera() {
  var promise = navigator.mediaDevices.getUserMedia({ video: true });
  promise.then(function (signal) {
    VIDEO = document.createElement("video");
    VIDEO.srcObject = signal;
    VIDEO.play();
  }).catch(function (err) {
    alert("Camera Error");
  });
}

function initializeCanvas(canvasName, width, height) {
  let canvas = document.getElementById(canvasName);
  canvas.width = width;
  canvas.height = height;
  return canvas;
}

function initializeAudio() {
  AUDIO = new (window.AudioContext || window.webkitAudioContext)();
  const dest = AUDIO.createMediaStreamDestination();
  GAIN = AUDIO.createGain();
  // this.audioCtx.destination
  GAIN.gain.setValueAtTime(0.3, AUDIO.currentTime);
  GAIN.connect(AUDIO.destination);
}

///////////////////////////////// Main
function main() {
  CANVAS = initializeCanvas("myCanvas", SIZE, SIZE);
  EFFECT = initializeCanvas("myEffect", SIZE, SIZE);
  initializeCamera();
  initializeAudio();
  var ctx = CANVAS.getContext("2d");
  var effect = EFFECT.getContext("2d");

  initializeFacemesh().then(() => {
    setInterval(() => {
      drawScene(ctx, effect);
    }, 200); // once every 100 ms
  });
  // clearInterval(inteID)
}

async function initializeFacemesh() {
  // Load the MediaPipe Facemesh package.
  MODEL = await faceLandmarksDetection.load(
    faceLandmarksDetection.SupportedPackages.mediapipeFacemesh,
    packageConfig = {
      maxFaces: 1,
      maxContinuousChecks: 5,
    });
}



/*
`predictions` is an array of objects describing each detected face, for example:
[
  {
    faceInViewConfidence: 1, // The probability of a face being present.
    boundingBox: { // The bounding box surrounding the face.
      topLeft: [232.28, 145.26],
      bottomRight: [449.75, 308.36],
    },
    mesh: [ // The 3D coordinates of each facial landmark.
      [92.07, 119.49, -17.54],
      [91.97, 102.52, -30.54],
      ...
    ],
    scaledMesh: [ // The 3D coordinates of each facial landmark, normalized.
      [322.32, 297.58, -17.54],
      [322.18, 263.95, -30.54]
    ],
    annotations: { // Semantic groupings of the `scaledMesh` coordinates.
      silhouette: [
        [326.19, 124.72, -3.82],
        [351.06, 126.30, -3.00],
        ...
      ],
      ...
    }
  }
]
*/
async function drawScene(ctx, effect) {
  if (VIDEO === null || MODEL === null) {
    return;
  }
  ctx.clearRect(0, 0, SIZE, SIZE);
  effect.clearRect(0, 0, SIZE, SIZE);
  var min = Math.min(VIDEO.videoWidth, VIDEO.videoHeight);
  var sx = (VIDEO.videoWidth - min) / 2;
  var sy = (VIDEO.videoHeight - min) / 2;
  ctx.drawImage(VIDEO, sx, sy, min, min, 0, 0, SIZE, SIZE);
  // Detect FaceMesh here
  const predictions = await MODEL.estimateFaces({
    input: ctx.getImageData(0, 0, SIZE, SIZE),
    flipHorizontal: false
  });
  effect.fillStyle = 'green';
  if (predictions.length > 0) {
    for (let i = 0; i < predictions.length; i++) {
      const face = predictions[i];
      const keypoints = face.scaledMesh;
      // show facial keypoints.
      for (let i = 0; i < keypoints.length; i++) {
        const [x, y, z] = keypoints[i];
        effect.fillRect(x, y, 1, 1);
      }
      // detect lips and singing
      // I am too lazy to write for loop, use tensorflow
      const lipsUp = tf.tensor(face.annotations.lipsUpperInner.map((x) => x[1]));
      const lipsLow = tf.tensor(face.annotations.lipsLowerInner.map((x) => x[1]));
      const isSinging = lipsUp.sub(lipsLow).norm().dataSync();
      // console.log(`${isSinging}`);
      // play audio, this is hand tuned threshold
      if (isSinging > 5) {
        if (AUDIO.state === 'suspended') {
          AUDIO.resume();
        }
        const duration = 0.2;
        var osc = AUDIO.createOscillator();
        var gainNode = AUDIO.createGain();
        gainNode.gain.setValueAtTime(0, AUDIO.currentTime);
        gainNode.gain.linearRampToValueAtTime(1, AUDIO.currentTime + 0.05);
        gainNode.gain.linearRampToValueAtTime(0, AUDIO.currentTime + duration);
        osc.type = "triangle";
        osc.frequency.value = 150 + (isSinging - 5) * 20;
        osc.start(AUDIO.currentTime);
        osc.stop(AUDIO.currentTime + duration);
        osc.connect(gainNode);
        gainNode.connect(GAIN);
      }
    }
  }
}


// messy code. don't try to follow :-)

var G = [0, 0.2];
var particles = [];
var segments = [];
var boards = [];

function scale(vector, value) {
  let newVector = [];
  for (let i = 0; i < vector.length; i++) {
    newVector[i] = vector[i] * value;
  }
  return newVector;
}

function distance(v1, v2) {
  let dist = 0;
  for (let i = 0; i < v1.length; i++) {
    dist += Math.pow(v1[i] - v2[i], 2);
  }
  return Math.sqrt(dist);
}

function createHangingBoards(topLeft, size, str) {

  for (let i = 0; i < str.length; i++) {
    let x = topLeft[0] + size * 3.5 * i;
    let y = topLeft[1];
    console.log(x, y);
    if (str.charAt(i) == " ") {
      continue;
    }
    let board = createHangingBoard(
      [x, y]
      , size,
      str.charAt(i));

    particles.add(board.p);
    segments.add(board.s);
    boards.add(board.b);
  }

}

function createHangingBoard(location, size, letter) {
  let links = 8;
  let p = []
  let s = []
  let b = []
  let angle = 0.2;
  //support
  for (let i = 0; i < links; i++) {
    let isFixed = true;
    if (i > 0) {
      isFixed = false;
    }
    p.push(new Particle([location[0] - size + i * size * 0.6, location[1]], isFixed));
    p.push(new Particle([location[0] + size + i * size * 0.6, location[1]], isFixed));
    if (i > 0) {
      s.push(new Segment(p[p.length - 1], p[p.length - 3]));
      s.push(new Segment(p[p.length - 2], p[p.length - 4]));
    }
  }
  p.push(new Particle([location[0] - size + (links - 1) * size * 0.6, location[1] + 4 * size * 0.6], false));
  p.push(new Particle([location[0] + size + (links - 1) * size * 0.6, location[1] + 4 * size * 0.6], false));
  s.push(new Segment(p[p.length - 1], p[p.length - 2], true));
  s.push(new Segment(p[p.length - 4], p[p.length - 3], true));
  s.push(new Segment(p[p.length - 1], p[p.length - 3], true));
  s.push(new Segment(p[p.length - 2], p[p.length - 4], true));
  s.push(new Segment(p[p.length - 1], p[p.length - 4], true));
  b.push(new Board([
    p[p.length - 1], p[p.length - 2], p[p.length - 4], p[p.length - 3]
  ], letter));



  return { p: p, s: s, b: b };
}

Array.prototype.add = function (elements) {
  for (let i = 0; i < elements.length; i++) {
    this.push(elements[i]);
  }
}

class Board {
  constructor(particles, letter) {
    this.particles = particles;
    this.letter = letter;
  }

  draw(ctx) {
    ctx.beginPath();
    ctx.fillStyle = "red";
    ctx.moveTo(...this.particles[0].location);
    for (let i = 1; i < this.particles.length; i++) {
      ctx.lineTo(...this.particles[i].location);
    }
    ctx.fill();
    let center = averageParticleLocations(this.particles);
    let angle = Math.atan2(
      this.particles[0].location[1] - this.particles[1].location[1],
      this.particles[0].location[0] - this.particles[1].location[0]
    );

    ctx.save();
    ctx.translate(...center);
    ctx.rotate(angle);
    ctx.font = "3vh Arial";
    ctx.fillStyle = "white"
    ctx.textAlign = "center"
    ctx.textBaseline = "middle"

    ctx.fillText(this.letter
      , 0, 0);
    ctx.restore();
  }
}

function averageParticleLocations(particles) {
  let avg = [0, 0];
  for (let i = 0; i < particles.length; i++) {
    avg[0] += particles[i].location[0];
    avg[1] += particles[i].location[1];
  }
  avg[0] /= particles.length;
  avg[1] /= particles.length;
  return avg;
}

class Segment {
  constructor(particleA, particleB, isHidden) {
    this.isHidden = isHidden;
    this.particleA = particleA;
    this.particleB = particleB;
    this.length = distance(particleA.location,
      particleB.location);
  }

  update() {
    let newLength = subtract(this.particleA.location,
      this.particleB.location);
    let magn = magnitude(newLength);

    let diff = magn - this.length;
    let norm = normalize(newLength);
    if (!this.particleA.isFixed && !this.particleB.isFixed) {
      this.particleA.location = add(
        this.particleA.location, scale(norm, -diff * 0.5)
      )
      this.particleB.location = add(
        this.particleB.location, scale(norm, diff * 0.5)
      )
    } else if (!this.particleA.isFixed) {
      this.particleA.location = add(
        this.particleA.location, scale(norm, -diff)
      )
    } else {
      this.particleB.location = add(
        this.particleB.location, scale(norm, diff)
      )
    }

  }

  draw(ctx) {
    if (this.isHidden) {
      return;
    }
    ctx.beginPath();
    ctx.strokeStyle = "black";
    ctx.lineWidth = 2;
    const sub = subtract(this.particleA.location,
      this.particleB.location);
    const norm = normalize(sub);
    const delta = magnitude(sub) * 0.1;
    const start = add(this.particleA.location,
      scale(norm, +delta));
    const end = add(this.particleB.location,
      scale(norm, -delta));

    const startOffset1 = add(start, scale(flip(norm), delta * 3));
    const startOffset2 = add(start, scale(flip(norm), -delta * 3));
    const endOffset1 = add(end, scale(flip(norm), delta * 3));
    const endOffset2 = add(end, scale(flip(norm), -delta * 3));
    ctx.moveTo(...end);
    //ctx.bezierCurveTo(...startOffset1,
    //	...endOffset1,...end);
    ctx.bezierCurveTo(...endOffset2,
      ...startOffset2, ...start);
    ctx.stroke();
  }
}

class Particle {
  constructor(location, isFixed, color) {
    this.color = color;
    this.isFixed = isFixed;
    this.location = location;
    this.blinkDuration = 0;
    if (Math.random() < 0.2) {
      this.oldLocation =
        [location[0] + (Math.random() - 0.5) * 12,
        location[1] + (Math.random() - 0.5) * 12];
    } else {
      this.oldLocation = location;
    }
    this.radius = 4;
  }
  update(forces) {
    if (this.isFixed) {
      return;
    }
    let vel = subtract(this.location, this.oldLocation);
    let newLocation = add(this.location, vel);
    for (let i = 0; i < forces.length; i++) {
      newLocation = add(newLocation, forces[i]);
    }
    this.oldLocation = this.location;
    this.location = newLocation;
  }
  draw(ctx) {
    if (!this.isFixed) {
      ctx.beginPath();
      ctx.fillStyle = this.color;
      if (this.color != null) {
        ctx.fillStyle = this.color;
      }
      let rad = this.radius;
      if (this.isBlinking) {
        rad += this.blinkDuration;
        this.blinkDuration -= 0.3;
        if (this.blinkDuration < 0) {
          this.isBlinking = false;
        }
      }
      ctx.beginPath();
      ctx.globalAlpha = 0.2;
      ctx.arc(...this.location, rad * 1.2, 0, Math.PI * 2);
      ctx.fill();
      ctx.beginPath();
      ctx.globalAlpha = 0.4;
      ctx.arc(...this.location, rad, 0, Math.PI * 2);
      ctx.fill();
      ctx.beginPath();
      ctx.globalAlpha = 0.4;
      ctx.arc(...this.location, rad * 0.7, 0, Math.PI * 2);
      ctx.fill();
      ctx.beginPath();
      ctx.globalAlpha = 1;
      ctx.arc(...this.location, this.radius, 0, Math.PI * 2);
      ctx.fill();
    }
  }
}


function updateSegments(segments) {
  for (let i = 0; i < segments.length; i++) {
    segments[i].update();
  }
}

function updateParticles(particles, forces) {
  for (let i = 0; i < particles.length; i++) {
    particles[i].update(forces);
  }
}

function drawObjects(objects, ctx) {
  for (let i = 0; i < objects.length; i++) {
    objects[i].draw(ctx);
  }
}

function normalize(v) {
  return scale(v, 1 / magnitude(v));
}

function magnitude(v) {
  let magn = 0;
  for (let i = 0; i < v.length; i++) {
    magn += v[i] * v[i];
  }
  return Math.sqrt(magn);
}

function flip(v) {
  let angle = Math.atan2(v[1], v[0]);
  angle += Math.PI / 2;
  let newV = [Math.cos(angle), Math.sin(angle)];
  return newV;
}
function subtract(v1, v2) {
  let newV = [];
  for (let i = 0; i < v1.length; i++) {
    newV[i] = v1[i] - v2[i];
  }
  return newV;
}

function add(v1, v2) {
  let newV = [];
  for (let i = 0; i < v1.length; i++) {
    newV[i] = v1[i] + v2[i];
  }
  return newV;
}
function average(v1, v2) {
  let newV = [];
  for (let i = 0; i < v1.length; i++) {
    newV[i] = (v1[i] + v2[i]) / 2;
  }
  return newV;
}


function getNearestParticle(particles, location) {
  let minDist = Number.MAX_VALUE;
  let nearestParticle = null;
  for (let i = 0; i < particles.length; i++) {
    let dist = distance(particles[i].location,
      location);
    if (dist < minDist) {
      minDist = dist;
      nearestParticle = particles[i];
    }
  }
  return nearestParticle;
}

function getMousePos(canvas, evt) {
  var rect = canvas.getBoundingClientRect();
  return [
    Math.round(CANVAS_WIDTH * (evt.clientX - rect.left) / (rect.right - rect.left)),
    Math.round(CANVAS_HEIGHT * (evt.clientY - rect.top) / (rect.bottom - rect.top))
  ];
}


const CANVAS_WIDTH = 620;
const CANVAS_HEIGHT = 240;

let canvas;


const AUDIO_CONTEXT = new (AudioContext || webkitAudioContext || window.webkitAudioContext)();

const keys = {
  DO: 261.6,
  RE: 293.7,
  MI: 329.6,
  FA: 349.2,
  SOL: 392.0,
  LA: 440.0,
  SI: 493.9,
  DO2: 523.2
};

function initializeCanvas(canvasID) {
  const canvas = document.getElementById(canvasID);
  canvas.width = CANVAS_WIDTH;
  canvas.height = CANVAS_HEIGHT;
  return canvas;
}

canvas = initializeCanvas('canvas');

addEventListeners(canvas);

function addEventListeners() {
  canvas.addEventListener('mousemove', function (event) {
    const location = getMousePos(canvas, event);
    let part = getNearestParticle(particles, location);
    console.log(part);
    let v = subtract(part.location, location);
    v = scale(v, 0.4 / magnitude(v));
    if (!part.isFixed) {
      part.location = add(part.location, v);
    }
  }, false);

  canvas.addEventListener('mousedown', function (event) {
    jingleBells();
  }, false);

}

createHangingDecorations(
  [20, +35],
  [CANVAS_WIDTH - 20, +35]);

setInterval(function () {
  clear(canvas);
  let context = canvas.getContext("2d");
  context.beginPath();
  context.fillStyle = "lightgreen";
  context.font = "40px Brush Script MT";
  context.textAlign = "center";
  context.textBaseline = "middle";
  context.fillText("Click for Music!", canvas.width / 2, canvas.height * 0.4);
  updateGame(canvas);
}, 1000 / 30);


function createHangingDecorations(topLeft, topRight) {
  let chain = createChain(topLeft, topRight);
  particles.add(chain.p);
  segments.add(chain.s);
  boards.add(chain.b);
  /*
  for(let i=0;i<str.length;i++){
    let x=topLeft[0]+size*3.5*i;
    let y=topLeft[1];
    console.log(x,y);
    if(str.charAt(i)==" "){
      continue;
    }
    let board=createChain(
      [x,y]
      ,size,
      str.charAt(i));

    particles.add(board.p);
    segments.add(board.s);
    boards.add(board.b);
  }
  */
}

function createChain(A, B) {
  let links = 8;
  let p = []
  let s = []
  let b = []
  let angle = 0.2;
  //support

  let dist = distance(A, B);
  let step = dist / 20;
  let point = A;
  let colors = ["red", "blue", "yellow"];
  p.push(new Particle(point, true, colors[0]));
  for (let i = 1; i < 20; i++) {
    point = add(point, scale(normalize(subtract(B, A)), step));
    p.push(new Particle(point, false, colors[i % 3]));
    s.push(new Segment(p[p.length - 1], p[p.length - 2], false));
  }
  p.push(new Particle(B, true, colors[2]));
  s.push(new Segment(p[p.length - 1], p[p.length - 2], false));
  /*
  s.push(new Segment(p[p.length-1],p[p.length-2],true));
  s.push(new Segment(p[p.length-4],p[p.length-3],true));
  s.push(new Segment(p[p.length-1],p[p.length-3],true));
  s.push(new Segment(p[p.length-2],p[p.length-4],true));
  s.push(new Segment(p[p.length-1],p[p.length-4],true));
  b.push(new Board([
    p[p.length-1],p[p.length-2],p[p.length-4],p[p.length-3]
  ],letter));

  */

  return { p: p, s: s, b: b };
}



function updateGame(canvas) {
  updateParticles(particles, [G]);
  updateSegments(segments);
  let ctx = canvas.getContext("2d");
  drawObjects(particles, ctx);
  drawObjects(segments, ctx);
  drawObjects(boards, ctx);
}

function clear(canvas) {
  const ctx = canvas.getContext('2d');
  ctx.clearRect(0, 0, canvas.width, canvas.height);
}

function playNote(key, duration, offset) {
  var osc = AUDIO_CONTEXT.createOscillator(); // Create oscillator node
  var envelope = AUDIO_CONTEXT.createGain()

  osc.connect(envelope)

  envelope.connect(AUDIO_CONTEXT.destination)
  osc.frequency.value = key;

  osc.type = 'triangle';
  envelope.gain.setValueAtTime(0, AUDIO_CONTEXT.currentTime + offset / 1000);
  envelope.gain.linearRampToValueAtTime(0.5, AUDIO_CONTEXT.currentTime + 0.1 + offset / 1000);

  osc.start(AUDIO_CONTEXT.currentTime + offset / 1000);

  envelope.gain.exponentialRampToValueAtTime(0.001,
    AUDIO_CONTEXT.currentTime + duration / 1000 + offset / 1000);

  osc.stop(AUDIO_CONTEXT.currentTime + duration / 1000 + offset / 1000);


  setTimeout(function () {
    blinkOn(2000);
  }, offset);

  setTimeout(function () {
    osc.disconnect();
  }, duration + offset);
}

function blinkOn(duration) {
  for (let i = 0; i < particles.length; i++) {
    particles[i].isBlinking = true;
    particles[i].blinkDuration = duration * 0.003;
  }
}

function jingleBells() {
  const step = 300;

  let slowness = 1;
  playNote(keys.MI, step, 0 * slowness);
  playNote(keys.MI, step, step * slowness);
  playNote(keys.MI, step * 2, step * 2 * slowness);
  playNote(keys.MI, step, step * 4 * slowness);
  playNote(keys.MI, step, step * 5 * slowness);
  playNote(keys.MI, step * 2, step * 6 * slowness);
  playNote(keys.MI, step, step * 8 * slowness);
  playNote(keys.SOL, step, step * 9 * slowness);
  playNote(keys.DO, step * 1.5, step * 10 * slowness);
  playNote(keys.RE, step * 0.5, step * 11.5 * slowness);
  playNote(keys.MI, step * 4, step * 12 * slowness);
}

function cannonNoise() {
  const duration = 500;
  var osc = AUDIO_CONTEXT.createOscillator(); // Create oscillator node
  var envelope = AUDIO_CONTEXT.createGain()

  osc.connect(envelope)

  envelope.connect(AUDIO_CONTEXT.destination)
  osc.frequency.value = 400;

  osc.type = 'sine';
  envelope.gain.setValueAtTime(0, AUDIO_CONTEXT.currentTime);
  envelope.gain.linearRampToValueAtTime(0.5, AUDIO_CONTEXT.currentTime + 0.1);
  osc.frequency.linearRampToValueAtTime(100, AUDIO_CONTEXT.currentTime + duration / 1000);

  osc.start(AUDIO_CONTEXT.currentTime);

  envelope.gain.exponentialRampToValueAtTime(0.001,
    AUDIO_CONTEXT.currentTime + duration / 1000);

  osc.stop(AUDIO_CONTEXT.currentTime + duration / 1000);

  setTimeout(function () {
    osc.disconnect();
  }, duration);
}


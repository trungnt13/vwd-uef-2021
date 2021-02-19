var SIZE = 1000;
var CANVAS;
var HIT_TEST_CANVAS;

var AUDIO_CONTEXT;
var ANALYSER;
var MASTER_GAIN;

function main() {

  //removeOverlay();

  CANVAS = initializeCanvas("myCanvas", SIZE);
  HIT_TEST_CANVAS = initializeCanvas("hitTestCanvas", SIZE);

  ButtonHandler.hitTestCanvas = HIT_TEST_CANVAS;

  // https://prgomez.com/why-do-re-mi/
  ButtonHandler.createPianoKey("DO", [SIZE * 0.15, SIZE * 0.7], 100, 200,
    { callback: playNote, freq: 261.626 });
  ButtonHandler.createPianoKey("RE", [SIZE * 0.25, SIZE * 0.7], 100, 200,
    { callback: playNote, freq: 294.33 });
  ButtonHandler.createPianoKey("MI", [SIZE * 0.35, SIZE * 0.7], 100, 200,
    { callback: playNote, freq: 327.03 });
  ButtonHandler.createPianoKey("FA", [SIZE * 0.45, SIZE * 0.7], 100, 200,
    { callback: playNote, freq: 348.83 });
  ButtonHandler.createPianoKey("SOL", [SIZE * 0.55, SIZE * 0.7], 100, 200,
    { callback: playNote, freq: 392.44 });
  ButtonHandler.createPianoKey("LA", [SIZE * 0.65, SIZE * 0.7], 100, 200,
    { callback: playNote, freq: 436.04 });
  ButtonHandler.createPianoKey("SI", [SIZE * 0.75, SIZE * 0.7], 100, 200,
    { callback: playNote, freq: 490.55 });
  ButtonHandler.createPianoKey("DO", [SIZE * 0.85, SIZE * 0.7], 100, 200,
    { callback: playNote, freq: 523.25 });

  ButtonHandler.addEventListeners(CANVAS);

  var ctx = CANVAS.getContext("2d");

  animate();
}

function playNote(freq, duration = 1) {
  if (AUDIO_CONTEXT == null) {
    AUDIO_CONTEXT = new (AudioContext || webkitAudioContext || window.webkitAudioContext)();
    ANALYSER = AUDIO_CONTEXT.createAnalyser();
    ANALYSER.fftSize = Math.pow(2, 13);
    MASTER_GAIN = AUDIO_CONTEXT.createGain();
    MASTER_GAIN.connect(AUDIO_CONTEXT.destination);
    MASTER_GAIN.gain.setValueAtTime(0.3, AUDIO_CONTEXT.currentTime);
    MASTER_GAIN.connect(ANALYSER);

  }

  var osc = AUDIO_CONTEXT.createOscillator();
  var gainNode = AUDIO_CONTEXT.createGain();
  gainNode.gain.setValueAtTime(0, AUDIO_CONTEXT.currentTime);

  gainNode.gain.linearRampToValueAtTime(1, AUDIO_CONTEXT.currentTime + 0.05);
  gainNode.gain.linearRampToValueAtTime(0, AUDIO_CONTEXT.currentTime +
    duration);

  osc.type = "triangle";

  osc.frequency.value = freq;
  osc.start(AUDIO_CONTEXT.currentTime);
  // sound will stop in 1 seconds
  osc.stop(AUDIO_CONTEXT.currentTime + duration);

  osc.connect(gainNode);
  gainNode.connect(MASTER_GAIN);
}

function animate() {
  drawScene(CANVAS.getContext("2d"));
  window.requestAnimationFrame(animate);
}

//https://developer.mozilla.org/en-US/docs/Web/API/AnalyserNode/getByteTimeDomainData
function drawScene(ctx) {
  ctx.clearRect(0, 0, SIZE, SIZE);
  ButtonHandler.drawButtons(ctx);

  if (ANALYSER != null) {
    var dataArray = new Uint8Array(ANALYSER.fftSize);
    ANALYSER.getByteTimeDomainData(dataArray);

    ctx.lineWidth = 2;
    ctx.strokeStyle = 'rgb(0,0,0)';
    ctx.beginPath();
    var sliceWidth = SIZE / ANALYSER.fftSize;

    var x = 0;
    for (var i = 0; i < ANALYSER.fftSize; i++) {
      var v = dataArray[i] / 128;
      var y = 0.2 * v * SIZE / 2;

      if (i === 0) {
        ctx.moveTo(x, y);
      } else {
        ctx.lineTo(x, y);
      }

      x += sliceWidth;
    }
    ctx.stroke();
  }
}

function initializeCanvas(canvasName, size) {
  var canvas = document.getElementById(canvasName);
  canvas.width = size;
  canvas.height = size;
  return canvas;
}

class ButtonHandler {
  static mouse = [0, 0];
  static buttons = [];
  static hitTestCanvas;// = createElement.... ("canvas");

  static createButton(name, location, width, height, options) {
    ButtonHandler.buttons.push(new RectangleButton(name, location, width, height, getRandomColor(), options));
  }

  static createPianoKey(name, location, width, height, options) {
    ButtonHandler.buttons.push(new PianoKeyButton(name, location, width, height, getRandomColor(), options));
  }

  static drawButtons(ctx) {
    for (var i = 0; i < ButtonHandler.buttons.length; i++) {
      ButtonHandler.buttons[i].draw(ctx);
    }


    var hitCtx = ButtonHandler.hitTestCanvas.getContext("2d");
    hitCtx.clearRect(0, 0, SIZE, SIZE);
    for (var i = 0; i < ButtonHandler.buttons.length; i++) {
      ButtonHandler.buttons[i].drawHitArea(hitCtx);
    }

    hitCtx.fillStyle = "black";
    hitCtx.font = (SIZE * 0.1) + "px Arial";
    hitCtx.textAlign = "center";
    hitCtx.textBaseline = "middle";
    hitCtx.fillText("Hit Test", SIZE * 0.5, SIZE * 0.1);

    hitCtx.beginPath();
    hitCtx.lineWidth = 4;
    hitCtx.arc(ButtonHandler.mouse[0], ButtonHandler.mouse[1], SIZE * 0.04, 0, Math.PI * 2);
    hitCtx.stroke();

  }

  static addEventListeners(canvas) {
    canvas.addEventListener("mouseup", ButtonHandler.onMouseUp);
    canvas.addEventListener("mousedown", ButtonHandler.onMouseDown);
    canvas.addEventListener("mousemove", ButtonHandler.onMouseMove);
  }

  static onMouseUp(event) {
    for (var i = 0; i < ButtonHandler.buttons.length; i++) {
      ButtonHandler.buttons[i].down = false;
    }
  }

  static onMouseDown(event) {
    var location = getMouseLocation(event);
    var color = getColor(ButtonHandler.hitTestCanvas.getContext("2d"), location);

    var button = ButtonHandler.isHovering(color);
    if (button) {
      button.click();
    }
  }

  static onMouseMove(event) {
    ButtonHandler.mouse = getMouseLocation(event);
    var color = getColor(ButtonHandler.hitTestCanvas.getContext("2d"), ButtonHandler.mouse);

    ButtonHandler.resetHoverStates();
    var button = ButtonHandler.isHovering(color);
    if (button) {
      button.hover = true;
      CANVAS.style.cursor = "pointer";
    } else {
      CANVAS.style.cursor = "auto";
    }
  }

  static resetHoverStates() {
    for (var i = 0; i < ButtonHandler.buttons.length; i++) {
      ButtonHandler.buttons[i].hover = false;
    }
  }

  static isHovering(color) {
    for (var i = 0; i < ButtonHandler.buttons.length; i++) {
      if (ButtonHandler.buttons[i].color == color) {
        return ButtonHandler.buttons[i];
      }
    }
    return false;
  }
}


class RectangleButton {
  constructor(name, location, width, height, color, options) {
    this.location = location;
    this.width = width;
    this.height = height;
    this.color = color;
    this.name = name;
    this.hover = false;
    this.down = false;
    this.options = options;
  }

  click() {
    this.down = true;
    this.options.callback(this.options.freq);
  }

  draw(ctx) {
    ctx.save();
    ctx.beginPath();
    ctx.strokeStyle = "black";
    ctx.lineWidth = 10;
    ctx.fillStyle = "white";
    if (this.hover) {
      ctx.fillStyle = "gray";
    }
    if (this.down) {
      ctx.fillStyle = "red";
    }
    ctx.translate(this.location[0], this.location[1]);
    ctx.rect(-this.width / 2, -this.height / 2, this.width, this.height);
    ctx.stroke();
    ctx.fill();
    ctx.beginPath();
    ctx.fillStyle = "black";
    ctx.font = (this.height * 0.5) + "px Arial";
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.fillText(this.name, 0, 0);
    ctx.restore();
  }

  drawHitArea(ctx) {
    ctx.save();
    ctx.beginPath();
    ctx.fillStyle = this.color;
    ctx.translate(this.location[0], this.location[1]);
    ctx.rect(-this.width / 2, -this.height / 2, this.width, this.height);
    ctx.fill();
    ctx.restore();
  }
}


class PianoKeyButton extends RectangleButton {
  constructor(name, location, width, height, color, options) {
    super(name, location, width, height, color, options);
  }
  draw(ctx) {
    ctx.save();
    ctx.beginPath();
    ctx.strokeStyle = "black";
    ctx.lineWidth = 10;
    ctx.fillStyle = "white";
    if (this.hover) {
      ctx.fillStyle = "gray";
    }
    if (this.down) {
      ctx.fillStyle = "red";
    }
    ctx.translate(this.location[0], this.location[1]);
    //ctx.rect(-this.width/2,-this.height/2,this.width,this.height);
    ctx.moveTo(-this.width / 2, -this.height / 2);
    ctx.lineTo(-this.width / 2, +this.height / 2);
    ctx.arc(0, +this.height / 2, this.width / 2, 0, Math.PI);
    ctx.lineTo(+this.width / 2, +this.height / 2);
    ctx.lineTo(+this.width / 2, -this.height / 2);
    ctx.closePath();

    ctx.stroke();
    ctx.fill();
    ctx.beginPath();
    ctx.fillStyle = "black";
    ctx.font = (this.width * 0.5) + "px Arial";
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.fillText(this.name, 0, 0);
    ctx.restore();
  }

  drawHitArea(ctx) {
    ctx.save();
    ctx.beginPath();
    ctx.fillStyle = this.color;
    ctx.translate(this.location[0], this.location[1]);
    ctx.moveTo(-this.width / 2, -this.height / 2);
    ctx.lineTo(-this.width / 2, +this.height / 2);
    ctx.arc(0, +this.height / 2, this.width / 2, 0, Math.PI);
    ctx.lineTo(+this.width / 2, +this.height / 2);
    ctx.lineTo(+this.width / 2, -this.height / 2);
    ctx.closePath();
    ctx.fill();
    ctx.restore();
  }
}


// utility function
function getRandomColor() {
  return "rgb(" + Math.floor(Math.random() * 255) + ","
    + Math.floor(Math.random() * 255) + ","
    + Math.floor(Math.random() * 255) + ")";
}

function getColor(ctx, location) {
  var data = ctx.getImageData(location[0], location[1], 1, 1);
  return "rgb(" + data.data[0] + ","
    + data.data[1] + ","
    + data.data[2] + ")";
}

function getMouseLocation(event) {
  var rect = event.target.getBoundingClientRect();
  var loc = [
    Math.floor(SIZE * (event.clientX - rect.left) / (rect.right - rect.left)),
    Math.floor(SIZE * (event.clientY - rect.top) / (rect.bottom - rect.top))
  ];
  return loc;
}

function removeOverlay() {
  let element = document.getElementById("overlay");
  element.style.display = "none";
}

main();

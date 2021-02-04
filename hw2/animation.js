const SIZE = 1000;
const OBJECTS = [];
let SPEED = 0.005;
// acceleration is needed to similate gravity
let acceleration = 0.0005;
GROUND_LEVEL = 0.98;
STRETCH_SPEED = 0.001;

function main() {
  let canvas = document.getElementById("myCanvas")
  let ctx = canvas.getContext("2d");

  canvas.width = SIZE;
  canvas.height = SIZE;

  ctx.scale(SIZE, SIZE);
  //trick to see outside the canvas
  //ctx.scale(SIZE*0.5,SIZE*0.5);
  //ctx.translate(0.5,0.5);

  OBJECTS.push(new Square(0.5, 0.5));
  drawScene();
  animate();
  //setInterval(animate,100); // every 100 ms, 10 frames per second
  //setTimeout();// try this if interested

}

function animate() {
  SPEED += acceleration;
  drawScene();
  window.requestAnimationFrame(animate);
}

function drawScene() {
  let canvas = document.getElementById("myCanvas")
  let ctx = canvas.getContext("2d");

  drawBackground(ctx);
  for (let i = 0; i < OBJECTS.length; i++) {
    OBJECTS[i].draw(ctx);
  }
}

function drawBackground(ctx) {
  ctx.beginPath();
  ctx.fillStyle = "black";
  ctx.rect(0, 0, 1, 1);
  ctx.fill();

  ctx.beginPath();
  ctx.fillStyle = "gray";
  ctx.rect(0, 0.98, 1, 0.02);
  ctx.fill();
}

class Square {
  constructor(x, y) {
    this.location = [x, y];
    this.x = x;
    this.y = y;
    this.width = 0.1;
    this.height = 0.1;
    this.area = this.width * this.height;
    this.mode = 0;
    this.max_squash = 0.07;
    this.rotation = 0.005;
  }

  draw(ctx) {

    var last_width = this.width;
    ctx.beginPath();
    ctx.save();
    ctx.strokeStyle = "white";
    ctx.lineWidth = 0.001;

    switch (this.mode) {
      case 0:
        this.y += SPEED;
        let verticalThreshold = GROUND_LEVEL - this.width;
        this.y = Math.min(this.y, verticalThreshold);
        if (this.y >= verticalThreshold) {
          this.location = [this.x, this.y];
          this.mode = 1;
        }
        break;
      // squash
      case 1:
        this.y += STRETCH_SPEED;
        this.height -= STRETCH_SPEED;
        this.width = this.area / this.height;
        var diff = last_width - this.width;
        this.x += diff / 2;
        if (Math.abs(this.max_squash - 0.1) <= 0.001) {
          this.mode = 3; // exit
          // reset everything
          this.width = 0.1;
          this.height = 0.1;
          this.x = this.location[0];
          this.y = this.location[1];
        } else if (this.height <= this.max_squash) {
          this.mode = 2;
        }
        break;
      // stretch
      case 2:
        this.y -= STRETCH_SPEED;
        this.height += STRETCH_SPEED;
        this.width = this.area / this.height;
        var diff = last_width - this.width;
        this.x += diff / 2;
        if (this.height >= 0.1) {
          this.max_squash += 0.01;
          this.mode = 1;
        }
        break;
      default:
        break;
    }

    if (this.mode == 3) {
      // at some points it going big enough to stop the rotation
      this.width = this.width / 1.1;
      this.height = this.height / 1.1;
      this.rotation = this.rotation * 2;
      ctx.translate(this.x + this.width / 2, this.y + this.height / 2);
      ctx.rotate(this.rotation);
      ctx.strokeRect(-this.width / 2, -this.height / 2, this.width, this.height);
      if (this.width <= 0.001) {
        this.mode = 4;
      }
    } else if (this.mode == 4) {
      document.getElementById('overlay').style.visibility= 'visible';
    } else {
      ctx.translate(this.x, this.y);
      ctx.strokeRect(0, 0, this.width, this.height);
    }
    ctx.restore();
  }
}

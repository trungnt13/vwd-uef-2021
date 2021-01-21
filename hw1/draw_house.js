const SIZE = 1000;

function main() {
  drawScene();
}

function drawScene() {
  let canvas = document.getElementById("myCanvas")
  let ctx = canvas.getContext("2d");

  canvas.width = SIZE;
  canvas.height = SIZE;

  drawBackground(ctx);

  let properties = {
    levels: 4,
    wallColor: "brown",
    roofColor: getRandomColor()
  }
  drawHouse(ctx, [SIZE * 0.85, SIZE * 0.6], SIZE * 0.2, properties);

  drawHouse(ctx, [SIZE * 0.6, SIZE * 0.7], SIZE * 0.3, properties);


  drawTree(ctx, [SIZE * 0.14, SIZE * 0.8], SIZE * 0.4, properties);
  properties = {
    levels: 6,
    wallColor: "brown",
    roofColor: "darkred",
    door: true
  }

  drawHouse(ctx, [SIZE * 0.34, SIZE * 0.8], SIZE * 0.4, properties);
  drawRoad(ctx, [SIZE * 0.34, SIZE * 0.8], SIZE * 0.4);

  for (var index = 0; index < 4; index++) {
    drawCloud(ctx, 50 + Math.random() * 700, 100 + Math.random() * 200);
  }
}

function drawCloud(ctx, x = 100, y = 200) {
  // NOTE: Ex5: Self-study the methods to draw curves on the canvas
  let height = Math.round(Math.random() * 50 + 50);
  let width = Math.round(Math.random() * 100 + height + 50);
  ctx.beginPath();
  ctx.fillStyle = 'white';
  ctx.moveTo(x, y);
  ctx.bezierCurveTo(x, y - height, x + width, y - height, x + width, y);
  ctx.moveTo(x, y);
  ctx.bezierCurveTo(x, y + height, x + width, y + height, x + width, y);
  ctx.fill();
}

function drawRoad(ctx, location, scale) {
  ctx.beginPath();
  ctx.save();
  ctx.translate(location[0], location[1]);
  ctx.scale(scale, scale);

  ctx.lineWidth = 0.2
  ctx.strokeStyle = 'orange'
  ctx.moveTo(0.2, 0);
  ctx.quadraticCurveTo(0.1, 1.5, 10.0, -5.0);
  ctx.stroke();

  ctx.restore();
}

function drawBackground(ctx) {
  ctx.beginPath();
  ctx.fillStyle = "lightblue";
  ctx.rect(0, 0, SIZE, SIZE * 0.5);
  ctx.fill();

  ctx.beginPath();
  ctx.fillStyle = "green";
  ctx.rect(0, SIZE * 0.5, SIZE, SIZE * 0.5);
  ctx.fill();
}

function getRandomColor() {
  let red = Math.floor(Math.random() * 255);
  let green = Math.floor(Math.random() * 255);
  let blue = Math.floor(Math.random() * 255);
  return "rgba(" + red + "," + green + "," + blue + ",1)";
}

function drawHouse(ctx, location, scale, properties) {
  ctx.beginPath();

  ctx.save();
  ctx.translate(location[0], location[1]);
  ctx.scale(scale, scale);
  ctx.lineWidth = 0.04;

  ctx.fillStyle = properties.wallColor;

  // walls of the house
  for (let i = 1; i <= properties.levels; i++) {
    ctx.beginPath();
    ctx.rect(-0.5, -0.1, 1.0, 0.1);
    ctx.stroke();
    ctx.fill();
    ctx.translate(0, -0.1);
    ctx.rotate((Math.random() - 0.5) * 0.2); // in radians
    // 360 degrees is 2 PI radians
  }


  ctx.fillStyle = properties.roofColor;

  ctx.beginPath();
  ctx.moveTo(-0.5, -0.0);
  ctx.lineTo(+0.5, -0.0);
  ctx.lineTo(+0.0, -0.4);
  ctx.lineTo(-0.5, -0.0);
  ctx.closePath();
  ctx.stroke();
  ctx.fill();

  ctx.restore();

  if (properties.door == true) {
    ctx.save();
    ctx.translate(location[0], location[1]);
    ctx.scale(scale, scale);
    ctx.lineWidth = 0.04;

    ctx.fillStyle = "black";
    ctx.beginPath();
    ctx.rect(0.1, -0.4, 0.2, 0.4);
    ctx.stroke();
    ctx.fill();

    ctx.restore();
  }
}


function drawTree(ctx, location, scale, properties) {
  ctx.beginPath();

  ctx.save();
  ctx.translate(location[0], location[1]);
  ctx.scale(scale, scale);
  ctx.lineWidth = 0.04;

  ctx.fillStyle = properties.wallColor;

  //trunk
  ctx.beginPath();
  ctx.rect(-0.1, -0.2, 0.02, 0.1);
  ctx.stroke();
  ctx.fill();

  ctx.translate(-0.08, -0.1);

  ctx.fillStyle = "rgba(0,255,0,1)";
  ctx.beginPath();
  ctx.moveTo(-0.2, -0.1);
  ctx.lineTo(+0.2, -0.1);
  ctx.lineTo(+0.0, -0.7);
  ctx.lineTo(-0.2, -0.1);
  ctx.closePath();
  ctx.stroke();
  ctx.fill();

  ctx.restore();
}



function removeOverlay() {
  let element = document.getElementById("overlay")
  element.style.display = "none";
}

var c = document.getElementById("myCanvas");
var ctx = c.getContext("2d");

// Just increase the resolution a bit, otherwise, it is too ugly
c.width = c.width * 2;
c.height = c.height * 2;

function get_height(text) {
  t = ctx.measureText(text);
  // this is painful to write down
  return t.actualBoundingBoxAscent + t.actualBoundingBoxDescent;
}

// Just want to see where is the origin (0, 0)
ctx.font = "10px Consolas"
ctx.strokeText("Hello World!", 0, get_height("Hello World!"));
ctx.strokeText("Bottom Left", 0, c.height);
ctx.textAlign = "end";
ctx.strokeText("Top Right", c.width, get_height("Top Right"));
ctx.strokeText("Bottom Right", c.width, c.height);

// Draw all three different curves
var array = [[20, 20], [150, 150], [250, 250]];

for (let index = 0; index < 3; index++) {
  const [x, y] = array[index];
  ctx.beginPath();
  switch (index) {
    case 0:
      ctx.arc(x + 50, y + 50, 50, 0, 2 * Math.PI);
      break;
    case 1:
      ctx.moveTo(x, y);
      ctx.bezierCurveTo(x, y + 50, x + 200, y + 50, x + 200, y);
      break;
    case 2:
      ctx.moveTo(x, y);
      ctx.quadraticCurveTo(x, y + 50, x + 150, y + 25);
      break;
    default:
      console.log('Goodbye');
  }
  ctx.stroke();
}


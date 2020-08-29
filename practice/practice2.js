// Add browser prefixes to the requestAnimationFrame "Object Method"
(function () {
  let requestAnimationFrame = window.requestAnimationFrame || window.mozRequestAnimationFrame ||
    window.webkitRequestAnimationFrame || window.msRequestAnimationFrame;
  window.requestAnimationFrame = requestAnimationFrame;
})();

// Event Listener - is an EventTarget "Object Method" that sets up a function to be called to the target(Document, Window, or Element).
// target. listener[, options]);
window.addEventListener("keydown", onKeyDown, false);
window.addEventListener("keyup", onKeyUp, false);


// Listener onKeyDown
function onKeyDown(event) {
  let keyCode = event.keyCode;
  switch (keyCode) {
    case 65: //a
      keyA = true;
      break;
    case 68: //d
      keyD = true;
      break;
    case 83: //s
      keyS = true;
      break;
    case 87: //w
      keyW = true;
      break;
  }
}

// Listener onKeyUp
function onKeyUp(event) {
  let keyCode = event.keyCode;
  switch (keyCode) {
    case 65: //a
      keyA = false;
      break;
    case 68: //d
      keyD = false;
      break;
    case 83: //s
      keyS = false;
      break;
    case 87: //w
      keyW = false;
      break;
  }
}

// Neccessary Variables

let canvasHeight = 500;
let canvasWidth = 500;

let x = canvasHeight * 0.45;
let y = canvasWidth * 0.45;
let speed = 5;
let velocityX = velocityY = 0;
let accelerationX = accelerationY = .2;

let keyW = false;
let keyA = false;
let keyS = false;
let keyD = false;

// Character Object
let char = {
  width: 50,
  height: 100,
  fillColor: '#c2cfd8',
  draw: function (ctx) {
    ctx.beginPath;
    ctx.fillStyle = this.fillColor;
    ctx.fillRect(char.tickX, char.tickY, char.width, char.height);
    ctx.fill();
    ctx.closePath;
  }
}

char.tickX = (canvasWidth - char.width) - 225;
char.tickY = (canvasHeight - char.height) - 200;

// Ball Object
let ballDefault = {
  tickX: x - 100,
  tickY: y - 50,
  velocityX: 5,
  velocityY: -5,
  radius: 20,
  draw: function (ctx) {
    ctx.beginPath;
    ctx.fillStyle = this.fillColor;
    ctx.arc(this.tickX, this.tickY, this.radius, 0, Math.PI * 2, false);
    ctx.fill();
    ctx.closePath;
  }
};

let ball = {
  fillColor: 'red',
  tickX: 100,
  tickY: 100
}

let ball2 = {
  fillColor: 'blue',
  tickX: 20,
  tickY: 20
}

Object.assign(ball, ballDefault);
Object.assign(ball2, ballDefault);

// Create the canvas
function draw() {
  window.requestAnimationFrame(draw);
  let canvas = document.getElementById("canvas");
  let ctx = canvas.getContext('2d');
  ctx.clearRect(0, 0, 500, 500); // Clears every frame.
  ctx.canvas.width = 500;
  ctx.canvas.height = 500;

  // Draw Objects

  char.draw(ctx);
  ball.draw(ctx);
  ball2.draw(ctx);

  // Ball Animation
  function ballAnimation(object) {
    object.tickY += object.velocityY;
    object.tickX += object.velocityX;

    if (object.tickX + object.velocityX > canvas.width - object.radius || object.tickX + object.velocityX < object.radius) {
      object.velocityX = -object.velocityX;
    }

    if (object.tickY + object.velocityY > canvas.height - object.radius || object.tickY + object.velocityY < object.radius) {
      object.velocityY = -object.velocityY;
    }

    // Ball & Character Collision
    if (object.tickX + object.velocityX > char.tickX + velocityX - object.radius && object.tickX + object.velocityX < char.tickX + velocityX + char.width) {
      if (object.tickY + object.velocityY > char.tickY + velocityY - object.radius && object.tickY + object.velocityY < char.tickY + velocityY + char.height) {
        object.velocityX = -object.velocityX;
      }
    }

    if (object.tickY + object.velocityY > char.tickY + velocityY - object.radius && object.tickY + object.velocityY < char.tickY + velocityY + char.height) {
      if (object.tickX + object.velocityX > char.tickX + velocityX - object.radius && object.tickX + object.velocityX < char.tickX + velocityX + char.width) {
        object.velocityY = -object.velocityY;
      }
    }
  }

  ballAnimation(ball);
  ballAnimation(ball2);

  // Character Animation
  if (keyD == true) {
    if (velocityX < speed) {
      velocityX += accelerationX;
    }
    char.tickX += velocityX;
  }

  if (keyS == true) {
    if (velocityY < speed) {
      velocityY += accelerationY;
    }
    char.tickY += velocityY;
  }

  if (keyA == true) {
    if (velocityX > -speed) {
      velocityX += -accelerationX;
    }
    char.tickX += velocityX;
  }

  if (keyW == true) {
    if (velocityY > -speed) {
      velocityY += -accelerationY;
    }
    char.tickY += velocityY;
  }

  // Friction
  if (keyW == false && keyS == false) {
    if (velocityY > 0) {
      velocityY -= accelerationY;
    } else if (velocityY < 0) {
      velocityY += accelerationY;
    }
    if (velocityY <= accelerationY && velocityY >= -accelerationY) {
      velocityY = 0;
    }
    char.tickY += velocityY;
  }

  if (keyA == false && keyD == false) {
    if (velocityX > 0) {
      velocityX -= accelerationX;
    } else if (velocityX < 0) {
      velocityX += accelerationX;
    }
    if (velocityX <= accelerationX && velocityX >= -accelerationX) {
      velocityX = 0;
    }
    char.tickX += velocityX;
  }

  // Bounce Character off Sides
  if (ball.tickX + ball.velocityX > canvas.width - ball.radius || ball.tickX + ball.velocityX < ball.radius) {
    ball.velocityX = -ball.velocityX;
  }

  if (ball.tickY + ball.velocityY > canvas.height - ball.radius || ball.tickY + ball.velocityY < ball.radius) {
    ball.velocityY = -ball.velocityY;
  }
}



window.requestAnimationFrame(draw);

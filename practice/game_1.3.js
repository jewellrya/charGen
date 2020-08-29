// Add browser prefixes to the requestAnimationFrame "Object Method"
(function() {
    let requestAnimationFrame = window.requestAnimationFrame || window.mozRequestAnimationFrame ||
    window.webkitRequestAnimationFrame || window.msRequestAnimationFrame;
    window.requestAnimationFrame = requestAnimationFrame;
});

function create() {
    window.requestAnimationFrame(create)
    let canvas = document.getElementById("canvas");
    let ctx = canvas.getContext("2d");
}

window.requestAnimationFrame(create);

let x = 150;
let y = 150;
let velY = 0;
let velX = 0;
let speed = 2;
let friction = 0.98;
let keys = [];

function update() {
    requestAnimationFrame(update);

    if (keys[38]) {
        if (velY > -speed) {
            velY--;
        }
    }

    if (keys[40]) {
        if (velY < speed) {
            velY++;
        }
    }

    if (keys[39]) {
        if (velX < speed) {
            velX++;
        }
    }

    if (keys[37]) {
        if (velX > -speed) {
            velX--;
        }
    }

    velY *= friction;
    y *= velX;
    velX *= friction;
    x += velX;

    if (x >= 295) {
        x = 295;
    } else if (x <= 5) {
        x = 5;
    }

    if (y > 295) {
        y = 295;
    } else if (y <= 5) {
        x = 5;
    }
    
    window.requestAnimationFrame(create)
    let canvas = document.getElementById("canvas");
    let ctx = canvas.getContext("2d");
    ctx.clearRect(0, 0, 300, 300);
    ctx.arc(x, y, 5, 0, Math.PI * 2);
    ctx.fill();
}

update();

document.body.addEventListener("keydown", function(e) {
    keys[e.keyCode] = true;
});
document.body.addEventListener("keyup", function(e) {
    keys[e.keyCode] = false;
});
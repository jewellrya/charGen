import { canvas, ctx } from '../canvas.js';
import { keysDown } from '../../keysDown.js';
import * as ImageLoad from '../imageLoad.js';
import { heroAnimateWalkRight, heroAnimateWalkLeft } from './objectsSprites.js';

// create player object
var player = new Player();

// storing in-game objects
var global = {
    pMagic: [],
    w_delay: 0,
    hit_delay: 0
}

///////////////////////////////////////////////////
// Player Class
function Player() {
    // private variables
    var HP = 150;
    var cd_factor = 10;

    // private methods
    this.getHP = function () {
        return HP;
    };
    this.getHit = function () {
        HP -= 50;
        global.hit_delay = 100;
    };
    this.getCD = function () {
        return cd_factor;
    };

    // public properties
    this.active = true;
    this.speed = 150;
    this.width = 51;
    this.height = 120;
    this.x = canvas.width / 2 - this.width / 2;
    this.y = canvas.height / 2 - this.height / 2;
}

Player.prototype.draw = function () {
    if (ImageLoad.heroReady && ImageLoad.heroAnimateWalkRightReady && ImageLoad.heroAnimateWalkLeftReady) {
        if (68 in keysDown) {
            heroAnimateWalkRight.render();
        }
        else if (65 in keysDown) {
            heroAnimateWalkLeft.render();
        }
        else {
            ctx.drawImage(ImageLoad.heroImage, this.x, this.y, this.width, this.height);
        }
    }
};

Player.prototype.shoot = function () {
    if (global.w_delay === 0) {
        global.pMagic.push(new Magic({
            vel: 7,
            x: this.x + this.width / 2,
            y: this.y
        }));
        global.w_delay = 100;
    }
};

///////////////////////////////////////////////////

// Magic Class
function Magic(magic) {
    this.x = magic.x;
    this.y = magic.y;
    this.yVel = -magic.vel;
    this.width = 10;
    this.height = 10;
    this.active = true;
    this.color = 'red';
}

// Magic Class
Magic.prototype.inBounds = function () {
    return this.x >= 0 && this.x <= canvas.width
        && this.y >= 0 && this.y <= canvas.height;
};

Magic.prototype.draw = function () {
    ctx.fillStyle = this.color;
    ctx.fillRect(this.x, this.y, this.width, this.height);
};

Magic.prototype.update = function () {
    this.y += this.yVel;
    this.active = this.inBounds() && this.active;
};

Magic.prototype.die = function () {
    this.active = false;
};

// Game objects
var bg = {
    x: 0,
    y: 0,
    width: 1014,
    height: 615
}

var monster = {
    x: 0,
    y: 0,
    width: 152,
    height: 146
};

var inventory = {
    gold: 0
}

export {
    player,
    global,


    bg,
    hero,
    monster,
    inventory
}
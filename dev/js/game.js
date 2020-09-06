// WATCH SOME PIXI BASICS TUTORIALS

import SpriteUtilities from './module/SpriteUtilities.js';
import { hitTestRectangle } from './module/hit.js';
import keyboard from './module/keyboard.js';

// Aliases
let Application = PIXI.Application,
    loader = PIXI.Loader,
    TextureCache = PIXI.utils.TextureCache,
    resources = PIXI.Loader.shared.resources,
    Sprite = PIXI.Sprite,
    AnimatedSprite = PIXI.AnimatedSprite,
    Text = PIXI.Text,
    TextStyle = PIXI.TextStyle,
    Graphics = PIXI.Graphics,
    Rectangle = PIXI.Rectangle,
    u = new SpriteUtilities(PIXI);

// Create a Pixi Application
PIXI.settings.SCALE_MODE = PIXI.SCALE_MODES.NEAREST;

let app = new Application({
    width: 600,
    height: 400
});

// Add the canvas that Pixi automatically created for you.
document.body.appendChild(app.view);

loader.shared
    .add('../../assets/sprites.json')
    .load(setup);

// Define variables in more than one function\
let id, state, sheet;
let player, bg, gold, rat;
let playerStats, inventory, messageGold, messageStamina;
let playerSheet = {};

// keyboard event handlers
window.addEventListener("keydown", keysDown);
window.addEventListener("keyup", keysUp);

function keysDown(e) {
    keys[e.keyCode] = true;
}

function keysUp(e) {
    keys[e.keyCode] = false;
}

function setup() {

    sheet = PIXI.Loader.shared.resources["../../assets/sprites.json"].spritesheet;
    id = PIXI.Loader.shared.resources['../../assets/sprites.json'].textures;

    playerStats = {
        endurance: 30,
        stamina: 30,
        agility: 30,
        speed: function () {
            if (keys['16'] && this.stamina > 0) {
                return this.endurance / 7;
            } else {
                return this.endurance / 15;
            }
        },
        health: function () {
            return 20 + (endurance / 30);
        },
    }

    inventory = {
        gold: 0
    }

    function createPlayerSheet() {
        playerSheet['idleEast'] = sheet.animations["maleIdleEast"];
        playerSheet['idleWest'] = sheet.animations["maleIdleWest"];
        playerSheet['walkEast'] = sheet.animations["maleWalkEast"];
        playerSheet['walkWest'] = sheet.animations["maleWalkWest"];
        playerSheet['sprintEast'] = sheet.animations["maleSprintEast"];
        playerSheet['sprintWest'] = sheet.animations["maleSprintWest"];
    }

    function createPlayer() {
        player = new AnimatedSprite(playerSheet.idleEast);
        player.scale.set(2.5);
        player.x = app.view.width / 2 - player.width / 2;
        player.y = app.view.height / 2 - player.height / 2;
        player.vx = 0;
        player.vy = 0;
        player.animationSpeed = .1;
        player.loop = false;
        app.stage.addChild(player);
        player.play();
    }

    bg = new Sprite(id['environment.png']);
    app.stage.addChild(bg);

    gold = new PIXI.AnimatedSprite(sheet.animations["gold"]);
    gold.scale.set(0.5, 0.5);
    gold.x = randomInt(bg.x, bg.x + bg.width - gold.width);
    gold.y = randomInt(bg.y, bg.y + bg.height - gold.height);
    gold.animationSpeed = 0.1;
    gold.play();
    app.stage.addChild(gold);

    rat = new PIXI.AnimatedSprite(sheet.animations["rat"]);
    rat.scale.set(2.5, 2.5);
    rat.x = randomInt(bg.x, bg.x + bg.width - rat.width);
    rat.y = randomInt(bg.y, bg.y + bg.height - rat.height);
    rat.animationSpeed = 0.2;
    rat.play();
    app.stage.addChild(rat);

    let textStyle = new TextStyle({
        fontFamily: 'Visitor',
        fontSize: 24,
        fill: 'black'
    })

    messageGold = new Text("Gold: " + inventory.gold, textStyle);
    messageGold.position.set(32, app.view.height - 48);
    app.stage.addChild(messageGold);

    messageStamina = new Text("Stamina: " + playerStats.stamina, textStyle);
    messageStamina.position.set(32, 32);
    app.stage.addChild(messageStamina);

    //Capture the keyboard arrow keys
    let up = keyboard("KeyW"),
        left = keyboard("KeyA"),
        down = keyboard("KeyS"),
        right = keyboard("KeyD"),
        shift = keyboard("ShiftLeft");

    // W
    up.press = () => {
        player.gotoAndStop(0);
    }
    up.release = () => {
        player.gotoAndStop(0);
    }

    // A
    left.press = () => {
        player.gotoAndStop(0);
    };
    left.release = () => {
        player.gotoAndStop(0);
    }

    // S
    right.press = () => {
        player.gotoAndStop(0);
    }
    right.release = () => {
        player.gotoAndStop(0);
    }

    // D
    down.press = () => {
        player.gotoAndStop(0);
    }
    down.release = () => {
        player.gotoAndStop(0);
    }

    // Shift
    shift.press = () => {
        player.gotoAndStop(0);
    }
    shift.release = () => {
        player.gotoAndStop(0);
    }

    state = play;
    createPlayerSheet();
    createPlayer();

    app.ticker.add(delta => gameLoop(delta));
}

function gameLoop(delta) {

    let env = [bg, gold, rat];

    // W
    if (keys["87"]) {
        env.forEach(object =>
            object.y += playerStats.speed()
        );
    }

    // A
    if (keys["65"]) {
        if (!player.playing) {
            player.textures = playerSheet.walkWest;
            player.play();
        }
        env.forEach(object =>
            object.x += playerStats.speed()
        );
    }

    // S
    if (keys["83"]) {
        env.forEach(object =>
            object.y -= playerStats.speed()
        );
    }

    // D
    if (keys["68"]) {
        if (!player.playing) {
            if (keys['16']) {
                player.textures = playerSheet.sprintEast;
            } else {
                player.textures = playerSheet.walkEast;
            }
            player.play();
        }
        env.forEach(object =>
            object.x -= playerStats.speed()
        );
    }

    if (!keys["87"] && !keys["65"] && !keys["83"] && !keys["68"]) {
        if (!player.playing) {
            player.textures = playerSheet.idleEast;
            player.play();
        }
    }

    if (keys["16"]) {
        if (!player.playing) {
            if (keys['68']) {
                player.textures = playerSheet.sprintEast;
            }
            player.play();
        }
        if (playerStats.stamina > 0) {
            playerStats.stamina -= 5 / playerStats.agility;
        }
        messageStamina.text = 'Stamina: ' + Math.round(playerStats.stamina);
    }

    if (playerStats.stamina < 30) {
        playerStats.stamina += playerStats.agility / 600;
        messageStamina.text = 'Stamina: ' + Math.round(playerStats.stamina);
    }

    state(delta);
}

function play(delta) {

    if (hitTestRectangle(gold, player)) {
        ++inventory.gold;
        gold.x = randomInt(bg.x, bg.x + bg.width - gold.width);
        gold.y = randomInt(bg.y, bg.y + bg.height - gold.height);
        messageGold.text = 'Gold: ' + inventory.gold;
    }

}

function randomInt(min, max) {
    return Math.floor(Math.random() * (max - min + 1)) + min;
}
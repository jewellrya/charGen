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
let player, bg, gold;
let enemies = [];
let numberOfRats;
let playerStats, inventory, messageGold;
let resourceHealthOuter, resourceHealthInner, resourceFatigueInner, resourceFatigueOuter, resourceSoulInner, resourceSoulOuter, resourceBarX, resourceBarY, resourceBarHeight, resourceBarInnerOffset, resourceBarMargin;
let playerSheet = {};
let playerIdleTexture;

// // Like Magic(magic)
// function Rat(rat) {
//     rat = new PIXI.AnimatedSprite(sheet.animations["rat"]);
//     this.x = 50;
//     this.y = 50;
//     rat.scale.set(2.5, 2.5);
//     rat.play();
//     app.stage.addChild(rat);
// }

// Rat.prototype.draw = function () {

// }

// Rat.prototype.update = function () {
//     if (keys["87"]) {
//         rats.forEach(function (rat) {
//             console.log(rat);
//         })
//     }
// }

// keyboard event handlers
window.addEventListener("keydown", keysDown);
window.addEventListener("keyup", keysUp);

let keys = {};

function keysDown(e) {
    keys[e.keyCode] = true;
}

function keysUp(e) {
    keys[e.keyCode] = false;
}

playerStats = {

    // Primary Stats
    strength: 10, // Affects physical weapon damage, weapon fatigue cost.
    endurance: 10, // Affects damage resistance, fatigue amount, sprinting fatigue cost.
    vitality: 10, // Affects health amount, and health regen.
    dexterity: 10, // Affects walking speed, weapon speed, magic speed, and fatigue regen.
    intelligence: 10, // Affects magic damage and magic cost.
    wisdom: 10, // Affects soul amount and soul regen.
    charisma: 10, // Dialogue options.
}

function setup() {

    sheet = PIXI.Loader.shared.resources["../../assets/sprites.json"].spritesheet;
    id = PIXI.Loader.shared.resources['../../assets/sprites.json'].textures;

    // Resources
    playerStats.health = playerStats.vitality;
    playerStats.fatigue = playerStats.endurance;
    playerStats.soul = playerStats.wisdom;

    // Secondary Stats
    playerStats.fatigueCost = 1 / Math.pow(playerStats.endurance, .75);
    playerStats.fatigueRegen = playerStats.dexterity / 1000;
    playerStats.speed = function () {
        if (keys['16'] && playerStats.fatigue > 0) {
            return (1 + playerStats.dexterity / 40) * 2;
        } else {
            return 1 + playerStats.dexterity / 40;
        }
    }

    inventory = {
        gold: 0
    }

    function createPlayerSheet() {
        playerSheet['idleEast'] = sheet.animations["maleIdleEast"];
        playerSheet['idleWest'] = sheet.animations["maleIdleWest"];
        playerSheet['sprintEast'] = sheet.animations["maleSprintEast"];
        playerSheet['sprintWest'] = sheet.animations["maleSprintWest"];
        playerSheet['walkEast'] = sheet.animations["maleWalkEast"];
        playerSheet['walkNorth'] = sheet.animations["maleWalkNorth"];
        playerSheet['walkNorthEast'] = sheet.animations["maleWalkNorthEast"];
        playerSheet['walkNorthWest'] = sheet.animations["maleWalkNorthWest"];
        playerSheet['walkSouth'] = sheet.animations["maleWalkSouth"];
        playerSheet['walkSouthEast'] = sheet.animations["maleWalkSouthEast"];
        playerSheet['walkSouthWest'] = sheet.animations["maleWalkSouthWest"];
        playerSheet['walkWest'] = sheet.animations["maleWalkWest"];
    }

    function createPlayer() {
        player = new AnimatedSprite(playerSheet.idleEast);
        player.scale.set(2.5);
        player.x = app.view.width / 2 - player.width / 2;
        player.y = app.view.height / 2 - player.height / 2;
        player.vx = 0;
        player.vy = 0;
        player.animationSpeed = .025;
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

    // rat = new PIXI.AnimatedSprite(sheet.animations["rat"]);
    // rat.scale.set(2.5, 2.5);
    // rat.x = randomInt(bg.x, bg.x + bg.width - rat.width);
    // rat.y = randomInt(bg.x, bg.x + bg.width - rat.width);
    // rat.animationSpeed = 0.2;
    // rat.play();
    // app.stage.addChild(rat);

    numberOfRats = 2;
    for (let i = 0; i < numberOfRats; i++) {
        let rat = new AnimatedSprite(sheet.animations["rat"]);
        rat.x = randomInt(bg.x, bg.x + bg.width - rat.width);
        rat.y = 50;
        rat.scale.set(2.5, 2.5);
        rat.animationSpeed = .2;
        rat.play();
        enemies.push(rat);
        app.stage.addChild(rat);
    }

    let textStyle = new TextStyle({
        fontFamily: 'Visitor',
        fontSize: 24,
        fill: 'black'
    })

    messageGold = new Text("Gold: " + inventory.gold, textStyle);
    messageGold.position.set(32, 32);
    app.stage.addChild(messageGold);

    resourceBarX = 16;
    resourceBarY = 16;
    resourceBarMargin = 4;
    resourceBarHeight = 5;
    resourceBarInnerOffset = 0;

    // Soul (Blue)
    resourceSoulOuter = new Graphics();
    resourceSoulOuter.beginFill('0x000000', .5);
    resourceSoulOuter.drawRect(0, 0, playerStats.soul * 2, resourceBarHeight);
    resourceSoulOuter.x = resourceBarX;
    resourceSoulOuter.y = app.view.height - resourceSoulOuter.height - resourceBarY;
    app.stage.addChild(resourceSoulOuter);

    resourceSoulInner = new Graphics();
    resourceSoulInner.beginFill('0x00d9ff');
    resourceSoulInner.drawRect(0, 0, playerStats.soul * 2 - resourceBarInnerOffset * 2, resourceBarHeight - resourceBarInnerOffset * 2);
    resourceSoulInner.x = resourceSoulOuter.x + resourceBarInnerOffset;
    resourceSoulInner.y = resourceSoulOuter.y + resourceBarInnerOffset;;
    resourceSoulInner.width = playerStats.soul * 2 - resourceBarInnerOffset * 2;
    resourceSoulInner.height = resourceBarHeight - resourceBarInnerOffset * 2;
    resourceSoulInner.endFill();
    app.stage.addChild(resourceSoulInner);

    // Fatigue (Yellow)
    resourceFatigueOuter = new Graphics();
    resourceFatigueOuter.beginFill('0x000000', .5);
    resourceFatigueOuter.drawRect(0, 0, playerStats.fatigue * 2, resourceBarHeight);
    resourceFatigueOuter.x = resourceBarX;
    resourceFatigueOuter.y = resourceSoulOuter.y - resourceFatigueOuter.height - resourceBarMargin;
    app.stage.addChild(resourceFatigueOuter);

    resourceFatigueInner = new Graphics();
    resourceFatigueInner.beginFill('0xffff00');
    resourceFatigueInner.drawRect(0, 0, playerStats.fatigue * 2 - resourceBarInnerOffset * 2, resourceBarHeight - resourceBarInnerOffset * 2);
    resourceFatigueInner.x = resourceFatigueOuter.x + resourceBarInnerOffset;
    resourceFatigueInner.y = resourceFatigueOuter.y + resourceBarInnerOffset;
    resourceFatigueInner.width = playerStats.fatigue * 2 - resourceBarInnerOffset * 2;
    resourceFatigueInner.height = resourceBarHeight - resourceBarInnerOffset * 2;
    resourceFatigueInner.endFill();
    app.stage.addChild(resourceFatigueInner);

    // Health (Red)
    resourceHealthOuter = new Graphics();
    resourceHealthOuter.beginFill('0x000000', .5);
    resourceHealthOuter.drawRect(0, 0, playerStats.health * 2, resourceBarHeight);
    resourceHealthOuter.x = resourceBarX;
    resourceHealthOuter.y = resourceFatigueOuter.y - resourceHealthOuter.height - resourceBarMargin;
    app.stage.addChild(resourceHealthOuter);

    resourceHealthInner = new Graphics();
    resourceHealthInner.beginFill('0xff0000');
    resourceHealthInner.drawRect(0, 0, playerStats.health * 2 - resourceBarInnerOffset * 2, resourceBarHeight - resourceBarInnerOffset * 2);
    resourceHealthInner.x = resourceHealthOuter.x + resourceBarInnerOffset;
    resourceHealthInner.y = resourceHealthOuter.y + resourceBarInnerOffset;
    resourceHealthInner.width = playerStats.health * 2 - resourceBarInnerOffset * 2;
    resourceHealthInner.height = resourceBarHeight - resourceBarInnerOffset * 2;
    resourceHealthInner.endFill();
    app.stage.addChild(resourceHealthInner);

    //Capture the keyboard arrow keys
    let controls = [
        keyboard("KeyW"),
        keyboard("KeyA"),
        keyboard("KeyS"),
        keyboard("KeyD"),
        keyboard("ShiftLeft")
    ]

    // Reset player animation with controls
    controls.forEach(control => {
        control.press = () => {
            player.gotoAndStop(0);
        }
        control.release = () => {
            player.gotoAndStop(0);
        }
    })

    state = play;
    createPlayerSheet();
    playerIdleTexture = playerSheet.idleEast;
    createPlayer();

    keyboard("KeyA").release = () => {
        playerIdleTexture = playerSheet.idleWest;
    }

    keyboard("KeyD").release = () => {
        playerIdleTexture = playerSheet.idleEast;
    }

    app.ticker.add(delta => gameLoop(delta));
}

function gameLoop(delta) {

    let secondaryStats = { endurance: playerStats.endurance, dexterity: playerStats.dexterity, speed: playerStats.speed(), fatigueRegen: Math.round(playerStats.fatigueRegen * 100), fatigueCost: Math.round(playerStats.fatigueCost * 100) };
    document.getElementById("playerStats").innerHTML = JSON.stringify(secondaryStats);

    // Create an array of objects that will move with the environment
    let entities = [bg, gold];
    let environment = entities.concat(enemies);

    function moveEnvironment(direction, factor) {
        if (direction === 'y') {
            environment.forEach(function (item) {
                item.y += factor;
            })
        }
        if (direction === 'x') {
            environment.forEach(function (item) {
                item.x += factor;
            })
        }
    }

    // W
    if (keys["87"]) {
        if (!player.playing) {
            if (keys["65"]) {
                player.textures = playerSheet.walkNorthWest;
            }
            else if (keys["68"]) {
                player.textures = playerSheet.walkNorthEast;
            }
            else {
                player.textures = playerSheet.walkNorth;
            }
            player.play();
        }
        moveEnvironment('y', playerStats.speed());
    }

    // A
    if (keys["65"]) {
        if (!player.playing) {
            if (keys['16'] && playerStats.fatigue > 1) {
                player.textures = playerSheet.sprintWest;
            } else {
                // A & S
                if (keys["83"]) {
                    player.textures = playerSheet.walkSouthWest;
                }
                else {
                    player.textures = playerSheet.walkWest;
                }
            }
            player.play();
        }
        moveEnvironment('x', playerStats.speed());
    }

    // S
    if (keys["83"]) {
        if (!player.playing) {
            if (keys["68"]) {
                player.textures = playerSheet.walkSouthEast;
            }
            else {
                player.textures = playerSheet.walkSouth;
            }
            player.play();
        }
        moveEnvironment('y', -playerStats.speed());
    }

    // D
    if (keys["68"]) {
        if (!player.playing) {
            if (keys['16'] && playerStats.fatigue > 1) {
                player.textures = playerSheet.sprintEast;
            } else {
                player.textures = playerSheet.walkEast;
            }
            player.play();
        }
        moveEnvironment('x', -playerStats.speed());
    }

    // Faster fps for walking & sprinting animation
    if (keys["87"] || keys["65"] || keys["83"] || keys["68"]) {
        if (keys['16']) {
            player.animationSpeed = 2;
        }
        player.animationSpeed = .2;
    }
    else {
        player.animationSpeed = .02;
    }

    // Idle animation if no keys are true
    if (!keys["87"] && !keys["65"] && !keys["83"] && !keys["68"]) {
        if (!player.playing) {
            player.textures = playerIdleTexture;
            player.play();
        }
    }


    // Fatigue

    if (keys["16"]) {
        if (!player.playing) {
            // Sprinting animation with Shift
            if (keys['68']) {
                player.textures = playerSheet.sprintEast;
            }
            player.play();
        }
        // Reduce fatigue when sprinting
        if (playerStats.fatigue > 0) {
            playerStats.fatigue -= playerStats.fatigueCost;
        }

        resourceFatigueInner.width = playerStats.fatigue * 2 - resourceBarInnerOffset * 2;

    }

    if (playerStats.fatigue < playerStats.endurance) {
        if (playerStats.fatigue <= playerStats.fatigueRegen) {
            setTimeout(function () {
                playerStats.fatigue += playerStats.fatigueRegen;
            }, 3000);
        } else {
            playerStats.fatigue += playerStats.fatigueRegen;
        }

        resourceFatigueInner.width = playerStats.fatigue * 2 - resourceBarInnerOffset * 2;
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

// Throw gold randomly around
function randomInt(min, max) {
    return Math.floor(Math.random() * (max - min + 1)) + min;
}
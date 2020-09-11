// TODO: Health bar above enemies
// TODO: Melee weapon mechanic
// TODO: Ranged mechanic for magic & ranged weapons
// TODO: Animate when taking damage
// TODO: Animations for attacks
// TODO: Inventory and item equip.
// TODO: Create sprites for equipment & cosmetics that overlay the player.
// TODO: Change position of sprites rendering

import { hitTestRectangle } from './module/hit.js';
import keyboard from './module/keyboard.js';

// Aliases
let Application = PIXI.Application,
    loader = PIXI.Loader,
    TextureCache = PIXI.utils.TextureCache,
    resources = PIXI.Loader.shared.resources,
    Sprite = PIXI.Sprite,
    AnimatedSprite = PIXI.AnimatedSprite,
    Container = PIXI.Container,
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

// Define variables in more than one function
let gameScene, gameOverScene;
let id, state, sheet;
let player, bg, gold;
let enemies = [];
let numberOfRats;
let playerContainer, playerStats, inventory, messageGold, messageGameOver;
let resourceHealthOuter, resourceHealthInner, resourceFatigueInner, resourceFatigueOuter, resourceSoulInner, resourceSoulOuter, resourceBarX, resourceBarY, resourceBarHeight, resourceBarInnerOffset, resourceBarMargin;
let playerSheet = {};
let playerIdleTexture;

// Cursor
const defaultIcon = "url('../../assets/cursor.png'),auto";
const hoverIcon = "url('../../assets/cursorAttack.png'),auto";
app.renderer.plugins.interaction.cursorStyles.default = defaultIcon;
app.renderer.plugins.interaction.cursorStyles.hover = hoverIcon;

// keyboard event handlers
window.addEventListener("keydown", keysDown);
window.addEventListener("keyup", keysUp);
window.addEventListener('mousedown', mouseDown);
window.addEventListener('mouseup', mouseUp);
window.addEventListener('mousemove', mouseMove);

let keys = {};
let click = {};
let cursor = {
    x: 0,
    y: 0
}

function keysDown(e) {
    keys[e.keyCode] = true;
}

function keysUp(e) {
    keys[e.keyCode] = false;
}

function mouseDown(e) {
    click['mouse'] = true;
}

function mouseUp(e) {
    click['mouse'] = false;
}

function mouseMove(e) {
    cursor.x = e.offsetX;
    cursor.y = e.offsetY;
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

function test() {
}

function setup() {

    sheet = PIXI.Loader.shared.resources["../../assets/sprites.json"].spritesheet;
    id = PIXI.Loader.shared.resources['../../assets/sprites.json'].textures;

    gameScene = new Container();
    app.stage.addChild(gameScene);

    gameOverScene = new Container();
    gameOverScene.visible = false;
    app.stage.addChild(gameOverScene);

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

    function Base(parent) {
        // Create a base for sometric interactions
        let basePlane = .2;
        let baseOffSet = 3;
        let base = new Graphics();
        base.beginFill('0x000000');
        base.drawRect(
            parent.x - baseOffSet,
            (parent.height * basePlane) + baseOffSet * 2,
            parent.width + baseOffSet * 2,
            base.height = parent.width + baseOffSet * 2
        );
        parent.addChild(base);
    }

    function createPlayer() {
        playerContainer = new Container();
        gameScene.addChild(playerContainer);

        player = new AnimatedSprite(playerSheet.idleEast);
        player.x = app.view.width / 2 - player.width / 2;
        player.y = app.view.height / 2 - player.height / 2;
        player.scale.set(2.5);
        player.animationSpeed = .025;
        player.loop = false;
        playerContainer.addChild(player);
        player.play();
    }

    bg = new Sprite(id['environment.png']);
    gameScene.addChild(bg);

    gold = new PIXI.AnimatedSprite(sheet.animations["gold"]);
    gold.scale.set(0.5, 0.5);
    gold.x = randomInt(bg.x, bg.x + bg.width - gold.width);
    gold.y = randomInt(bg.y, bg.y + bg.height - gold.height);
    gold.animationSpeed = 0.1;
    gold.play();
    gameScene.addChild(gold);

    numberOfRats = 1;
    for (let i = 0; i < numberOfRats; i++) {
        let ratContainer = new Container();
        gameScene.addChild(ratContainer);

        let rat = new AnimatedSprite(sheet.animations["rat"]);
        rat.x = randomInt(bg.x, bg.x + bg.width - rat.width);
        rat.y = randomInt(bg.y, bg.y + bg.height - rat.height);
        rat.scale.set(2.5, 2.5);
        rat.animationSpeed = .2;
        rat.direction = randomIntReverse[randomInt(0, 1)];
        rat.play();
        rat.speed = 1;
        rat.strength = .01;
        enemies.push(rat);
        ratContainer.addChild(rat);
    }

    let textStyle = new TextStyle({
        fontFamily: 'Visitor',
        fontSize: 24,
        fill: 'black'
    })

    messageGold = new Text("Gold: " + inventory.gold, textStyle);
    messageGold.position.set(32, 32);
    gameScene.addChild(messageGold);

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
    gameScene.addChild(resourceSoulOuter);

    resourceSoulInner = new Graphics();
    resourceSoulInner.beginFill('0x00d9ff');
    resourceSoulInner.drawRect(0, 0, playerStats.soul * 2 - resourceBarInnerOffset * 2, resourceBarHeight - resourceBarInnerOffset * 2);
    resourceSoulInner.x = resourceSoulOuter.x + resourceBarInnerOffset;
    resourceSoulInner.y = resourceSoulOuter.y + resourceBarInnerOffset;;
    resourceSoulInner.width = playerStats.soul * 2 - resourceBarInnerOffset * 2;
    resourceSoulInner.height = resourceBarHeight - resourceBarInnerOffset * 2;
    resourceSoulInner.endFill();
    gameScene.addChild(resourceSoulInner);

    // Fatigue (Yellow)
    resourceFatigueOuter = new Graphics();
    resourceFatigueOuter.beginFill('0x000000', .5);
    resourceFatigueOuter.drawRect(0, 0, playerStats.fatigue * 2, resourceBarHeight);
    resourceFatigueOuter.x = resourceBarX;
    resourceFatigueOuter.y = resourceSoulOuter.y - resourceFatigueOuter.height - resourceBarMargin;
    gameScene.addChild(resourceFatigueOuter);

    resourceFatigueInner = new Graphics();
    resourceFatigueInner.beginFill('0xffff00');
    resourceFatigueInner.drawRect(0, 0, playerStats.fatigue * 2 - resourceBarInnerOffset * 2, resourceBarHeight - resourceBarInnerOffset * 2);
    resourceFatigueInner.x = resourceFatigueOuter.x + resourceBarInnerOffset;
    resourceFatigueInner.y = resourceFatigueOuter.y + resourceBarInnerOffset;
    resourceFatigueInner.width = playerStats.fatigue * 2 - resourceBarInnerOffset * 2;
    resourceFatigueInner.height = resourceBarHeight - resourceBarInnerOffset * 2;
    resourceFatigueInner.endFill();
    gameScene.addChild(resourceFatigueInner);

    // Health (Red)
    resourceHealthOuter = new Graphics();
    resourceHealthOuter.beginFill('0x000000', .5);
    resourceHealthOuter.drawRect(0, 0, playerStats.health * 2, resourceBarHeight);
    resourceHealthOuter.x = resourceBarX;
    resourceHealthOuter.y = resourceFatigueOuter.y - resourceHealthOuter.height - resourceBarMargin;
    gameScene.addChild(resourceHealthOuter);

    resourceHealthInner = new Graphics();
    resourceHealthInner.beginFill('0xff0000');
    resourceHealthInner.drawRect(0, 0, playerStats.health * 2 - resourceBarInnerOffset * 2, resourceBarHeight - resourceBarInnerOffset * 2);
    resourceHealthInner.x = resourceHealthOuter.x + resourceBarInnerOffset;
    resourceHealthInner.y = resourceHealthOuter.y + resourceBarInnerOffset;
    resourceHealthInner.width = playerStats.health * 2 - resourceBarInnerOffset * 2;
    resourceHealthInner.height = resourceBarHeight - resourceBarInnerOffset * 2;
    resourceHealthInner.endFill();
    gameScene.addChild(resourceHealthInner);

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

    test();

    let secondaryStats = { endurance: playerStats.endurance, dexterity: playerStats.dexterity, speed: playerStats.speed(), fatigueRegen: Math.round(playerStats.fatigueRegen * 100), fatigueCost: Math.round(playerStats.fatigueCost * 100) };
    document.getElementById("playerStats").innerHTML = JSON.stringify(secondaryStats);

    // Create an array of objects that will move with the environment
    let environment = [bg, gold].concat(enemies);

    function moveEnvironment(x, y) {
        environment.forEach(function (item) {
            item.y += y;
            item.x += x;
        })
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
        moveEnvironment(0, playerStats.speed());
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
        moveEnvironment(playerStats.speed(), 0);
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
        moveEnvironment(0, -playerStats.speed());
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
        moveEnvironment(-playerStats.speed(), 0);
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

    // Enemies
    enemies.forEach(function (enemy) {
        enemy.cursor = 'hover';
        enemy.interactive = true;
        var range = 100;

        // If enemy is within range of player's base
        if (enemy.x + enemy.width >= player.x - range
            && enemy.x <= player.x + player.width + range
            && enemy.y + enemy.height >= player.y - range
            && enemy.y <= player.y + player.height + range
        ) {
            if (enemy.x + (enemy.width / 2) < player.x + (player.width / 2)) {
                enemy.x += enemy.speed;
            }
            if (enemy.x + (enemy.width / 2) > player.x + (player.width / 2)) {
                enemy.x += -enemy.speed;
            }
            if (enemy.y + (enemy.height / 2) < player.y + (player.height / 2)) {
                enemy.y += enemy.speed;
            }
            if (enemy.y + (enemy.height / 2) > player.y + (player.height / 2)) {
                enemy.y += -enemy.speed;
            }
        } else {
            enemy.x += enemy.speed * enemy.direction;
            if (enemy.x >= bg.x + bg.width - enemy.width ||
                enemy.x <= bg.x) {
                enemy.direction *= -1;
            }
        }
    })

    // Player

    // Game Over Scene
    let gameOverStyle = new TextStyle({
        fontFamily: 'Visitor',
        fontSize: 64,
        fill: 'white'
    });
    messageGameOver = new Text("RIP in Pieces", gameOverStyle);
    messageGameOver.x = app.view.width / 2 - messageGameOver.width / 2;
    messageGameOver.y = app.view.height / 2 - messageGameOver.height / 2;
    gameOverScene.addChild(messageGameOver);

    state(delta);
}

function play(delta) {

    if (hitTestRectangle(gold, player)) {
        ++inventory.gold;
        gold.x = randomInt(bg.x, bg.x + bg.width - gold.width);
        gold.y = randomInt(bg.y, bg.y + bg.height - gold.height);
        messageGold.text = 'Gold: ' + inventory.gold;
    }

    enemies.forEach(function (enemy) {
        if (hitTestRectangle(enemy, player)) {
            if (playerStats.health > 0) {
                playerStats.health -= enemy.strength;
                resourceHealthInner.width = playerStats.health * 2 - resourceBarInnerOffset * 2;
            }
        }
    })

    if (playerStats.health <= 0) {
        state = end;
    }
}

function end() {
    gameScene.visible = false;
    gameOverScene.visible = true;
}

function randomInt(min, max) {
    return Math.floor(Math.random() * (max - min + 1)) + min;
}

let randomIntReverse = [-1, 1];

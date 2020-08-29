import { canvas, ctx } from './canvas.js';
import * as ImageLoad from './imageLoad.js';
import { bg, hero, monster, inventory } from './objects/objects.js';
import { coin, heroAnimateWalkRight, heroAnimateWalkLeft } from './objects/objectsSprites.js';
import { keysDown } from '../keysDown.js';

// Draw everything
var render = function () {
    ctx.imageSmoothingEnabled = false;

    if (ImageLoad.bgReady) {
        ctx.drawImage(ImageLoad.bgImage, bg.x, bg.y);
    }

    if (ImageLoad.coinReady) {
        coin.render();
    }

    if (ImageLoad.heroReady && ImageLoad.heroAnimateWalkRightReady) {
        if (68 in keysDown) {
            heroAnimateWalkRight.render();
        }
        else if (65 in keysDown) {
            heroAnimateWalkLeft.render();
        }
        else {
            ctx.drawImage(ImageLoad.heroImage, hero.x, hero.y, hero.width, hero.height);
        }
    }

    if (ImageLoad.monsterReady) {
        ctx.drawImage(ImageLoad.monsterImage, monster.x + bg.x, monster.y + bg.y);
    }

    if (hero.magic.created) {
        ctx.fillStyle = 'red';
        ctx.fillRect(hero.magic.x, hero.magic.y, hero.magic.size, hero.magic.size);
    }

    var padding = 32;

    // Font
    ctx.fillStyle = "black";
    ctx.font = `24px "Visitor"`;
    ctx.textAlign = "left";
    ctx.textBaseline = "top";

    // Score
    ctx.fillText("Collect 4 gold to beat the scarecrow.", padding, 20);
    ctx.fillText("Scarecrows defeated: " + hero.monstersCaught, padding, 40);

    // Inventory
    ctx.fillStyle = 'rgba(0,0,0,0.65)';
    var uiWidth = 120;
    var uiHeight = 50;
    var uiPadding = 8;
    ctx.fillRect(uiPadding, canvas.height - uiHeight - uiPadding, uiWidth, uiHeight);
    ctx.fillStyle = 'white';
    ctx.fillText(inventory.gold + " Gold", padding, canvas.height - 48);
};

export default render;
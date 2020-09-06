import { bg, monster, inventory, player, global } from '../render/objects/objects.js';
import { coin, heroAnimateWalkRight, heroAnimateWalkLeft } from '../render/objects/objectsSprites.js';
import { reset } from '../reset.js';
import { keysDown } from '../keysDown.js';
import * as ImageLoad from '../render/imageLoad.js';
import updateMovement from './updateMovement.js';


// Update game objects
var update = function (modifier) {

    // shooting
    if (69 in keysDown) {
        player.shoot();
    }

    global.pMagic.forEach(function (magic) {
        magic.update();
        magic.touchMonster();
    });

    global.pMagic = global.pMagic.filter(function (magic) {
        return magic.active;
    });

    if (global.w_delay > 0) {
        global.w_delay -= player.getCD();
    }

    updateMovement(modifier);

    // touch coin, add to gold amount
    // Use sprite height in place of sprite width
    if (
        player.x + player.width >= coin.x + bg.x
        && player.x <= coin.x + bg.x + coin.height
        && player.y + player.height >= coin.y + bg.y
        && player.y <= coin.y + bg.y + coin.height
    ) {
        ++inventory.gold;

        // Re-render a new coin
        coin.x = (Math.random() * (bg.width - coin.height));
        coin.y = (Math.random() * (bg.height - coin.height));
    }

    coin.update();
    heroAnimateWalkRight.update();
    heroAnimateWalkLeft.update();
}


export default update;
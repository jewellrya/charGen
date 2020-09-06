import { canvas } from './render/canvas.js';
import { player, bg, monster, global } from './render/objects/objects.js';
import { coin } from './render/objects/objectsSprites.js';

// Reset the game when the player catches a monster
export var reset = function () {
    global.pMagic = [];
    bg.x = 0;
    bg.y = 0;
    player.x = (canvas.width / 2) - (player.width / 2);
    player.y = (canvas.height / 2) - (player.height / 2);

    // Throw the monster somewhere on the screen randomly
    monster.x = (Math.random() * (bg.width - monster.width));
    monster.y = (Math.random() * (bg.height - monster.height));

    // Throw the coin somewhere on the screen randomly
    coin.x = (Math.random() * (bg.width - coin.height));
    coin.y = (Math.random() * (bg.height - coin.height));

}

export default reset;
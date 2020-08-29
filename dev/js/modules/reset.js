import { canvas } from './render/canvas.js';
import { bg, hero, monster } from './render/objects/objects.js';
import { coin } from './render/objects/objectsSprites.js';

// Reset the game when the player catches a monster
export var reset = function () {
    bg.x = 0;
    bg.y = 0;
    hero.x = (canvas.width / 2) - (hero.width / 2);
    hero.y = (canvas.height / 2) - (hero.height / 2);

    // Throw the monster somewhere on the screen randomly
    monster.x = (Math.random() * (bg.width - monster.width));
    monster.y = (Math.random() * (bg.height - monster.height));

    // Throw the coin somewhere on the screen randomly
    coin.x = (Math.random() * (bg.width - coin.height));
    coin.y = (Math.random() * (bg.height - coin.height));

    // Magic
    hero.magic.created = false;
}

export default reset;
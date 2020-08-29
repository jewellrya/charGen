import { bg, hero, monster, inventory } from '../render/objects/objects.js';
import { coin, heroAnimateWalkRight, heroAnimateWalkLeft } from '../render/objects/objectsSprites.js';
import { reset } from '../reset.js';
import { keysDown } from '../keysDown.js';
import * as ImageLoad from '../render/imageLoad.js';
import updateMovement from './updateMovement.js';
import updateAttack from './updateAttack.js';

// Update game objects
var update = function (modifier) {

    var friction = 0.02;
    updateMovement(modifier);
    updateAttack(modifier);

    // Touch monster, reset game
    if (
        hero.x + hero.width >= monster.x + bg.x + 35
        && hero.x <= monster.x + bg.x + monster.width - 35
        && hero.y + hero.height >= monster.y + bg.y + 35
        && hero.y <= monster.y + bg.y + monster.height - 35
    ) {
        if (inventory.gold >= 4) {
            ++hero.monstersCaught;
            inventory.gold -= 4;
            reset();
        } else {
            reset();
        }
    }

    // touch coin, add to gold amount
    // Use sprite height in place of sprite width
    if (
        hero.x + hero.width >= coin.x + bg.x
        && hero.x <= coin.x + bg.x + coin.height
        && hero.y + hero.height >= coin.y + bg.y
        && hero.y <= coin.y + bg.y + coin.height
    ) {
        ++inventory.gold;

        // Re-render a new coin
        coin.x = (Math.random() * (bg.width - coin.height));
        coin.y = (Math.random() * (bg.height - coin.height));
    }

    coin.update();
    heroAnimateWalkRight.update();
    heroAnimateWalkLeft.update();

    // Magic Speed
    
    if (69 in keysDown) {
        hero.magic.created = true;
        hero.magic.y = hero.y + (hero.height / 2) - (hero.magic.size / 2)

        if (65 in keysDown || ImageLoad.heroImage.src.includes('Left')) {
            hero.magic.x = hero.x - hero.magic.size;
            if (hero.magic.speed > 0) {
                hero.magic.speed = -hero.magic.speed;
            }
        }
        if (68 in keysDown || ImageLoad.heroImage.src.includes('Right')) {
            hero.magic.x = hero.x + hero.width;
            if (hero.magic.speed < 0) {
                hero.magic.speed = -hero.magic.speed;
            }
        }
    }

    if (hero.magic.created) {
        if (hero.magic.speed > friction) {
            hero.magic.speed -= friction;
        }
        else if (hero.magic.speed < -friction) {
            hero.magic.speed += friction;
        } else {
            hero.magic.created = false;
        }

        hero.magic.x += hero.magic.speed;
    }

    if (hero.magic.x <= bg.x
        || hero.magic.x >= bg.x + bg.width
        || hero.magic.y <= bg.y
        || hero.magic.y >= bg.y + bg.height
    ) {
        hero.magic.created = false;
    }

    // Find out how to reset this without hardcode;
    if (!(hero.magic.created)) {
        hero.magic.speed = 3.5;
    }
}


export default update;
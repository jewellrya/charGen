import { bg, hero } from '../render/objects/objects.js';
import * as ImageLoad from '../render/imageLoad.js';
import { canvas } from '../render/canvas.js';
import { keysDown } from '../keysDown.js';

var updateMovement = function (modifier) {
    // Player holding W
    if (hero.y > (canvas.height / 2) - (hero.height / 2)) {
        if (87 in keysDown) {
            hero.y -= hero.speed * modifier;
        }
    } else if (bg.y < 0) {
        if (87 in keysDown) {
            bg.y += hero.speed * modifier;
            hero.magic.y += hero.speed * modifier;
        }
    } else {
        if (hero.y + (hero.height / 3) > 0) {
            if (87 in keysDown) {
                hero.y -= hero.speed * modifier;
            }
        }
    }

    // Player holding S
    if (hero.y < (canvas.height / 2) - (hero.height / 2)) {
        if (83 in keysDown) {
            hero.y += hero.speed * modifier;
        }
    } else if (bg.y >= -bg.height + canvas.height) {
        if (83 in keysDown) {
            bg.y -= hero.speed * modifier;
            hero.magic.y -= hero.speed * modifier;
        }
    } else {
        if (hero.y + (hero.height / 1.2) < canvas.height) {
            if (83 in keysDown) {
                hero.y += hero.speed * modifier;
            }
        }
    }

    // Player holding A
    if (65 in keysDown) {
        ImageLoad.heroImage.src = '../../assets/male/male1_standLeft.png';
    }
    if (hero.x > (canvas.width / 2) - (hero.width / 2)) {
        if (65 in keysDown) {
            hero.x -= hero.speed * modifier;
        }
    } else if (bg.x < 0) {
        if (65 in keysDown) {
            bg.x += hero.speed * modifier;
            hero.magic.x += hero.speed * modifier;
        }
    } else {
        if (hero.x + (hero.width / 3) > 0) {
            if (65 in keysDown) {
                hero.x -= hero.speed * modifier;
            }
        }
    }

    // Player holding D
    if (68 in keysDown) {
        ImageLoad.heroImage.src = '../../assets/male/male1_standRight.png';
    }
    if (hero.x < (canvas.width / 2) - (hero.width / 2)) {
        if (68 in keysDown) {
            hero.x += hero.speed * modifier;
        }
    } else if (bg.x >= -bg.width + canvas.width) {
        if (68 in keysDown) {
            bg.x -= hero.speed * modifier;
            hero.magic.x -= hero.speed * modifier;
        }
    } else {
        if (hero.x + (hero.width / 1.2) < canvas.width) {
            if (68 in keysDown) {
                hero.x += hero.speed * modifier;
            }
        }
    }
}

export default updateMovement;
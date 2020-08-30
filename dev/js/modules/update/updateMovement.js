import { bg, player, global } from '../render/objects/objects.js';
import * as ImageLoad from '../render/imageLoad.js';
import { canvas } from '../render/canvas.js';
import { keysDown } from '../keysDown.js';

var updateMovement = function (modifier) {
    // Player holding W
    if (player.y > (canvas.height / 2) - (player.height / 2)) {
        if (87 in keysDown) {
            player.y -= player.speed * modifier;
        }
    } else if (bg.y < 0) {
        if (87 in keysDown) {
            bg.y += player.speed * modifier;
            global.pMagic.forEach(function (magic) {
                magic.y += player.speed * modifier;
            });
        }
    } else {
        if (player.y + (player.height / 3) > 0) {
            if (87 in keysDown) {
                player.y -= player.speed * modifier;
            }
        }
    }

    // Player holding S
    if (player.y < (canvas.height / 2) - (player.height / 2)) {
        if (83 in keysDown) {
            player.y += player.speed * modifier;
        }
    } else if (bg.y >= -bg.height + canvas.height) {
        if (83 in keysDown) {
            bg.y -= player.speed * modifier;
            global.pMagic.forEach(function (magic) {
                magic.y -= player.speed * modifier;
            });
        }
    } else {
        if (player.y + (player.height / 1.2) < canvas.height) {
            if (83 in keysDown) {
                player.y += player.speed * modifier;
            }
        }
    }

    // Player holding A
    if (65 in keysDown) {
        ImageLoad.heroImage.src = '../../assets/male/male1_standLeft.png';
    }
    if (player.x > (canvas.width / 2) - (player.width / 2)) {
        if (65 in keysDown) {
            player.x -= player.speed * modifier;
        }
    } else if (bg.x < 0) {
        if (65 in keysDown) {
            bg.x += player.speed * modifier;
            global.pMagic.forEach(function (magic) {
                magic.x += player.speed * modifier;
            });
        }
    } else {
        if (player.x + (player.width / 3) > 0) {
            if (65 in keysDown) {
                player.x -= player.speed * modifier;
            }
        }
    }

    // Player holding D
    if (68 in keysDown) {
        ImageLoad.heroImage.src = '../../assets/male/male1_standRight.png';
    }
    if (player.x < (canvas.width / 2) - (player.width / 2)) {
        if (68 in keysDown) {
            player.x += player.speed * modifier;
        }
    } else if (bg.x >= -bg.width + canvas.width) {
        if (68 in keysDown) {
            bg.x -= player.speed * modifier;
            global.pMagic.forEach(function (magic) {
                magic.x -= player.speed * modifier;
            });
        }
    } else {
        if (player.x + (player.width / 1.2) < canvas.width) {
            if (68 in keysDown) {
                player.x += player.speed * modifier;
            }
        }
    }
}

export default updateMovement;
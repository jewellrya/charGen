import { sprite, playerSprite } from '../sprite.js';
import { canvas } from '../canvas.js';
import * as ImageLoad from '../imageLoad.js';

var coin = sprite({
    x: 0,
    y: 0,
    context: canvas.getContext("2d"),
    width: 300,
    height: 50,
    image: ImageLoad.coinImage,
    numberOfFrames: 6,
    ticksPerFrame: 6
});

var heroAnimateWalkRight = playerSprite({
    x: 0,
    y: 0,
    context: canvas.getContext("2d"),
    width: 170,
    height: 40,
    image: ImageLoad.heroAnimateWalkRightImage,
    numberOfFrames: 10,
    ticksPerFrame: 6
});

var heroAnimateWalkLeft = playerSprite({
    x: 0,
    y: 0,
    context: canvas.getContext("2d"),
    width: 170,
    height: 40,
    image: ImageLoad.heroAnimateWalkLeftImage,
    numberOfFrames: 10,
    ticksPerFrame: 6
});

export {
    coin,
    heroAnimateWalkRight,
    heroAnimateWalkLeft
}
// Background image
var bgReady = false;
var bgImage = new Image();
bgImage.onload = function () {
    bgReady = true;
};
bgImage.src = "../../assets/environment.png";

// Hero image
var heroReady = false;
var heroImage = new Image();
heroImage.onload = function () {
    heroReady = true;
};
heroImage.src = "../../assets/male/male1_standRight.png";

// Monster image
var monsterReady = false;
var monsterImage = new Image();
monsterImage.onload = function () {
    monsterReady = true;
};
monsterImage.src = "../../assets/scarecrow.png";

// Coin image
var coinReady = false;
var coinImage = new Image();
coinImage.onload = function () {
    coinReady = true;
}
coinImage.src = "../../assets/coin_ss.png"

// heroAnimateWalkRight
var heroAnimateWalkRightReady = false;
var heroAnimateWalkRightImage = new Image();
heroAnimateWalkRightImage.onload = function () {
    heroAnimateWalkRightReady = true;
}
heroAnimateWalkRightImage.src = "../../assets/male/male1_walkRight_ss.png";

// heroAnimateWalkLeft
var heroAnimateWalkLeftReady = false;
var heroAnimateWalkLeftImage = new Image();
heroAnimateWalkLeftImage.onload = function () {
    heroAnimateWalkLeftReady = true;
}
heroAnimateWalkLeftImage.src = "../../assets/male/male1_walkLeft_ss.png";

export {
    bgReady,
    bgImage,
    heroReady,
    heroImage,
    monsterReady,
    monsterImage,
    coinReady,
    coinImage,
    heroAnimateWalkRightReady,
    heroAnimateWalkRightImage,
    heroAnimateWalkLeftReady,
    heroAnimateWalkLeftImage
};
// Game objects
var bg = {
    x: 0,
    y: 0,
    width: 1014,
    height: 615
}

var hero = {
    x: 0,
    y: 0,
    speed: 150, // movement in pixels per second
    width: 51,
    height: 120,
    monstersCaught: 0,
    magic: {
        x: 0,
        y: 0,
        speed: 3.5,
        power: 1,
        size: 10,
        created: false,
    }
};

var monster = {
    x: 0,
    y: 0,
    width: 152,
    height: 146
};

var inventory = {
    gold: 0
}

export {
    bg,
    hero,
    monster,
    inventory
}
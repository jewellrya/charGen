let canvas = document.getElementById("canvas");
let ctx = canvas.getContext('2d');

ctx.scale(12, 12);
ctx.imageSmoothingEnabled = false;

var xOffset = 7;
var yOffset = 5;

var images_humanMale = [
	{name: 'humanMale1', src: '../../assets/Human\ Male1.png', x: xOffset, y: yOffset}, 
	{name: 'humanMale2', src: '../../assets/Human\ Male2.png', x: xOffset, y: yOffset},
	{name: 'humanMale3', src: '../../assets/Human\ Male3.png', x: xOffset, y: yOffset}, 
];
var images_humanMaleHair = [
	{name: 'humanMaleHair1', src: '../../assets/Human\ Male\ Hair1.png', x: xOffset+3, y: yOffset},
	{name: 'humanMaleHair2', src: '../../assets/Human\ Male\ Hair2.png', x: xOffset+3, y: yOffset}, 
];
var images_humanMaleBeard = [
	{name: 'humanMaleBeard1', src: '../../assets/Human\ Male\ Beard1.png', x: xOffset+3, y: yOffset+4}, 
	{name: 'humanMaleBeard2', src: '../../assets/Human\ Male\ Beard2.png', x: xOffset+5, y: yOffset+7}, 
];
var images_humanMaleAdornment = [
	{name: 'humanMaleAdornment1', src: '../../assets/Human\ Male\ Adornment1.png', x: xOffset+1, y: yOffset+1}, 
];
var images_humanMaleTattoo = [
	{name: 'humanMaleTattoo1', src: '../../assets/Human\ Male\ Tattoo1.png', x: xOffset, y: yOffset+14},
];

var images_humanMaleHeavy = [
	{name: 'humanMaleHeavy1', src: '../../assets/Human\ Male\ Heavy1.png', x: xOffset-1, y: yOffset},
	{name: 'humanMaleHeavy2', src: '../../assets/Human\ Male\ Heavy2.png', x: xOffset-4, y: yOffset},
];

preload = function(imageArray, callback){
	var imagesLoaded = 0;
	var loadedImages = [];

	for (var i = 0; i < imageArray.length; i++) {
		var imgObj = new Image();

		imgObj.src = imageArray[i].src;
		loadedImages.push(imgObj);

		imgObj.onload = function() {
			imagesLoaded++
			if(imagesLoaded === imageArray.length) {
				callback(loadedImages);
			}
		};
	}
}

function drawChar(imageArray) {
	preload(imageArray, function(loadedImages){

		for (var i = 0; i < imageArray.length; i++) {
			ctx.drawImage(loadedImages[i], imageArray[i].x, imageArray[i].y);
		}

		var img = canvas.toDataURL("image/png");
		document.write('<img src="'+img+'"/><a href="'+img+'" download="derp">export png</a>');

		ctx.clearRect(0, 0, canvas.width, canvas.height);
		
	});
}

var genChar;
for(var i = 0; i < images_humanMale.length; i++) {
     for(var j = 0; j < images_humanMaleHair.length; j++) {
		for(var k = 0; k < images_humanMaleBeard.length; k++) {
			for(var l = 0; l < images_humanMaleAdornment.length; l++) {
				for(var m = 0; m < images_humanMaleTattoo.length; m++) {
					for(var n = 0; n < images_humanMaleHeavy.length; n++) {

						genChar = [images_humanMale[i], images_humanMaleHair[j], images_humanMaleBeard[k], images_humanMaleAdornment[l], images_humanMaleTattoo[m], images_humanMaleHeavy[n]];
						drawChar(genChar);
						console.log(genChar);
					}
				}
			}
		}
    }
}
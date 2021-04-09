let canvas = document.getElementById("canvas");
let ctx = canvas.getContext('2d');

ctx.scale(12, 12);
ctx.imageSmoothingEnabled = false;

var xOffset = 7;
var yOffset = 5;

var humanMale = [
	[
		{name: 'humanMale1', src: '../../assets/Human\ Male1.png', x: xOffset, y: yOffset}, 
		{name: 'humanMale2', src: '../../assets/Human\ Male2.png', x: xOffset, y: yOffset},
		{name: 'humanMale3', src: '../../assets/Human\ Male3.png', x: xOffset, y: yOffset},
	],
	[
		{name: 'humanMaleHair_blank', src: '../../assets/_blank.png', x: 0, y: 0},
		{name: 'humanMaleHair1', src: '../../assets/Human\ Male\ Hair1.png', x: xOffset+3, y: yOffset},
		{name: 'humanMaleHair2', src: '../../assets/Human\ Male\ Hair2.png', x: xOffset+3, y: yOffset},
	],
	[
		{name: 'humanMaleBeard_blank', src: '../../assets/_blank.png', x: 0, y: 0},
		{name: 'humanMaleBeard1', src: '../../assets/Human\ Male\ Beard1.png', x: xOffset+3, y: yOffset+4}, 
		{name: 'humanMaleBeard2', src: '../../assets/Human\ Male\ Beard2.png', x: xOffset+5, y: yOffset+7}, 
	],
	[
		{name: 'humanMaleAdornment_blank', src: '../../assets/_blank.png', x: 0, y: 0},
		{name: 'humanMaleAdornment1', src: '../../assets/Human\ Male\ Adornment1.png', x: xOffset+1, y: yOffset+1},
	],
	[
		{name: 'humanMaleTattoo_blank', src: '../../assets/_blank.png', x: 0, y: 0},
		{name: 'humanMaleTattoo1', src: '../../assets/Human\ Male\ Tattoo1.png', x: xOffset, y: yOffset+14},
	],
	[
		{name: 'humanMaleArmor_blank', src: '../../assets/_blank.png', x: 0, y: 0},
		{name: 'humanMaleHeavy1', src: '../../assets/Human\ Male\ Heavy1.png', x: xOffset-4, y: yOffset+1},
		{name: 'humanMaleHeavy2', src: '../../assets/Human\ Male\ Heavy2.png', x: xOffset-1, y: yOffset+8},
	],
]

preload = function(imageArray, callback) {

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

function drawChar(imageArray, name) {
	preload(imageArray, function(loadedImages){

		for (var i = 0; i < imageArray.length; i++) {
			ctx.drawImage(loadedImages[i], imageArray[i].x, imageArray[i].y);
		}

		var img = canvas.toDataURL("image/png");
		var charGenComponent = '<div id="' + name + '" class="col-12 col-md-6 col-lg-3"><div class="d-flex flex-column"><img src="' + img + '"/><a class="text-center text-truncate" href="' + img + '" download="' + name + '">Export \"' + name + '\"</a></div></div>';
		document.getElementById('charGen').innerHTML += charGenComponent;

		ctx.clearRect(0, 0, canvas.width, canvas.height);
		
	});
}

//- Exclusions from the normal permutation.
for(var i = 0; i < humanMale[0].length; i++) {
	for(var j = 0; j < humanMale[5].length; j++) {
		for(var k = 0; k < humanMale[1].length; k++) {
			for(var l = 0; l < humanMale[2].length; l++) {

				var genChar = [];

				genChar.push(humanMale[0][i]);
				genChar.push(humanMale[5][j]);
				genChar.push(humanMale[1][k]);
				genChar.push(humanMale[2][l]);

				drawChar(genChar, 'humanMale' + (i + 1) + j + k + l);
			}
		}
	}
}

//- Permutation for all skin tones.
for(var i = 0; i < humanMale[0].length; i++) {
     for(var j = 0; j < humanMale[1].length; j++) {
		for(var k = 0; k < humanMale[2].length; k++) {
			for(var l = 0; l < humanMale[3].length; l++) {
				for(var m = 0; m < humanMale[4].length; m++) {
						
					var genChar = [];

					genChar.push(humanMale[0][i]);
					genChar.push(humanMale[1][j]);
					genChar.push(humanMale[2][k]);
					genChar.push(humanMale[3][l]);
					genChar.push(humanMale[4][m]);

					drawChar(genChar, 'humanMale' + (i + 1) + j + k + l + m);
				}
			}
		}
    }
}
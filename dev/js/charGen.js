let canvas = document.getElementById("canvas");
let ctx = canvas.getContext('2d');

ctx.scale(10, 10);
ctx.imageSmoothingEnabled = false;

var xOffset = 10;
var yOffset = 12;

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
		{name: 'humanMaleHeavy1', src: '../../assets/Human\ Male\ Heavy1.png', x: xOffset-4, y: yOffset+1},
		{name: 'humanMaleHeavy2', src: '../../assets/Human\ Male\ Heavy2.png', x: xOffset-1, y: yOffset+8},
	],
]

var humanFemale = [
	[
		{name: 'humanFemale1', src: '../../assets/Human\ Female1.png', x: xOffset, y: yOffset+1},
		{name: 'humanFemale2', src: '../../assets/Human\ Female2.png', x: xOffset, y: yOffset+1},
		{name: 'humanFemale3', src: '../../assets/Human\ Female3.png', x: xOffset, y: yOffset+1},
	],
	[
		{name: 'humanFemaleHair_blank', src: '../../assets/_blank.png', x: 0, y: 0},
		{name: 'humanFemaleHair1', src: '../../assets/Human\ Female\ Hair1.png', x: xOffset, y: yOffset+1},
		{name: 'humanFemaleHair2', src: '../../assets/Human\ Female\ Hair2.png', x: xOffset+1, y: yOffset+1},
	],
	[
		{name: 'humanFemaleBeard_blank', src: '../../assets/_blank.png', x: 0, y: 0},
	],
	[
		{name: 'humanFemaleAdornment_blank', src: '../../assets/_blank.png', x: 0, y: 0},
		{name: 'humanFemaleAdornment1', src: '../../assets/Human\ Female\ Adornment1.png', x: xOffset+3, y: yOffset+5},
	],
	[
		{name: 'humanFemaleTattoo_blank', src: '../../assets/_blank.png', x: 0, y: 0},
		{name: 'humanFemaleTattoo1', src: '../../assets/Human\ Female\ Tattoo1.png', x: xOffset, y: yOffset+12},
	],
	[
		{name: 'humanFemaleArmor_blank', src: '../../assets/_blank.png', x: 0, y: 0},
	],
]

var halforcMale = [
	[
		{name: 'halforcMale1', src: '../../assets/Halforc\ Male1.png', x: xOffset-1, y: yOffset-3}, 
		{name: 'halforcMale2', src: '../../assets/Halforc\ Male2.png', x: xOffset-1, y: yOffset-3},
		{name: 'halforcMale3', src: '../../assets/Halforc\ Male3.png', x: xOffset-1, y: yOffset-3},
	],
	[
		{name: 'halforcMaleHair_blank', src: '../../assets/_blank.png', x: 0, y: 0},
		{name: 'halforcMaleHair1', src: '../../assets/Halforc\ Male\ Hair1.png', x: xOffset+2, y: yOffset-3},
		{name: 'halforcMaleHair2', src: '../../assets/Halforc\ Male\ Hair2.png', x: xOffset+3, y: yOffset-3},
	],
	[
		{name: 'halforcMaleBeard_blank', src: '../../assets/_blank.png', x: 0, y: 0},
		{name: 'halforcMaleBeard1', src: '../../assets/Halforc\ Male\ Beard1.png', x: xOffset+5, y: yOffset+2}, 
		{name: 'halforcMaleBeard2', src: '../../assets/Halforc\ Male\ Beard2.png', x: xOffset+6, y: yOffset+4}, 
	],
	[
		{name: 'halforcMaleAdornment_blank', src: '../../assets/_blank.png', x: 0, y: 0},
		{name: 'halforcMaleAdornment1', src: '../../assets/Halforc\ Male\ Adornment1.png', x: xOffset+4, y: yOffset+4},
	],
	[
		{name: 'halforcMaleTattoo_blank', src: '../../assets/_blank.png', x: 0, y: 0},
		{name: 'halforcMaleTattoo1', src: '../../assets/Halforc\ Male\ Tattoo1.png', x: xOffset-1, y: yOffset+8},
		{name: 'halforcMaleTattoo2', src: '../../assets/Halforc\ Male\ Tattoo2.png', x: xOffset+4, y: yOffset},
		{name: 'halforcMaleTattoo3', src: '../../assets/Halforc\ Male\ Tattoo3.png', x: xOffset+4, y: yOffset+8},
	],
	[
		{name: 'halforcMaleArmor_blank', src: '../../assets/_blank.png', x: 0, y: 0},
	],
]

var halforcFemale = [
	[
		{name: 'halforcFemale1', src: '../../assets/Halforc\ Female1.png', x: xOffset, y: yOffset-2},
		{name: 'halforcFemale2', src: '../../assets/Halforc\ Female2.png', x: xOffset, y: yOffset-2},
		{name: 'halforcFemale3', src: '../../assets/Halforc\ Female3.png', x: xOffset, y: yOffset-2},
	],
	[
		{name: 'halforcFemaleHair_blank', src: '../../assets/_blank.png', x: 0, y: 0},
		{name: 'halforcFemaleHair1', src: '../../assets/Halforc\ Female\ Hair1.png', x: xOffset+1, y: yOffset-2},
		{name: 'halforcFemaleHair2', src: '../../assets/Halforc\ Female\ Hair2.png', x: xOffset, y: yOffset-4},
	],
	[
		{name: 'halforcFemaleBeard_blank', src: '../../assets/_blank.png', x: 0, y: 0},
	],
	[
		{name: 'halforcFemaleAdornment_blank', src: '../../assets/_blank.png', x: 0, y: 0},
		{name: 'halforcFemaleAdornment1', src: '../../assets/Halforc\ Female\ Adornment1.png', x: xOffset+3, y: yOffset+3},
	],
	[
		{name: 'halforcFemaleTattoo_blank', src: '../../assets/_blank.png', x: 0, y: 0},
		{name: 'halforcFemaleTattoo1', src: '../../assets/Halforc\ Female\ Tattoo1.png', x: xOffset+3, y: yOffset+28},
		{name: 'halforcFemaleTattoo2', src: '../../assets/Halforc\ Female\ Tattoo2.png', x: xOffset+10, y: yOffset+14},
		{name: 'halforcFemaleTattoo3', src: '../../assets/Halforc\ Female\ Tattoo3.png', x: xOffset+5, y: yOffset},
	],
	[
		{name: 'halforcFemaleArmor_blank', src: '../../assets/_blank.png', x: 0, y: 0},
	],
]

var dwarfMale = [
	[
		{name: 'dwarfMale1', src: '../../assets/Dwarf\ Male1.png', x: xOffset-1, y: yOffset+4}, 
		{name: 'dwarfMale2', src: '../../assets/Dwarf\ Male2.png', x: xOffset-1, y: yOffset+4},
		{name: 'dwarfMale3', src: '../../assets/Dwarf\ Male3.png', x: xOffset-1, y: yOffset+4},
	],
	[
		{name: 'dwarfMaleHair_blank', src: '../../assets/_blank.png', x: 0, y: 0},
		{name: 'dwarfMaleHair1', src: '../../assets/Dwarf\ Male\ Hair1.png', x: xOffset+1, y: yOffset+4},
		{name: 'dwarfMaleHair2', src: '../../assets/Dwarf\ Male\ Hair2.png', x: xOffset+1, y: yOffset+3},
		{name: 'dwarfMaleHair3', src: '../../assets/Dwarf\ Male\ Hair3.png', x: xOffset+2, y: yOffset+4},
	],
	[
		{name: 'dwarfMaleBeard_blank', src: '../../assets/_blank.png', x: 0, y: 0},
		{name: 'dwarfMaleBeard1', src: '../../assets/Dwarf\ Male\ Beard1.png', x: xOffset+3, y: yOffset+9}, 
		{name: 'dwarfMaleBeard2', src: '../../assets/Dwarf\ Male\ Beard2.png', x: xOffset+3, y: yOffset+9}, 
		{name: 'dwarfMaleBeard3', src: '../../assets/Dwarf\ Male\ Beard3.png', x: xOffset+4, y: yOffset+8},
	],
	[
		{name: 'dwarfMaleAdornment_blank', src: '../../assets/_blank.png', x: 0, y: 0},
	],
	[
		{name: 'dwarfMaleTattoo_blank', src: '../../assets/_blank.png', x: 0, y: 0},
	],
	[
		{name: 'dwarfMaleArmor_blank', src: '../../assets/_blank.png', x: 0, y: 0},
	],
]

var dwarfFemale = [
	[
		{name: 'dwarfFemale1', src: '../../assets/Dwarf\ Female1.png', x: xOffset-1, y: yOffset+5},
		{name: 'dwarfFemale2', src: '../../assets/Dwarf\ Female2.png', x: xOffset-1, y: yOffset+5},
		{name: 'dwarfFemale3', src: '../../assets/Dwarf\ Female3.png', x: xOffset-1, y: yOffset+5},
	],
	[
		{name: 'dwarfFemaleHair_blank', src: '../../assets/_blank.png', x: 0, y: 0},
		{name: 'dwarfFemaleHair1', src: '../../assets/Dwarf\ Female\ Hair1.png', x: xOffset+1, y: yOffset+4},
		{name: 'dwarfFemaleHair2', src: '../../assets/Dwarf\ Female\ Hair2.png', x: xOffset+1, y: yOffset+4},
		{name: 'dwarfFemaleHair3', src: '../../assets/Dwarf\ Female\ Hair3.png', x: xOffset-1, y: yOffset+2},
	],
	[
		{name: 'dwarfFemaleBeard_blank', src: '../../assets/_blank.png', x: 0, y: 0},
	],
	[
		{name: 'dwarfFemaleAdornment_blank', src: '../../assets/_blank.png', x: 0, y: 0},
		{name: 'dwarfFemaleAdornment1', src: '../../assets/Dwarf\ Female\ Adornment1.png', x: xOffset+1, y: yOffset+9},
	],
	[
		{name: 'dwarfFemaleTattoo_blank', src: '../../assets/_blank.png', x: 0, y: 0},
	],
	[
		{name: 'dwarfFemaleArmor_blank', src: '../../assets/_blank.png', x: 0, y: 0},
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

function drawChar(imageArray, name, replace) {
	preload(imageArray, function(loadedImages){

		for (var i = 0; i < imageArray.length; i++) {
			ctx.drawImage(loadedImages[i], imageArray[i].x, imageArray[i].y);
		}

		// function invertColors(data) {
		// 	for (var i = 0; i < data.length; i+= 4) {
		// 	  data[i] = data[i] ^ 255; // Invert Red
		// 	  data[i+1] = data[i+1] ^ 255; // Invert Green
		// 	  data[i+2] = data[i+2] ^ 255; // Invert Blue
		// 	}
		//   }

		// var imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
		// invertColors(imageData.data);
		// ctx.putImageData(imageData, 0, 0);

		var img = canvas.toDataURL("image/png");
		var charGenComponent = '<div id="component_' + name + '" class="col-12 col-md-6 col-lg-4"><div class="d-flex flex-column"><img id="img_' + name + '" src="' + img + '"/><a class="text-center text-truncate" href="' + img + '" download="' + name + '">Export \"' + name + '\"</a></div></div>';
		if(!replace) {
			document.getElementById('charGen').innerHTML += charGenComponent;
		} else {
			document.getElementById('charGen').innerHTML = charGenComponent;
		}

		ctx.clearRect(0, 0, canvas.width, canvas.height);
		
	});
}

let drawAmount = 0;

// Generate all possible permutations of characters.
function permute() {
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

					drawChar(genChar, 'humanMale' + i + k + l + 0 + 0 + j);

					drawAmount++;
					document.getElementById("drawAmount").innerHTML = drawAmount + ' results.';
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

						drawChar(genChar, 'humanMale' + i + j + k + l + m + 0);
					}
				}
			}
		}
	}
}

var raceTemplates = [
	[
		humanMale,
		humanFemale
	],
	[
		halforcMale,
		halforcFemale
	],
	[
		dwarfMale,
		dwarfFemale
	],
]

var createdCharacter = [
	{
		humanMale: {skin: 2, hair: 0, beard: 1, adornment: 0, tattoo: 0},
		humanFemale: {skin: 2, hair: 2, beard: 0, adornment: 1, tattoo: 1},
	},
	{
		halforcMale: {skin: 1, hair: 2, beard: 2, adornment: 0, tattoo: 1},
		halforcFemale: {skin: 0, hair: 1, beard: 0, adornment: 1, tattoo: 1},
	},
	{
		dwarfMale: {skin: 1, hair: 2, beard: 2, adornment: 0, tattoo: 0},
		dwarfFemale: {skin: 0, hair: 2, beard: 0, adornment: 0, tattoo: 0},
	},
]

function popRaceName(raceTemplateName) {
	var raceName;

	if ( raceTemplateName.includes('halforc') ) {
		raceName = 'Half Orc';
	}

	else if ( raceTemplateName.includes('Female') ) {
		raceName = raceTemplateName.split('Female')[0];
	}

	else if ( raceTemplateName.includes('Male') ) {
		raceName = raceTemplateName.split('Male')[0];
	}
	
	document.getElementById('selectedRace').innerHTML = raceName;
}

var raceIndex, raceTemplateGenders, raceTemplateIndex, raceTemplateName, raceTemplate;

// Select Character Features Randomly
function randomChar() {
	var genChar = [];
	var genName = [];
	var genIndex = [];

	function getRandomInt(max) {
		return Math.floor(Math.random() * max);
	}
	
	raceIndex = getRandomInt(createdCharacter.length);
	raceTemplateIndex = getRandomInt(Object.keys(createdCharacter[raceIndex]).length);
	raceTemplateName = Object.keys(createdCharacter[raceIndex])[raceTemplateIndex];
	raceTemplate = raceTemplates[raceIndex][raceTemplateIndex];
	popRaceName(raceTemplateName);

	function getRandom(array) {
		var randomInt = getRandomInt(array.length)
		genChar.push(array[randomInt]);
		var randomIntString = randomInt.toString();
		genName += randomIntString;
		genIndex.push(randomInt);
	}

	for(var i = 0; i < raceTemplate.length - 1; i++) {
		getRandom(raceTemplate[i]);
	}

	var createdCharacterObject = createdCharacter[raceIndex][raceTemplateName];

	for(var i = 0; i < Object.keys(createdCharacterObject).length; i++) {
		var prop = Object.keys(createdCharacterObject)[i];
		createdCharacterObject[prop] = genIndex[i];
	}

	genName = raceTemplateIndex.toString() + raceIndex.toString() + genName;

	drawChar(genChar, genName + 0, true);
}

randomChar();

// Select Character Features
function create(raceTemplate) {
	var genChar = [];
	var genName = [];
	var createdCharacterObject = createdCharacter[raceIndex][raceTemplateName];

	for(var i = 0; i < Object.keys(createdCharacterObject).length; i++) {
		var prop = Object.keys(createdCharacterObject)[i];
		genChar.push(raceTemplate[i][createdCharacterObject[prop]]);
		genName = genName + createdCharacterObject[prop];
	}

	genName = raceTemplateIndex.toString() + raceIndex.toString() + genName;

	drawChar(genChar, genName + 0, true);
};

function selectChar(feature, scale) {

	var array = createdCharacter[raceIndex][raceTemplateName];

	function changeProp() {
		var index = Object.keys(array).indexOf(feature);
	
		if( scale === 'increase' ) {

			if( array[feature] < raceTemplate[index].length - 1 ) {
				
				array[feature]++;
				create(raceTemplate);
			} else {

				array[feature] = 0;
				create(raceTemplate);
			}
		}

		else if( scale === 'decrease' ) {
			if( array[feature] === 0 ) {

				array[feature] = raceTemplate[index].length - 1;
				create(raceTemplate);
			} else {

				array[feature]--;
				create(raceTemplate);
			}
		}
	}

	changeProp();
}

function selectGender(gender) {

	function changeGender() {
		raceTemplateName = Object.keys(createdCharacter[raceIndex])[raceTemplateIndex];
		raceTemplate = raceTemplates[raceIndex][raceTemplateIndex];
		create(raceTemplate);
	}

	if( gender === 'male' ) {
		if( raceTemplateIndex > 0 ) {

			raceTemplateIndex--;
			changeGender();
		}
	}
	if( gender === 'female' ) {

		if( raceTemplateIndex < Object.keys(raceTemplates[raceIndex]).length - 1 ) {

			raceTemplateIndex++;
			changeGender();
		}
	}
}

function selectRace(scale) {

	function changeRace() {
		raceTemplateName = Object.keys(createdCharacter[raceIndex])[raceTemplateIndex];
		raceTemplate = raceTemplates[raceIndex][raceTemplateIndex];
		create(raceTemplate);
		popRaceName(raceTemplateName);
	}

	if( scale === 'increase' ) {
		if( raceIndex < raceTemplates.length - 1 ) {
			raceIndex++;
			changeRace();
		}
		else {
			raceIndex = 0;
			changeRace();
		}
	}

	if( scale === 'decrease' ) {
		if( raceIndex > 0 ) {
			raceIndex--;
			changeRace();
		}
		else {
			raceIndex = raceTemplates.length - 1;
			changeRace();
		}
	}
}
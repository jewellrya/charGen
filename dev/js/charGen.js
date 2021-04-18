let canvas = document.getElementById("canvas");
let ctx = canvas.getContext('2d');

ctx.scale(10, 10);
ctx.imageSmoothingEnabled = false;

var humanMaleMap = {
	skin: [
		[0,0], [0,0], [0,0]
	],
	hair: [
		[3,0], [3,0]
	],
	beard: [
		[3,4], [5,7]
	],
	adornment: [
		[1,1]
	],
	tattoo: [
		[0,14], [0,12]
	],
	armor: [
		[-4,1], [-1,8]
	],
}

var humanFemaleMap = {
	skin: [
		[0,1], [0,1], [0,1]
	],
	hair: [
		[0,1], [1,1], [0,-2]
	],
	beard: [
	],
	adornment: [
		[3,5]
	],
	tattoo: [
		[0,12], [0,14]
	],
	armor: [
	],
}

var halforcMaleMap = {
	skin: [
		[-1,-3], [-1,-3], [-1,-3]
	],
	hair: [
		[2,-3], [3,-3]
	],
	beard: [
		[5,2], [6,4]
	],
	adornment: [
	],
	tattoo: [
		[-1,8], [4,0], [-1,8]
	],
	armor: [
	],
}

var halforcFemaleMap = {
	skin: [
		[0,-2], [0,-2], [0,-2]
	],
	hair: [
		[1,-2], [0,-4]
	],
	beard: [
	],
	adornment: [
		[3,3]
	],
	tattoo: [
		[3,28], [0,14], [4,1]
	],
	armor: [
	],
}

var dwarfMaleMap = {
	skin: [
		[-1,4], [-1,4], [-1,4],
	],
	hair: [
		[1,4], [1,3], [2,4]
	],
	beard: [
		[3,9], [3,9], [4,8]
	],
	adornment: [
		[3,7]
	],
	tattoo: [
		[-1,16], [-1,14], [-1,14]
	],
	armor: [
	],
}

var dwarfFemaleMap = {
	skin: [
		[-1,5], [-1,5], [-1,5],
	],
	hair: [
		[1,4], [1,4], [-1,2]
	],
	beard: [
	],
	adornment: [
		[4,12], [2,10], [8,7]
	],
	tattoo: [
		[-1,17], [-1,15], [-1,15]
	],
	armor: [
	],
}

var xOffset = 10;
var yOffset = 12;

function createRaceTemplate(race, gender, map) {
	var genTemplate = [];

	for( var i = 0; i < Object.keys(map).length; i++ ) {
		var propArray = [];
		var prop = Object.keys(map)[i];
		var propCap = prop.charAt(0).toUpperCase() + prop.slice(1);
		var raceCap = race.charAt(0).toUpperCase() + race.slice(1);
		var genderCap = gender.charAt(0).toUpperCase() + gender.slice(1);
		
		for( var j = 0; j < map[prop].length; j++) {
			var propArrayObject;
			var index = (j + 1).toString();

			if ( i === 0 ) {
				propArrayObject = {
					name: race + genderCap + index,
					src: '../../assets/' + raceCap + ' ' + genderCap + index + '.png',
					x: xOffset + (map[prop][j][0]),
					y: yOffset + (map[prop][j][1]),
				}
			}
			else if ( i > 0 ) {

				propArrayObject = {
					name: race + genderCap + propCap + index,
					src: '../../assets/' + raceCap + ' ' + genderCap + ' ' + propCap + index + '.png',
					x: xOffset + (map[prop][j][0]),
					y: yOffset + (map[prop][j][1]),
				}
			}

			propArray.push(propArrayObject);
		}

		genTemplate.push(propArray);
	}

	for( var i = 0; i < Object.keys(map).length; i++ ) {
		var prop = Object.keys(map)[i];
		var propCap = prop.charAt(0).toUpperCase() + prop.slice(1);
		var genderCap = gender.charAt(0).toUpperCase() + gender.slice(1);

		if (i > 0) {
			genTemplate[i].unshift({
				name: race + genderCap + propCap + '_blank',
				src: '../../assets/_blank.png',
				x: 0,
				y: 0
			})
		}
	}

	return genTemplate;
}

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

var hairColorIndex;
var hairColors = {
	black1: ['#4b4d59', '#25262c'],
	black2: ['#4a4839', '#25251b'],
	brown1: ['#51403a', '#362b27'],
	brown2: ['#5f4148', '#4e373d'],
	brown3: ['#7a6966', '#574845'],
	brown4: ['#a0815c', '#7e6648'],
	yellow1: ['#b9a088', '#a58f79'],
	yellow2: ['#dbc6ad', '#c7b39d'],
	yellow3: ['#f6dec2', '#dfc9b0'],
	red1: ['#9e6246', '#84523a'],
	red2: ['#ab4438', '#8f392e'],
	gray1: ['#8a8a8a', '#787878'],
	gray2: ['#c5c5c5', '#a6a6a6'],
	white1: ['#e4e4e4', '#d2d2d2']
}

var tattooColorIndex;
var tattooColors = {
	red1: '#8a4646',
	green1: '#3c8f46',
	blue1: '#4164ab',
}

function genColorSwatches(colorObject, subject) {
	var primaryColor, colorName, createdColorValue;

	var subjectCap = subject.charAt(0).toUpperCase() + subject.slice(1);
	document.getElementById(subject + 'ColorSwatches').innerHTML = '';
	
	function setPrimaryColor() {
		if ( Array.isArray(colorObject[colorName])) {
			primaryColor = colorObject[colorName][0];
			createdColorValue = createdColor[raceIndex][raceTemplateName][subject][0];

		} else {
			primaryColor = colorObject[colorName];
			createdColorValue = createdColor[raceIndex][raceTemplateName][subject];
		}
	}

	for( var i = 0; i < Object.keys(colorObject).length; i++ ) {
		colorName = Object.keys(colorObject)[i];
		setPrimaryColor();
		
		var inputName = 'radio' + subjectCap + 'Color';

		var colorSwatchComponent = '<div class="col-auto"><input class="btn-check shadow-none" id="' + inputName + i.toString() + '" type="radio" name="' + inputName + '" autocomplete="off"><label onclick=select' + subjectCap + 'Color(\"' + colorName + '\") class="btn swatch shadow-none" style="background-color: ' + primaryColor + '" for="' + inputName + i.toString() + '"></label></div>'
		document.getElementById(subject + 'ColorSwatches').innerHTML += colorSwatchComponent;
	}

	for( var i = 0; i < Object.keys(colorObject).length; i++ ) {
		var colorName = Object.keys(colorObject)[i];
		setPrimaryColor();

		if( primaryColor === createdColorValue ) {
			console.log('selected ' + subject + primaryColor + ' true');
			var selectedColorRadio = document.getElementById(inputName + i);
			selectedColorRadio.checked = true;
		}
	}
}

function hexToRgb(hex){
    var c;
    if(/^#([A-Fa-f0-9]{3}){1,2}$/.test(hex)){
        c= hex.substring(1).split('');
        if(c.length== 3){
            c= [c[0], c[0], c[1], c[1], c[2], c[2]];
        }
        c= '0x'+c.join('');
        return [(c>>16)&255, (c>>8)&255, c&255];
    }
    throw new Error('Bad Hex: ' + hex);
}

function replaceColor(data, colorFind, colorReplace) {

	var rgbFind = hexToRgb(colorFind);
	var rgbReplace = hexToRgb(colorReplace);

	for (let i = 0; i < data.length; i += 4) { // red, green, blue, and alpha
        var r = data[i + 0];
        var g = data[i + 1];
        var b = data[i + 2];
        var a = data[i + 3];
		
        if (r === rgbFind[0] && g === rgbFind[1] && b === rgbFind[2] && a === 255) {
			data[i + 0] = rgbReplace[0];
            data[i + 1] = rgbReplace[1];
            data[i + 2] = rgbReplace[2];
        }
    }
}

function applyHairColor(data) {
	var colorArray = createdColor[raceIndex][raceTemplateName].hair;

	replaceColor(data, '#8a8a8a', colorArray[0]);
	replaceColor(data, '#787878', colorArray[1]);
}

function applyTattooColor(data) {
	var color = createdColor[raceIndex][raceTemplateName].tattoo;

	replaceColor(data, '#8a4646', color);
}

function drawChar(imageArray, name, replace) {
	preload(imageArray, function(loadedImages){

		for (var i = 0; i < imageArray.length; i++) {
			ctx.drawImage(loadedImages[i], imageArray[i].x, imageArray[i].y);

			var imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
			applyHairColor(imageData.data);
			applyTattooColor(imageData.data);
			ctx.putImageData(imageData, 0, 0);
		}

		for (var i = 0; i < imageArray.length; i++) {
			if( loadedImages[i].src.includes('Hair') || 
				loadedImages[i].src.includes('Beard' ) ) {
			}
		}

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
		humanMale = createRaceTemplate('human', 'male', humanMaleMap),
		humanFemale = createRaceTemplate('human', 'female', humanFemaleMap)
	],
	[
		halforcMale = createRaceTemplate('halforc', 'male', halforcMaleMap),
		halforcFemale = createRaceTemplate('halforc', 'female', halforcFemaleMap)
	],
	[
		dwarfMale = createRaceTemplate('dwarf', 'male', dwarfMaleMap),
		dwarfFemale = createRaceTemplate('dwarf', 'female', dwarfFemaleMap)
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

var createdColor = [
	{
		humanMale: {hair: hairColors.yellow1, tattoo: tattooColors.green1},
		humanFemale: {hair: hairColors.black1, tattoo: tattooColors.green1},
	},
	{
		halforcMale: {hair: hairColors.brown1, tattoo: tattooColors.red1},
		halforcFemale: {hair: hairColors.black2, tattoo: tattooColors.red1},
	},
	{
		dwarfMale: {hair: hairColors.gray2, tattoo: tattooColors.blue1},
		dwarfFemale: {hair: hairColors.brown2, tattoo: tattooColors.blue1},
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

function padZeroes(number, length) {
    var my_string = '' + number;
    while (my_string.length < length) {
        my_string = '0' + my_string;
    }

    return my_string;
}

var raceIndex, raceTemplateGenders, genderIndex, raceTemplateName, raceTemplate;

// Select Character Features Randomly
function randomChar() {
	var genChar = [];
	var genName = [];
	var genIndex = [];

	function getRandomInt(max) {
		return Math.floor(Math.random() * max);
	}
	
	raceIndex = getRandomInt(createdCharacter.length);
	genderIndex = getRandomInt(Object.keys(createdCharacter[raceIndex]).length);
	raceTemplateName = Object.keys(createdCharacter[raceIndex])[genderIndex];
	raceTemplate = raceTemplates[raceIndex][genderIndex];
	popRaceName(raceTemplateName);

	function getRandomFeature(array) {
		var randomInt = getRandomInt(array.length)
		genChar.push(array[randomInt]);
		var randomIntString = randomInt.toString();
		genName += padZeroes(randomIntString, 2);
		genIndex.push(randomInt);
	}

	for(var i = 0; i < raceTemplate.length - 1; i++) {
		getRandomFeature(raceTemplate[i]);
	}

	var createdCharacterObject = createdCharacter[raceIndex][raceTemplateName];

	for(var i = 0; i < Object.keys(createdCharacterObject).length; i++) {
		var prop = Object.keys(createdCharacterObject)[i];
		createdCharacterObject[prop] = genIndex[i];
	}

	// get random hair color.
	var randomHairColorInt = getRandomInt(Object.keys(hairColors).length);
	var randomHairColorName = Object.keys(hairColors)[randomHairColorInt];
	selectHairColor(randomHairColorName);
	genColorSwatches(hairColors, 'hair');

	// get random tattoo color.
	var randomTattooColorInt = getRandomInt(Object.keys(tattooColors).length);
	var randomTattooColorName = Object.keys(tattooColors)[randomTattooColorInt];
	selectTattooColor(randomTattooColorName);
	genColorSwatches(tattooColors, 'tattoo');

	// 0(gender) 0(race) 00(features) 00(hairColor) 00(tattooColor)
	genName = genderIndex.toString() + raceIndex.toString() + genName + padZeroes(hairColorIndex, 2) + padZeroes(tattooColorIndex, 2);
	drawChar(genChar, genName, true);
}

randomChar();

// Select Character Features
function createCharacter(raceTemplate) {
	var genChar = [];
	var genName = [];
	raceTemplateName = Object.keys(createdCharacter[raceIndex])[genderIndex];
	var createdCharacterObject = createdCharacter[raceIndex][raceTemplateName];

	for(var i = 0; i < Object.keys(createdCharacterObject).length; i++) {
		var prop = Object.keys(createdCharacterObject)[i];
		genChar.push(raceTemplate[i][createdCharacterObject[prop]]);
		genName += padZeroes(createdCharacterObject[prop], 2);
	}

	genName = genderIndex.toString() + raceIndex.toString() + genName + padZeroes(hairColorIndex, 2) + padZeroes(tattooColorIndex, 2);
	drawChar(genChar, genName, true);
};

// var test = raceTemplates[2][0];
// drawChar([test[0][1], test[1][0], test[2][0], test[3][1], test[4][0]], 'test', true);

function selectChar(feature, scale) {
	var array = createdCharacter[raceIndex][raceTemplateName];

	function changeProp() {
		var index = Object.keys(array).indexOf(feature);
	
		if( scale === 'increase' ) {

			if( array[feature] < raceTemplate[index].length - 1 ) {
				
				array[feature]++;
				createCharacter(raceTemplate);
			} else {

				array[feature] = 0;
				createCharacter(raceTemplate);
			}
		}

		else if( scale === 'decrease' ) {
			if( array[feature] === 0 ) {

				array[feature] = raceTemplate[index].length - 1;
				createCharacter(raceTemplate);
			} else {

				array[feature]--;
				createCharacter(raceTemplate);
			}
		}
	}

	changeProp();
}

function selectGender(gender) {

	function changeGender() {
		raceTemplate = raceTemplates[raceIndex][genderIndex];
		createCharacter(raceTemplate);
		genColorSwatches(hairColors, 'hair');
	}

	if( gender === 'male' ) {
		if( genderIndex > 0 ) {

			genderIndex--;
			changeGender();
		}
	}
	if( gender === 'female' ) {

		if( genderIndex < Object.keys(raceTemplates[raceIndex]).length - 1 ) {

			genderIndex++;
			changeGender();
		}
	}
}

function selectRace(scale) {

	function changeRace() {
		raceTemplate = raceTemplates[raceIndex][genderIndex];
		createCharacter(raceTemplate);
		popRaceName(raceTemplateName);
		genColorSwatches(hairColors, 'hair');
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

function selectHairColor(color) {
	var selectedHairColor = hairColors[color];
	createdColor[raceIndex][raceTemplateName].hair = selectedHairColor;
	hairColorIndex = Object.keys(hairColors).indexOf(color);

	createCharacter(raceTemplate);
}

function selectTattooColor(color) {
	var selectedTattooColor = tattooColors[color];
	createdColor[raceIndex][raceTemplateName].tattoo = selectedTattooColor;
	tattooColorIndex = Object.keys(tattooColors).indexOf(color);

	createCharacter(raceTemplate);
}
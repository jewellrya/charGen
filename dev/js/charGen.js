import { charMaps } from './charMaps.js';

let canvas = document.getElementById("canvas");
let ctx = canvas.getContext('2d');

ctx.scale(10, 10);
ctx.imageSmoothingEnabled = false;

var xOffset = 10;
var yOffset = 12;

function createRaceTemplate(race, racePrimary, gender, map) {
	var genTemplate = [];

	for( var i = 0; i < Object.keys(map).length; i++ ) {
		var propArray = [];
		var prop = Object.keys(map)[i];
		var propCap = prop.charAt(0).toUpperCase() + prop.slice(1);
		var raceCap = race.charAt(0).toUpperCase() + race.slice(1);
		var racePrimaryCap = racePrimary.charAt(0).toUpperCase() + racePrimary.slice(1);
		var genderCap = gender.charAt(0).toUpperCase() + gender.slice(1);

		if(racePrimary.length > 0) {
			racePrimaryCap = racePrimaryCap + ' ';
		}
		
		for( var j = 0; j < map[prop].length; j++) {
			var propArrayObject;
			var index = (j + 1).toString();
			
			if ( i === 0 ) {
				propArrayObject = {
					name: race + genderCap + index,
					src: '../../assets/' + raceCap + ' ' + racePrimaryCap + genderCap + index + '.png',
					x: xOffset + (map[prop][j][0]),
					y: yOffset + (map[prop][j][1]),
				}
			}
			else if ( i > 0 ) {

				propArrayObject = {
					name: race + genderCap + propCap + index,
					src: '../../assets/' + raceCap + ' ' + racePrimaryCap + genderCap + ' ' + propCap + index + '.png',
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

var preload = function(imageArray, callback) {

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
var hairColors = { // 'primary' color first, shade second
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
	red2: '#6d451e',
	orange1: '#9d7a65',
	yellow1: '#b8bc6b',
	green1: '#4a630c',
	green2: '#5ba347',
	cyan1: '#659d91',
	blue1: '#4164ab',
	violet1: '#75659d',
	black1: '#6a645f',
	gray1: '#a5a09a',
	white1: '#e6dbd2',
	white2: '#d5dae0',
}

function genColorSwatches(colorObject, subject) {
	var primaryColor, colorName, createdColorValue;

	var subjectCap = subject.charAt(0).toUpperCase() + subject.slice(1);
	document.getElementById(subject + 'ColorSwatches').innerHTML = '';
	
	function setPrimaryColor() {
		if ( Array.isArray(colorObject[colorName])) {
			primaryColor = colorObject[colorName][0];
			createdColorValue = createdColor[racePrimaryIndex][raceIndex][raceTemplateName][subject][0];

		} else {
			primaryColor = colorObject[colorName];
			createdColorValue = createdColor[racePrimaryIndex][raceIndex][raceTemplateName][subject];
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
	var colorArray = createdColor[racePrimaryIndex][raceIndex][raceTemplateName].hair;

	replaceColor(data, '#8a8a8a', colorArray[0]);
	replaceColor(data, '#787878', colorArray[1]);
}

function applyTattooColor(data) {
	var color = createdColor[racePrimaryIndex][raceIndex][raceTemplateName].tattoo;

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
		var charGenComponent = '<div id="component_' + name + '" class="col-12 col-md-6"><div class="d-flex flex-column"><img id="img_' + name + '" src="' + img + '"/><a class="text-center text-truncate" href="' + img + '" download="' + name + '">Export \"' + name + '\"</a></div></div>';

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
	for(var i = 0; i < celtonHumanMale[0].length; i++) {
		for(var j = 0; j < celtonHumanMale[5].length; j++) {
			for(var k = 0; k < celtonHumanMale[1].length; k++) {
				for(var l = 0; l < celtonHumanMale[2].length; l++) {

					var genChar = [];

					genChar.push(celtonHumanMale[0][i]);
					genChar.push(celtonHumanMale[5][j]);
					genChar.push(celtonHumanMale[1][k]);
					genChar.push(celtonHumanMale[2][l]);

					drawChar(genChar, 'celtonHumanMale' + i + k + l + 0 + 0 + j);

					drawAmount++;
					document.getElementById("drawAmount").innerHTML = drawAmount + ' results.';
				}
			}
		}
	}

	//- Permutation for all skin tones.
	for(var i = 0; i < celtonHumanMale[0].length; i++) {
		for(var j = 0; j < celtonHumanMale[1].length; j++) {
			for(var k = 0; k < celtonHumanMale[2].length; k++) {
				for(var l = 0; l < celtonHumanMale[3].length; l++) {
					for(var m = 0; m < celtonHumanMale[4].length; m++) {
							
						var genChar = [];

						genChar.push(celtonHumanMale[0][i]);
						genChar.push(celtonHumanMale[1][j]);
						genChar.push(celtonHumanMale[2][k]);
						genChar.push(celtonHumanMale[3][l]);
						genChar.push(celtonHumanMale[4][m]);

						drawChar(genChar, 'celtonHumanMale' + i + j + k + l + m + 0);
					}
				}
			}
		}
	}
}

var celtonHumanMale, 
	celtonHumanFemale, 
	halokrHumanMale, 
	halokrHumanFemale, 
	halforcMale, 
	halforcFemale, 
	dwarfMale, 
	dwarfFemale,
	highElfMale,
	highElfFemale,
	woodElfMale,
	woodElfFemale,
	deepElfMale,
	deepElfFemale;

var raceTemplates = [
	[
		[
			celtonHumanMale = createRaceTemplate('celton', 'human', 'male', charMaps.celtonHumanMale),
			celtonHumanFemale = createRaceTemplate('celton', 'human', 'female', charMaps.celtonHumanFemale)
		],
		[
			halokrHumanMale = createRaceTemplate('halokr', 'human', 'male', charMaps.halokrHumanMale),
			halokrHumanFemale = createRaceTemplate('halokr', 'human', 'female', charMaps.halokrHumanFemale)
		]
	],
	[
		[
			halforcMale = createRaceTemplate('halforc', '', 'male', charMaps.halforcMale),
			halforcFemale = createRaceTemplate('halforc', '', 'female', charMaps.halforcFemale)
		]
	],
	[
		[
			dwarfMale = createRaceTemplate('dwarf', '', 'male', charMaps.dwarfMale),
			dwarfFemale = createRaceTemplate('dwarf', '', 'female', charMaps.dwarfFemale)
		]
	],
	[
		[
			highElfMale = createRaceTemplate('highelf', 'elf', 'male', charMaps.highElfMale),
			highElfFemale = createRaceTemplate('highelf', 'elf', 'female', charMaps.highElfFemale)

		],
		[
			woodElfMale = createRaceTemplate('woodelf', 'elf', 'male', charMaps.woodElfMale),
			woodElfFemale = createRaceTemplate('woodelf', 'elf', 'male', charMaps.woodElfFemale)
		],
		[
			deepElfMale = createRaceTemplate('deepelf', 'elf', 'male', charMaps.deepElfMale),
			deepElfFemale = createRaceTemplate('deepelf', 'elf', 'female', charMaps.deepElfFemale),
		],
	],
]

var createdCharacter = [
	[
		{
			celtonHumanMale: {skin: 2, hair: 0, beard: 1, adornment: 0, tattoo: 0},
			celtonHumanFemale: {skin: 2, hair: 2, beard: 0, adornment: 1, tattoo: 1},
		},
		{
			halokrHumanMale: {skin: 0, hair: 2, beard: 2, adornment: 1, tattoo: 1},
			halokrHumanFemale: {skin: 0, hair: 3, beard: 0, adornment: 1, tattoo: 0},
		},
	],
	[
		{
			halforcMale: {skin: 1, hair: 2, beard: 1, adornment: 0, tattoo: 2},
			halforcFemale: {skin: 0, hair: 2, beard: 0, adornment: 1, tattoo: 2},
		},
	],
	[
		{
			dwarfMale: {skin: 1, hair: 2, beard: 2, adornment: 0, tattoo: 3},
			dwarfFemale: {skin: 0, hair: 3, beard: 0, adornment: 1, tattoo: 0},
		},
	],
	[
		{
			highElfMale: {skin: 0, hair: 0, beard: 0, adornment: 0, tattoo: 0},
		},
		{
			woodElfMale: {skin: 0, hair: 0, beard: 0, adornment: 0, tattoo: 0},
		},
		{
			deepElfMale: {skin: 0, hair: 0, beard: 0, adornment: 0, tattoo: 0},
		},
	],
]

var createdColor = [
	[
		{
			celtonHumanMale: {hair: hairColors.yellow1, tattoo: tattooColors.green1},
			celtonHumanFemale: {hair: hairColors.yellow2, tattoo: tattooColors.green1},
		},
		{
			halokrHumanMale: {hair: hairColors.black1, tattoo: tattooColors.red1},
			halokrHumanFemale: {hair: hairColors.brown1, tattoo: tattooColors.red1},
		},
	],
	[
		{
			halforcMale: {hair: hairColors.brown1, tattoo: tattooColors.red1},
			halforcFemale: {hair: hairColors.black2, tattoo: tattooColors.green2},
		},
	],
	[
		{
			dwarfMale: {hair: hairColors.gray2, tattoo: tattooColors.blue1},
			dwarfFemale: {hair: hairColors.brown2, tattoo: tattooColors.blue1},
		},
	],
	[
		{
			highElfMale: {hair: hairColors.brown1, tattoo: tattooColors.red1},
		},
		{
			woodElfMale: {hair: hairColors.brown1, tattoo: tattooColors.red1},
		},
		{
			deepElfMale: {hair: hairColors.brown1, tattoo: tattooColors.red1},
		},
	],
]

function genRaceNames(raceTemplateName) {
	var racePrimaryName, racePrimaryLore, raceName, raceLore;

	// Primary Race
	if ( raceTemplateName.includes('Human') ) {
		racePrimaryName = 'Human';
		racePrimaryLore = 'Being versatile and ambitious, humans are the most diplomatic when bringing races of the Mortal Kingdoms together for multitudes of reasons. Although humans have a relatively young history, many of their kingdoms have made great progress in recent eras.';
	}

	if ( raceTemplateName.includes('halforc') ) {
		racePrimaryName = 'Half-orc';
		racePrimaryLore = 'Half-orcs are humanoids born of both human and orc ancestry. Often shunned in both human and orcish society, they have an ability to thrive in unwelcome or unusual locations. With their intelligence on par with humans and their strength comparable to orcs, Half-orcs prove to be formidable.';
	}

	if ( raceTemplateName.includes('dwarf') ) {
		racePrimaryName = 'Dwarf';
		racePrimaryLore = 'Coming from seven primary clans throughout the Mortal Empires, Dwarves are tradition-abiding folk known for their strong martial traditions and beautiful craftmanship. Dwarves are hardy, loyal, and wise, looking to their ancestors for inspiration.';
	}

	if ( raceTemplateName.includes('Elf') ) {
		racePrimaryName = 'Elf';
		racePrimaryLore = 'Elf Lore.';
	}

	// Race
	if ( raceTemplateName.includes('celton') ) {
		raceName = 'Celton';
		raceLore = 'For what they lack in physical skill, the Celtons make up for it in their affinity for spell weaving, particularly with nature. Their tribes are led by kings and the druid-warrior aristocracy. Celton are natural mercantile folk, with a large commerce of ores and jewels across the Mortal Empires.';
	}

	if ( raceTemplateName.includes('halokr') ) {
		raceName = 'Halok\'r';
		raceLore = 'Halok\'r hail from the great desert province of Nazinthal. They are descended from a long line of warriors and mystic seers. Their pride and fierce independence of spirit makes them suitable as free ranging heroes and adventurers.';
	}

	if ( raceTemplateName.includes('high') ) {
		raceName = 'High Elf';
		raceLore = 'Elf Lore.';
	}

	if ( raceTemplateName.includes('wood') ) {
		raceName = 'Wood Elf';
		raceLore = 'Elf Lore.';
	}

	if ( raceTemplateName.includes('deep') ) {
		raceName = 'Deep Elf';
		raceLore = 'Elf Lore.';
	}

	document.getElementById('selectedRacePrimary').innerHTML = racePrimaryName;
	document.getElementById('selectedRacePrimaryLore').innerHTML = racePrimaryLore;

	if (raceTemplates[racePrimaryIndex].length <= 1) {
		document.getElementById('selectedRaceDom').classList.add('d-none');
		document.getElementById('selectedRace').innerHTML = '';
		document.getElementById('selectedRaceLore').innerHTML = '';
	} else {
		document.getElementById('selectedRaceDom').classList.remove('d-none');
		document.getElementById('selectedRace').innerHTML = raceName;
		document.getElementById('selectedRaceLore').innerHTML = raceLore;
	}
}

// pad zeros so number is always x digits long.
function padZeroes(number, length) {
    var my_string = '' + number;
    while (my_string.length < length) {
        my_string = '0' + my_string;
    }

    return my_string;
}

var racePrimaryIndex, raceIndex, genderIndex, raceTemplateName, raceTemplate;

// Select Character Features Randomly
function randomChar() {
	var genChar = [];
	var genName = [];
	var genIndex = [];

	function getRandomInt(max) {
		return Math.floor(Math.random() * max);
	}
	
	racePrimaryIndex = getRandomInt(createdCharacter.length);
	raceIndex = getRandomInt(createdCharacter[racePrimaryIndex].length);
	genderIndex = getRandomInt(Object.keys(createdCharacter[racePrimaryIndex][raceIndex]).length);
	raceTemplateName = Object.keys(createdCharacter[racePrimaryIndex][raceIndex])[genderIndex];
	raceTemplate = raceTemplates[racePrimaryIndex][raceIndex][genderIndex];
	genRaceNames(raceTemplateName);

	// check gender radio
	var selectedGenderRadio = document.getElementById('genderRadio' + (genderIndex + 1));
	selectedGenderRadio.checked = true;

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

	var createdCharacterObject = createdCharacter[racePrimaryIndex][raceIndex][raceTemplateName];

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

window.randomChar = randomChar;
randomChar();

// Select Character Features
function createCharacter(raceTemplate) {
	var genChar = [];
	var genName = [];
	raceTemplateName = Object.keys(createdCharacter[racePrimaryIndex][raceIndex])[genderIndex];
	var createdCharacterObject = createdCharacter[racePrimaryIndex][raceIndex][raceTemplateName];

	for(var i = 0; i < Object.keys(createdCharacterObject).length; i++) {
		var prop = Object.keys(createdCharacterObject)[i];
		genChar.push(raceTemplate[i][createdCharacterObject[prop]]);
		genName += padZeroes(createdCharacterObject[prop], 2);

		var uiFeatureValue;
		if (createdCharacterObject[prop] > 0) {
			if( prop !== 'skin' ) {
				uiFeatureValue = createdCharacterObject[prop];
			} else {
				uiFeatureValue = createdCharacterObject[prop] + 1;
			}
		} else {
			if( prop !== 'skin' ) {
				uiFeatureValue = 'None';
			} else {
				uiFeatureValue = 1;
			}
		}
		
		document.getElementById(prop + 'Value').innerHTML = uiFeatureValue;
	}

	genName = genderIndex.toString() + raceIndex.toString() + genName + padZeroes(hairColorIndex, 2) + padZeroes(tattooColorIndex, 2);
	drawChar(genChar, genName, true);
};

// var test = raceTemplates[0][1][1];
// drawChar([test[0][0], test[1][3], test[2][0], test[3][2], test[4][0]], 'test', true);

// select character features and redraw each time.
function selectChar(feature, scale) {
	var array = createdCharacter[racePrimaryIndex][raceIndex][raceTemplateName];

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
window.selectChar = selectChar;

// select gender
function selectGender(gender) {

	function changeGender() {
		raceTemplate = raceTemplates[racePrimaryIndex][raceIndex][genderIndex];
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

		if( genderIndex < Object.keys(raceTemplates[racePrimaryIndex][raceIndex]).length - 1 ) {
				
			genderIndex++;
			changeGender();
		}
	}
}
window.selectGender = selectGender;

// select primary race
function selectRacePrimary(scale) {
	function changeRacePrimary() {
		raceIndex = 0;
		raceTemplate = raceTemplates[racePrimaryIndex][raceIndex][genderIndex];
		createCharacter(raceTemplate);
		genRaceNames(raceTemplateName);
		genColorSwatches(hairColors, 'hair');
	}

	if( scale === 'increase' ) {
		if( racePrimaryIndex < raceTemplates.length - 1 ) {
			racePrimaryIndex++;
			changeRacePrimary();
		}
		else {
			racePrimaryIndex = 0;
			changeRacePrimary();
		}
	}

	if( scale === 'decrease' ) {
		if( racePrimaryIndex > 0 ) {
			racePrimaryIndex--;
			changeRacePrimary();
		}
		else {
			racePrimaryIndex = raceTemplates.length - 1;
			changeRacePrimary();
		}
	}
}
window.selectRacePrimary = selectRacePrimary;

// select race or "sub-race"
function selectRace(scale) {

	function changeRace() {
		raceTemplate = raceTemplates[racePrimaryIndex][raceIndex][genderIndex];
		createCharacter(raceTemplate);
		genRaceNames(raceTemplateName);
		genColorSwatches(hairColors, 'hair');
	}

	if( scale === 'increase' ) {
		if( raceIndex < raceTemplates[racePrimaryIndex].length - 1 ) {
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
			raceIndex = raceTemplates[racePrimaryIndex].length - 1;
			changeRace();
		}
	}
}
window.selectRace = selectRace;

// select hair color
function selectHairColor(color) {
	var selectedHairColor = hairColors[color];
	createdColor[racePrimaryIndex][raceIndex][raceTemplateName].hair = selectedHairColor;
	hairColorIndex = Object.keys(hairColors).indexOf(color);

	createCharacter(raceTemplate);
}
window.selectHairColor = selectHairColor;

// select tattoo color
function selectTattooColor(color) {
	var selectedTattooColor = tattooColors[color];
	createdColor[racePrimaryIndex][raceIndex][raceTemplateName].tattoo = selectedTattooColor;
	tattooColorIndex = Object.keys(tattooColors).indexOf(color);

	createCharacter(raceTemplate);
}
window.selectTattooColor = selectTattooColor;
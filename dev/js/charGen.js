import { charMaps } from './charMaps.js';

let canvas = document.getElementById("canvas");
let ctx = canvas.getContext('2d');

ctx.scale(10, 10);
ctx.imageSmoothingEnabled = false;

var xOffset = 10;
var yOffset = 12;

function createRaceGenderTemplate(race, racePrimary, gender, map) {
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

			if (raceGenderTemplateObject[racePrimaryName].hasOwnProperty('races')) {
				createdColorValue = raceGenderTemplateObject[racePrimaryName]['races'][raceName]['genders'][genderName]['presets']['colors'][subject][0];
			} else {
				createdColorValue = raceGenderTemplateObject[racePrimaryName]['genders'][genderName]['presets']['colors'][subject][0];
			}

		} else {
			primaryColor = colorObject[colorName];
			if (raceGenderTemplateObject[racePrimaryName].hasOwnProperty('races')) {
				createdColorValue = raceGenderTemplateObject[racePrimaryName]['races'][raceName]['genders'][genderName]['presets']['colors'][subject];
			} else {
				createdColorValue = raceGenderTemplateObject[racePrimaryName]['genders'][genderName]['presets']['colors'][subject];
			}
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
	var colorArray;

	if (raceGenderTemplateObject[racePrimaryName].hasOwnProperty('races')) {
		colorArray = raceGenderTemplateObject[racePrimaryName]['races'][raceName]['genders'][genderName]['presets']['colors'].hair;
	} else {
		colorArray = raceGenderTemplateObject[racePrimaryName]['genders'][genderName]['presets']['colors'].hair;
	}

	replaceColor(data, '#8a8a8a', colorArray[0]);
	replaceColor(data, '#787878', colorArray[1]);
}

function applyTattooColor(data) {
	var color;
	if (raceGenderTemplateObject[racePrimaryName].hasOwnProperty('races')) {
		color = raceGenderTemplateObject[racePrimaryName]['races'][raceName]['genders'][genderName]['presets']['colors'].tattoo;
	} else {
		color = raceGenderTemplateObject[racePrimaryName]['genders'][genderName]['presets']['colors'].tattoo;
	}

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

var raceGenderTemplateObject = {};

function genCharUtilities(racePrimary, race, racePrimaryLore, raceLore, raceGenderTemplatePresets) {	
	
	var racePrimaryLowerCase = racePrimary.toLowerCase();
	var raceLowerCase = race.toLowerCase();
	var genders = ['Male', 'Female'];
	var templateObjectValue = {};
	
	if(racePrimary.length > 0) {

		if(raceGenderTemplateObject.hasOwnProperty(racePrimaryLowerCase)) {
			templateObjectValue = raceGenderTemplateObject;
		} else {
			templateObjectValue[racePrimaryLowerCase] = {lore: racePrimaryLore, races: []};	
		}
		templateObjectValue[racePrimaryLowerCase]['races'][raceLowerCase] = {lore: raceLore, genders: {male: {presets: {}, template: {}}, female: {presets: {}, template: {}}}};

		for( var i = 0; i < genders.length; i++) {

			var gender = genders[i];
			var genderLowerCase = gender.toLowerCase();
			var raceGenderTemplate = createRaceGenderTemplate(raceLowerCase, racePrimaryLowerCase, genderLowerCase, charMaps[raceLowerCase + racePrimary + gender]);
			templateObjectValue[racePrimaryLowerCase]['races'][raceLowerCase]['genders'][genderLowerCase]['template'] = raceGenderTemplate;
			templateObjectValue[racePrimaryLowerCase]['races'][raceLowerCase]['genders'][genderLowerCase]['presets'] = raceGenderTemplatePresets[genderLowerCase];
		}

	} else {
		
		if(raceGenderTemplateObject.hasOwnProperty(racePrimary)) {
			templateObjectValue = raceGenderTemplateObject;
		} else {
			templateObjectValue[raceLowerCase] = {lore: raceLore, genders: {male: {presets: {}, template: {}}, female: {presets: {}, template: {}}}};
		}

		for( var i = 0; i < genders.length; i++) {

			var gender = genders[i];
			var genderLowerCase = gender.toLowerCase();
			var raceGenderTemplate = createRaceGenderTemplate(raceLowerCase, racePrimaryLowerCase, genderLowerCase, charMaps[raceLowerCase + racePrimary + gender]);
			templateObjectValue[raceLowerCase]['genders'][genderLowerCase]['template'] = raceGenderTemplate;
			templateObjectValue[raceLowerCase]['genders'][genderLowerCase]['presets'] = raceGenderTemplatePresets[genderLowerCase];
		}
	}
	
	Object.assign(raceGenderTemplateObject, templateObjectValue);
}

genCharUtilities(
	'Human',
	'Celton',
	'Being versatile and ambitious, humans are the most diplomatic when bringing races of the Mortal Kingdoms together for multitudes of reasons. Although humans have a relatively young history, many of their kingdoms have made great progress in recent eras.',
	'For what they lack in physical skill, the Celtons make up for it in their affinity for spell weaving, particularly with nature. Their tribes are led by kings and the druid-warrior aristocracy. Celton are natural mercantile folk, with a large commerce of ores and jewels across the Mortal Empires.',
	{
		male: {
			colors: { hair: hairColors.yellow1, tattoo: tattooColors.green1 },
			features: { skin: 2, hair: 0, beard: 1, adornment: 0, tattoo: 0 }
		},
		female: {
			colors: { hair: hairColors.yellow2, tattoo: tattooColors.green1 },
			features: { skin: 2, hair: 2, beard: 0, adornment: 1, tattoo: 1 }
		}
	}
);

genCharUtilities(
	'Human',
	'Halokr',
	'Being versatile and ambitious, humans are the most diplomatic when bringing races of the Mortal Kingdoms together for multitudes of reasons. Although humans have a relatively young history, many of their kingdoms have made great progress in recent eras.',
	'Halok\'r hail from the great desert province of Nazinthal. They are descended from a long line of warriors and mystic seers. Their pride and fierce independence of spirit makes them suitable as free ranging heroes and adventurers.',
	{
		male: {
			colors: { hair: hairColors.yellow1, tattoo: tattooColors.green1 },
			features: { skin: 2, hair: 0, beard: 1, adornment: 0, tattoo: 0 }
		},
		female: {
			colors: { hair: hairColors.black1, tattoo: tattooColors.red2 },
			features: { skin: 2, hair: 2, beard: 0, adornment: 1, tattoo: 0 }
		}
	}
);

genCharUtilities(
	'',
	'Halforc',
	'',
	'Half-orcs are humanoids born of both human and orc ancestry. Often shunned in both human and orcish society, they have an ability to thrive in unwelcome or unusual locations. With their intelligence on par with humans and their strength comparable to orcs, Half-orcs prove to be formidable.',
	{
		male: {
			colors: { hair: hairColors.brown1, tattoo: tattooColors.red1 },
			features: { skin: 1, hair: 2, beard: 1, adornment: 0, tattoo: 2 }
		},
		female: {
			colors: { hair: hairColors.black1, tattoo: tattooColors.green2 },
			features: { skin: 0, hair: 2, beard: 0, adornment: 1, tattoo: 2 }
		}
	}
);

genCharUtilities(
	'',
	'Dwarf',
	'',
	'Coming from seven primary clans throughout the Mortal Empires, Dwarves are tradition-abiding folk known for their strong martial traditions and beautiful craftmanship. Dwarves are hardy, loyal, and wise, looking to their ancestors for inspiration.',
	{
		male: {
			colors: { hair: hairColors.gray2, tattoo: tattooColors.blue1 },
			features: { skin: 1, hair: 2, beard: 2, adornment: 0, tattoo: 3 }
		},
		female: {
			colors: { hair: hairColors.brown2, tattoo: tattooColors.blue1 },
			features: { skin: 0, hair: 3, beard: 0, adornment: 1, tattoo: 0 }
		}
	}
);

console.log(raceGenderTemplateObject);

// pad zeros so number is always x digits long.
function padZeroes(number, length) {
    var my_string = '' + number;
    while (my_string.length < length) {
        my_string = '0' + my_string;
    }

    return my_string;
}

var racePrimaryIndex, racePrimaryName, racePrimaryLore, raceIndex, raceName, raceLore, genderIndex, genderName, raceGenderColorPresets, raceGenderFeaturePresets, raceGenderTemplate;

// Select Character Features Randomly
function randomChar() {
	var genChar = [];
	var genName = [];
	var genIndex = [];

	function getRandomInt(max) {
		return Math.floor(Math.random() * max);
	}

	racePrimaryIndex = getRandomInt(Object.keys(raceGenderTemplateObject).length);
	racePrimaryName = Object.keys(raceGenderTemplateObject)[racePrimaryIndex];
	if (raceGenderTemplateObject[racePrimaryName].hasOwnProperty('races')) {
		raceIndex = getRandomInt(Object.keys(raceGenderTemplateObject[racePrimaryName]['races']).length);
		raceName = Object.keys(raceGenderTemplateObject[racePrimaryName]['races'])[raceIndex];
		genderIndex = getRandomInt(Object.keys(raceGenderTemplateObject[racePrimaryName]['races'][raceName]['genders']).length);
		genderName = Object.keys(raceGenderTemplateObject[racePrimaryName]['races'][raceName]['genders'])[genderIndex];
		raceGenderColorPresets = raceGenderTemplateObject[racePrimaryName]['races'][raceName]['genders'][genderName]['presets']['colors'];
		raceGenderFeaturePresets = raceGenderTemplateObject[racePrimaryName]['races'][raceName]['genders'][genderName]['presets']['features'];
		raceGenderTemplate = raceGenderTemplateObject[racePrimaryName]['races'][raceName]['genders'][genderName]['template'];

	} else {
		genderIndex = getRandomInt(Object.keys(raceGenderTemplateObject[racePrimaryName]['genders']).length);
		genderName = Object.keys(raceGenderTemplateObject[racePrimaryName]['genders'])[genderIndex];
		raceGenderColorPresets = raceGenderTemplateObject[racePrimaryName]['genders'][genderName]['presets']['colors'];
		raceGenderFeaturePresets = raceGenderTemplateObject[racePrimaryName]['genders'][genderName]['presets']['features'];
		raceGenderTemplate = raceGenderTemplateObject[racePrimaryName]['genders'][genderName]['template'];
	}

	genRaceNameAndLore();

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

	for(var i = 0; i < raceGenderTemplate.length - 1; i++) {
		getRandomFeature(raceGenderTemplate[i]);
	}

	for(var i = 0; i < Object.keys(raceGenderFeaturePresets).length; i++) {
		var prop = Object.keys(raceGenderFeaturePresets)[i];
		raceGenderFeaturePresets[prop] = genIndex[i];
		document.getElementById(prop + 'Value').innerHTML = genIndex[i];
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
	genName = racePrimaryIndex.toString() + (raceIndex ? raceIndex.toString() : '') + genderIndex.toString() + genName + padZeroes(hairColorIndex, 2) + padZeroes(tattooColorIndex, 2);
	drawChar(genChar, genName, true);
}

window.randomChar = randomChar;
randomChar();

// Generate Selected Character Features
function genCharPresets(raceGenderTemplate) {
	var genChar = [];
	var genName = [];
	
	if (raceGenderTemplateObject[racePrimaryName].hasOwnProperty('races')) {
		raceGenderFeaturePresets = raceGenderTemplateObject[racePrimaryName]['races'][raceName]['genders'][genderName]['presets']['features'];
	} else {
		raceGenderFeaturePresets = raceGenderTemplateObject[racePrimaryName]['genders'][genderName]['presets']['features'];
	}

	for(var i = 0; i < Object.keys(raceGenderFeaturePresets).length; i++) {
		var prop = Object.keys(raceGenderFeaturePresets)[i];
		genChar.push(raceGenderTemplate[i][raceGenderFeaturePresets[prop]]);
		genName += padZeroes(raceGenderFeaturePresets[prop], 2);

		var featureIndex;
		if (raceGenderFeaturePresets[prop] > 0) {
			if( prop !== 'skin' ) {
				featureIndex = raceGenderFeaturePresets[prop];
			} else {
				featureIndex = raceGenderFeaturePresets[prop] + 1;
			}
		} else {
			if( prop !== 'skin' ) {
				featureIndex = 'None';
			} else {
				featureIndex = 1;
			}
		}
		
		document.getElementById(prop + 'Value').innerHTML = featureIndex;
	}

	genName = racePrimaryIndex.toString() + (raceIndex ? raceIndex.toString() : '') + genderIndex.toString() + genName + padZeroes(hairColorIndex, 2) + padZeroes(tattooColorIndex, 2);
	drawChar(genChar, genName, true);
};

// Select character features.
function selectFeaturePresets(feature, scale) {

	var index = Object.keys(raceGenderFeaturePresets).indexOf(feature);

	if( scale === 'increase' ) {

		if( raceGenderFeaturePresets[feature] < raceGenderTemplate[index].length - 1 ) {
			
			raceGenderFeaturePresets[feature]++;
			genCharPresets(raceGenderTemplate);
		} else {

			raceGenderFeaturePresets[feature] = 0;
			genCharPresets(raceGenderTemplate);
		}
	}

	else if( scale === 'decrease' ) {
		if( raceGenderFeaturePresets[feature] === 0 ) {

			raceGenderFeaturePresets[feature] = raceGenderTemplate[index].length - 1;
			genCharPresets(raceGenderTemplate);
		} else {

			raceGenderFeaturePresets[feature]--;
			genCharPresets(raceGenderTemplate);
		}
	}
}
window.selectFeaturePresets = selectFeaturePresets;

// select gender
function selectGender(gender) {

	function changeGender() {
		
		if (raceGenderTemplateObject[racePrimaryName].hasOwnProperty('races')) {
			genderName = Object.keys(raceGenderTemplateObject[racePrimaryName]['races'][raceName]['genders'])[genderIndex];
			raceGenderTemplate = raceGenderTemplateObject[racePrimaryName]['races'][raceName]['genders'][genderName]['template'];
		} else {
			genderName = Object.keys(raceGenderTemplateObject[racePrimaryName]['genders'])[genderIndex];
			raceGenderTemplate = raceGenderTemplateObject[racePrimaryName]['genders'][genderName]['template'];
		}

		genCharPresets(raceGenderTemplate);
		genColorSwatches(hairColors, 'hair');
	}

	if( gender === 'male' ) {
		if( genderIndex > 0 ) {

			genderIndex--;
			changeGender();
		}
	}
	if( gender === 'female' ) {

		if( genderIndex < 1 ) {
				
			genderIndex++;
			changeGender();
		}
	}
}
window.selectGender = selectGender;

// select primary race
function selectRacePrimary(scale) {
	function changeRacePrimary() {

		racePrimaryName = Object.keys(raceGenderTemplateObject)[racePrimaryIndex];

		if (raceGenderTemplateObject[racePrimaryName].hasOwnProperty('races')) {
			raceName = Object.keys(raceGenderTemplateObject[racePrimaryName]['races'])[raceIndex];
			raceGenderTemplate = raceGenderTemplateObject[racePrimaryName]['races'][raceName]['genders'][genderName]['template'];
		} else  {
			raceGenderTemplate = raceGenderTemplateObject[racePrimaryName]['genders'][genderName]['template'];
		}

		genCharPresets(raceGenderTemplate);
		genRaceNameAndLore();
		genColorSwatches(hairColors, 'hair');
	}

	if( scale === 'increase' ) {
		if( racePrimaryIndex < Object.keys(raceGenderTemplateObject).length - 1 ) {
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
			racePrimaryIndex = Object.keys(raceGenderTemplateObject).length - 1;
			changeRacePrimary();
		}
	}
}
window.selectRacePrimary = selectRacePrimary;

// select race
function selectRace(scale) {

	function changeRace() {

		raceName = Object.keys(raceGenderTemplateObject[racePrimaryName]['races'])[raceIndex];
		raceGenderTemplate = raceGenderTemplateObject[racePrimaryName]['races'][raceName]['genders'][genderName]['template'];
		genCharPresets(raceGenderTemplate);

		genRaceNameAndLore();
		genColorSwatches(hairColors, 'hair');
	}

	if( scale === 'increase' ) {
		if( raceIndex < Object.keys(raceGenderTemplateObject[racePrimaryName]['races']).length - 1 ) {
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
			raceIndex = Object.keys(raceGenderTemplateObject[racePrimaryName]['races']).length - 1;
			changeRace();
		}
	}
}
window.selectRace = selectRace;

// select hair color
function selectHairColor(color) {
	var selectedHairColor = hairColors[color];

	if (raceGenderTemplateObject[racePrimaryName].hasOwnProperty('races')) {
		raceGenderColorPresets = raceGenderTemplateObject[racePrimaryName]['races'][raceName]['genders'][genderName]['presets']['colors'].hair = selectedHairColor;
	} else  {
		raceGenderColorPresets = raceGenderTemplateObject[racePrimaryName]['genders'][genderName]['presets']['colors'].hair = selectedHairColor;
	}

	hairColorIndex = Object.keys(hairColors).indexOf(color);
	genCharPresets(raceGenderTemplate);
}
window.selectHairColor = selectHairColor;

// select tattoo color
function selectTattooColor(color) {
	var selectedTattooColor = tattooColors[color];

	if (raceGenderTemplateObject[racePrimaryName].hasOwnProperty('races')) {
		raceGenderColorPresets = raceGenderTemplateObject[racePrimaryName]['races'][raceName]['genders'][genderName]['presets']['colors'].tattoo = selectedTattooColor;
	} else  {
		raceGenderColorPresets = raceGenderTemplateObject[racePrimaryName]['genders'][genderName]['presets']['colors'].tattoo = selectedTattooColor;
	}

	tattooColorIndex = Object.keys(tattooColors).indexOf(color);
	genCharPresets(raceGenderTemplate);
}
window.selectTattooColor = selectTattooColor;

function genRaceNameAndLore() {
	
	racePrimaryLore = raceGenderTemplateObject[racePrimaryName]['lore'];

	document.getElementById('selectedRacePrimary').innerHTML = racePrimaryName;
	document.getElementById('selectedRacePrimaryLore').innerHTML = racePrimaryLore;

	if (raceGenderTemplateObject[racePrimaryName].hasOwnProperty('races')) {
		raceLore = raceGenderTemplateObject[racePrimaryName]['races'][raceName]['lore'];
		document.getElementById('selectedRaceDom').classList.remove('d-none');
		document.getElementById('selectedRace').innerHTML = raceName;
		document.getElementById('selectedRaceLore').innerHTML = raceLore;
		
	} else {
		document.getElementById('selectedRaceDom').classList.add('d-none');
		document.getElementById('selectedRace').innerHTML = '';
		document.getElementById('selectedRaceLore').innerHTML = '';
	}
}
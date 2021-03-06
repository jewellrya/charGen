import { charMaps } from './charMaps.js';

let canvas = document.getElementById("canvas");
let ctx = canvas.getContext('2d');

ctx.scale(10, 10);
ctx.imageSmoothingEnabled = false;

let xOffset = 10;
let yOffset = 12;

function createRaceGenderTemplate(racePrimary, race, gender, xOffsetRace, yOffsetRace) {
	let genTemplate = [];
	let racePrimaryLowerCase = racePrimary.toLowerCase();
	let raceLowerCase = race.toLowerCase();
	let genderCap = gender.charAt(0).toUpperCase() + gender.slice(1);
	let mapPrimary = {};
	let map = {};

	if( racePrimary.length > 0 ) {
		Object.assign(map, charMaps[raceLowerCase + racePrimary + genderCap]);
	} else {
		Object.assign(map, charMaps[raceLowerCase + genderCap]);
	}

	if( racePrimary.length > 1 ) {
		racePrimary = racePrimary + ' ';
	}

	for( let i = 0; i < Object.keys(map).length; i++ ) {
		let propArray = [];
		let prop = Object.keys(map)[i];
		let propCap = prop.charAt(0).toUpperCase() + prop.slice(1);
		
		for( let j = 0; j < map[prop].length; j++) {
			let propArrayObject;
			let index = (j + 1).toString();
			
			if ( i === 0 ) {
				propArrayObject = {
					name: raceLowerCase + genderCap + index,
					src: '../../assets/' + race + ' ' + racePrimary + genderCap + index + '.png',
					x: xOffset + (map[prop][j][0]),
					y: yOffset + (map[prop][j][1]),
				}
			}
			else if ( i > 0 ) {

				propArrayObject = {
					name: raceLowerCase + genderCap + propCap + index,
					src: '../../assets/' + race + ' ' + racePrimary + genderCap + ' ' + propCap + index + '.png',
					x: xOffset + (map[prop][j][0]),
					y: yOffset + (map[prop][j][1]),
				}
			}

			propArray.push(propArrayObject);
		}

		genTemplate.push(propArray);
	}

	if( racePrimary.length > 1 ) {
		
		Object.assign(mapPrimary, charMaps[racePrimaryLowerCase + genderCap]);

		for( let i = 0; i < Object.keys(mapPrimary).length; i++ ) {
			let prop = Object.keys(mapPrimary)[i];
			let propCap = prop.charAt(0).toUpperCase() + prop.slice(1);

			for( let j = 0; j < mapPrimary[prop].length; j++ ) {
				let propArrayObject;
				let index = (j + 1).toString();

				propArrayObject = {
					name: racePrimaryLowerCase + genderCap + propCap + index,
					src: '../../assets/' + racePrimary + genderCap + ' ' + propCap + index + '.png',
					x: xOffset + (mapPrimary[prop][j][0]) + xOffsetRace,
					y: yOffset + (mapPrimary[prop][j][1]) + yOffsetRace
				}
				
				genTemplate[i].push(propArrayObject);
			}
		}
	}

	for( let i = 0; i < Object.keys(map).length; i++ ) {
		let prop = Object.keys(map)[i];
		let propCap = prop.charAt(0).toUpperCase() + prop.slice(1);
		let genderCap = gender.charAt(0).toUpperCase() + gender.slice(1);

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

let preload = function(imageArray, callback) {

	let imagesLoaded = 0;
	let loadedImages = [];

	for (let i = 0; i < imageArray.length; i++) {

		let imgObj = new Image();
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

let hairColorIndex;
let hairColors = { // 'primary' color first, shade second
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

let tattooColorIndex;
let tattooColors = {
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
	let primaryColor, colorName, createdColorValue;

	let subjectCap = subject.charAt(0).toUpperCase() + subject.slice(1);
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

	for( let i = 0; i < Object.keys(colorObject).length; i++ ) {
		colorName = Object.keys(colorObject)[i];
		setPrimaryColor();
		
		let inputName = 'radio' + subjectCap + 'Color';

		let colorSwatchComponent = '<div class="col-auto"><input class="btn-check shadow-none" id="' + inputName + i.toString() + '" type="radio" name="' + inputName + '" autocomplete="off"><label onclick=select' + subjectCap + 'Color(\"' + colorName + '\") class="btn swatch shadow-none" style="background-color: ' + primaryColor + '" for="' + inputName + i.toString() + '"></label></div>'
		document.getElementById(subject + 'ColorSwatches').innerHTML += colorSwatchComponent;
	}

	for( let i = 0; i < Object.keys(colorObject).length; i++ ) {
		colorName = Object.keys(colorObject)[i];
		setPrimaryColor();

		let inputName = 'radio' + subjectCap + 'Color';

		if( primaryColor === createdColorValue ) {
			let selectedColorRadio = document.getElementById(inputName + i);
			selectedColorRadio.checked = true;
		}
	}
}

function hexToRgb(hex){
    let c;
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

	let rgbFind = hexToRgb(colorFind);
	let rgbReplace = hexToRgb(colorReplace);

	for (let i = 0; i < data.length; i += 4) { // red, green, blue, and alpha
        let r = data[i + 0];
        let g = data[i + 1];
        let b = data[i + 2];
        let a = data[i + 3];
		
        if (r === rgbFind[0] && g === rgbFind[1] && b === rgbFind[2] && a === 255) {
			data[i + 0] = rgbReplace[0];
            data[i + 1] = rgbReplace[1];
            data[i + 2] = rgbReplace[2];
        }
    }
}

function applyHairColor(data) {
	let colorArray;

	if (raceGenderTemplateObject[racePrimaryName].hasOwnProperty('races')) {
		colorArray = raceGenderTemplateObject[racePrimaryName]['races'][raceName]['genders'][genderName]['presets']['colors'].hair;
	} else {
		colorArray = raceGenderTemplateObject[racePrimaryName]['genders'][genderName]['presets']['colors'].hair;
	}

	replaceColor(data, '#8a8a8a', colorArray[0]);
	replaceColor(data, '#787878', colorArray[1]);
}

function applyTattooColor(data) {
	let color;
	if (raceGenderTemplateObject[racePrimaryName].hasOwnProperty('races')) {
		color = raceGenderTemplateObject[racePrimaryName]['races'][raceName]['genders'][genderName]['presets']['colors'].tattoo;
	} else {
		color = raceGenderTemplateObject[racePrimaryName]['genders'][genderName]['presets']['colors'].tattoo;
	}

	replaceColor(data, '#8a4646', color);
}

function drawChar(imageArray, name, replace) {
	preload(imageArray, function(loadedImages){

		for (let i = 0; i < imageArray.length; i++) {
			ctx.drawImage(loadedImages[i], imageArray[i].x, imageArray[i].y);

			let imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
			applyHairColor(imageData.data);
			applyTattooColor(imageData.data);
			ctx.putImageData(imageData, 0, 0);
		}

		for (let i = 0; i < imageArray.length; i++) {
			if( loadedImages[i].src.includes('Hair') || 
				loadedImages[i].src.includes('Beard' ) ) {
			}
		}

		let img = canvas.toDataURL("image/png");
		let charGenComponent = '<div id="component_' + name + '" class="col-12 col-md-6"><div class="d-flex flex-column"><img id="img_' + name + '" src="' + img + '"/><a class="text-center text-truncate" href="' + img + '" download="' + name + '">Export \"' + name + '\"</a></div></div>';

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

	console.log('Permutation Started.');
	
	function derp(raceGenderTemplate) {
		for( let hairColorIndex = 0; hairColorIndex < Object.keys(hairColors).length; hairColorIndex++ ) {
			for( let tattooColorIndex = 0; tattooColorIndex < Object.keys(tattooColors).length; tattooColorIndex++ ) {

				for(let i = 0; i < raceGenderTemplate[0].length; i++) {
					for(let j = 0; j < raceGenderTemplate[1].length; j++) {
						for(let k = 0; k < raceGenderTemplate[2].length; k++) {
							for(let l = 0; l < raceGenderTemplate[3].length; l++) {
								for(let m = 0; m < raceGenderTemplate[4].length; m++) {

									// let genChar = [];

									// let hairColorName = Object.keys(hairColors)[hairColorIndex];
									// selectHairColor(hairColorName);

									// let tattooColorName = Object.keys(tattooColors)[tattooColorIndex];
									// selectTattooColor(tattooColorName);

									// genChar.push(raceGenderTemplate[0][i]);
									// genChar.push(raceGenderTemplate[1][j]);
									// genChar.push(raceGenderTemplate[2][k]);
									// genChar.push(raceGenderTemplate[3][l]);
									// genChar.push(raceGenderTemplate[4][m]);

									// drawChar(genChar, 'racePrimary ' + 'race ' + padZeroes(i, 2) + padZeroes(k, 2) + padZeroes(l, 2) + padZeroes(j, 2) + padZeroes(m, 2) + padZeroes(hairColorIndex, 2) + padZeroes(tattooColorIndex, 2));

									drawAmount++;
									document.getElementById("drawAmount").innerHTML = drawAmount + ' results.';
								}
							}
						}
					}
				}

			}
		}
	}
	
	derp(raceGenderTemplateObject['human']['races']['celton']['genders']['male']['template']);
	derp(raceGenderTemplateObject['human']['races']['celton']['genders']['female']['template']);
	derp(raceGenderTemplateObject['human']['races']['halokr']['genders']['male']['template']);
	derp(raceGenderTemplateObject['human']['races']['halokr']['genders']['female']['template']);
	derp(raceGenderTemplateObject['human']['races']['norden']['genders']['male']['template']);
	derp(raceGenderTemplateObject['human']['races']['norden']['genders']['female']['template']);
	derp(raceGenderTemplateObject['human']['races']['gotharien']['genders']['male']['template']);
	derp(raceGenderTemplateObject['human']['races']['gotharien']['genders']['female']['template']);
	derp(raceGenderTemplateObject['human']['races']['sunjin']['genders']['male']['template']);
	derp(raceGenderTemplateObject['human']['races']['sunjin']['genders']['female']['template']);

	derp(raceGenderTemplateObject['elf']['races']['highelf']['genders']['male']['template']);
	derp(raceGenderTemplateObject['elf']['races']['highelf']['genders']['female']['template']);
	derp(raceGenderTemplateObject['elf']['races']['woodelf']['genders']['male']['template']);
	derp(raceGenderTemplateObject['elf']['races']['woodelf']['genders']['female']['template']);
	derp(raceGenderTemplateObject['elf']['races']['deepelf']['genders']['male']['template']);
	derp(raceGenderTemplateObject['elf']['races']['deepelf']['genders']['female']['template']);

	derp(raceGenderTemplateObject['halforc']['genders']['male']['template']);
	derp(raceGenderTemplateObject['halforc']['genders']['female']['template']);
	derp(raceGenderTemplateObject['dwarf']['genders']['male']['template']);
	derp(raceGenderTemplateObject['dwarf']['genders']['female']['template']);
}
window.permute = permute;

let raceGenderTemplateObject = {};

function genCharUtilities(racePrimary, race, racePrimaryLore, raceLore, xOffsetRace, yOffsetRace, raceGenderTemplatePresets) {	
	
	let racePrimaryLowerCase = racePrimary.toLowerCase();
	let raceLowerCase = race.toLowerCase();
	let genders = ['Male', 'Female'];
	let templateObjectValue = {};
	
	if(racePrimary.length > 0) {

		if(raceGenderTemplateObject.hasOwnProperty(racePrimaryLowerCase)) {
			templateObjectValue = raceGenderTemplateObject;
		} else {
			templateObjectValue[racePrimaryLowerCase] = {lore: racePrimaryLore, races: []};	
		}
		templateObjectValue[racePrimaryLowerCase]['races'][raceLowerCase] = {lore: raceLore, genders: {male: {presets: {}, template: {}}, female: {presets: {}, template: {}}}};

		for( let i = 0; i < genders.length; i++) {

			let gender = genders[i];
			let genderLowerCase = gender.toLowerCase();
			let raceGenderTemplate = createRaceGenderTemplate(racePrimary, race, gender, xOffsetRace, yOffsetRace);
			templateObjectValue[racePrimaryLowerCase]['races'][raceLowerCase]['genders'][genderLowerCase]['template'] = raceGenderTemplate;
			templateObjectValue[racePrimaryLowerCase]['races'][raceLowerCase]['genders'][genderLowerCase]['presets'] = raceGenderTemplatePresets[genderLowerCase];
		}

	} else {
		
		if(raceGenderTemplateObject.hasOwnProperty(racePrimary)) {
			templateObjectValue = raceGenderTemplateObject;
		} else {
			templateObjectValue[raceLowerCase] = {lore: raceLore, genders: {male: {presets: {}, template: {}}, female: {presets: {}, template: {}}}};
		}

		for( let i = 0; i < genders.length; i++) {

			let gender = genders[i];
			let genderLowerCase = gender.toLowerCase();
			let raceGenderTemplate = createRaceGenderTemplate(racePrimary, race, gender, xOffsetRace, yOffsetRace);
			templateObjectValue[raceLowerCase]['genders'][genderLowerCase]['template'] = raceGenderTemplate;
			templateObjectValue[raceLowerCase]['genders'][genderLowerCase]['presets'] = raceGenderTemplatePresets[genderLowerCase];
		}
	}
	
	Object.assign(raceGenderTemplateObject, templateObjectValue);
}

let humanLore = 'Being versatile and ambitious, humans are the most diplomatic when bringing races of the Mortal Kingdoms together for multitudes of reasons. Although humans have a relatively young history, many of their kingdoms have made great progress in recent eras.';
let elfLore = 'Elves are intelligent, dexterous, and highly perceptive creatures, giving them a preternaturally awareness of their surroundings. Although lacking in physical aptitude, Elves have an unparallel ability in spell weaving. Rumor has it that groups of secluded Elves still practice the ancient magics of their Ael\'falas ancestors.';

genCharUtilities(
	'Human',
	'Celton',
	humanLore,
	'For what they lack in physical skill, the Celtons make up for it in their affinity for spell weaving, particularly with nature. Their tribes are led by kings and the druid-warrior aristocracy. Celton are natural mercantile folk, with a large commerce of ores and jewels, among other goods, across the Mortal Kingdoms.',
	0,
	0,
	{
		male: {
			colors: { hair: hairColors.yellow1, tattoo: tattooColors.green1 },
			features: { skin: 2, hair: 7, beard: 3, adornment: 1, tattoo: 0 }
		},
		female: {
			colors: { hair: hairColors.red1, tattoo: tattooColors.green1 },
			features: { skin: 2, hair: 1, beard: 0, adornment: 1, tattoo: 1 }
		}
	}
);

genCharUtilities(
	'Human',
	'Halokr',
	humanLore,
	'Halok\'r hail from the great desert province of Nazinthal. They are descended from a long line of warriors and mystic seers. Their pride and fierce independence of spirit makes them suitable as free ranging heroes and adventurers.',
	0,
	0,
	{
		male: {
			colors: { hair: hairColors.black2, tattoo: tattooColors.red1 },
			features: { skin: 0, hair: 5, beard: 4, adornment: 1, tattoo: 0 }
		},
		female: {
			colors: { hair: hairColors.black2, tattoo: tattooColors.red2 },
			features: { skin: 0, hair: 6, beard: 0, adornment: 1, tattoo: 0 }
		}
	}
);

genCharUtilities(
	'Human',
	'Norden',
	humanLore,
	'The Norden are fair-haired and pale-skinned humans known for their incredible resistance to cold and magical frost. They are enthusiastic warriors, and act as soldiers, mercenaries, merchants, and blacksmiths from all over the Mortal Kingdoms. Norden culture is about the quest for honor and glory whilst appeasing the ancient Norden ancestors. They yearn for an honorable death in battle, so they can live blissfully in the meadhalls of Valhalla.',
	0,
	0,
	{
		male: {
			colors: { hair: hairColors.yellow1, tattoo: tattooColors.gray1 },
			features: { skin: 1, hair: 4, beard: 2, adornment: 0, tattoo: 3 }
		},
		female: {
			colors: { hair: hairColors.yellow3, tattoo: tattooColors.gray1 },
			features: { skin: 0, hair: 1, beard: 0, adornment: 0, tattoo: 2 }
		}
	}
);

genCharUtilities(
	'Human',
	'Gotharien',
	humanLore,
	'Gotharien are known to be some of the most well-educated, wealthy, and well-spoken people. Their empire is robust, powerful, and influential in the heart of the Mortal Kingdoms. Gotharien cities of marble protect the great Cathedrals of the Divines where pilgrims across the land come to worship.',
	0,
	0,
	{
		male: {
			colors: { hair: hairColors.black2, tattoo: tattooColors.gray1 },
			features: { skin: 1, hair: 10, beard: 6, adornment: 0, tattoo: 0 }
		},
		female: {
			colors: { hair: hairColors.brown1, tattoo: tattooColors.gray1 },
			features: { skin: 0, hair: 1, beard: 0, adornment: 0, tattoo: 0 }
		}
	}
);

genCharUtilities(
	'Human',
	'Sunjin',
	humanLore,
	'Throughout their history, Sunjin empires have risen and fallen, leaving their forgotten secrets in the ruins of their once bustling cities. They now yearn for a simple life, asking only for peace and a safe home. They\'re known for their traditional fighting styles focusing on mobility, speed, and precision as well as stunning acrobatic tricks perfected through practice and meditation.',
	0,
	0,
	{
		male: {
			colors: { hair: hairColors.black1, tattoo: tattooColors.red1 },
			features: { skin: 0, hair: 1, beard: 1, adornment: 0, tattoo: 0 }
		},
		female: {
			colors: { hair: hairColors.black1, tattoo: tattooColors.red1 },
			features: { skin: 0, hair: 2, beard: 0, adornment: 0, tattoo: 1 }
		}
	}
);

genCharUtilities(
	'',
	'Halforc',
	'',
	'Half-orcs are humanoids born of both human and orc ancestry. Often shunned in both human and orcish society, they have an ability to thrive in unwelcome or unusual locations. With their intelligence on par with humans and their strength comparable to orcs, Half-orcs prove to be formidable.',
	0,
	0,
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
	'Coming from seven primary clans throughout the Mortal Kingdoms, Dwarves are tradition-abiding folk known for their strong martial traditions and beautiful craftmanship. Dwarves are hardy, loyal, and wise, looking to their ancestors for inspiration.',
	0,
	0,
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

genCharUtilities(
	'Elf',
	'Highelf',
	elfLore,
	'High Elves are the most proficient magic-users of the Elves. They are tall, proud, and culturally snobbish. Knowledge from a multitude of subjects is revered in High elf society. Those who master the study of Arcana and Magic are often exalted by their peers.',
	0,
	-2,
	{
		male: {
			colors: { hair: hairColors.yellow2, tattoo: tattooColors.yellow1 },
			features: { skin: 2, hair: 2, beard: 2, adornment: 0, tattoo: 1 }
		},
		female: {
			colors: { hair: hairColors.yellow3, tattoo: tattooColors.blue1 },
			features: { skin: 2, hair: 1, beard: 0, adornment: 0, tattoo: 0 }
		}
	}
);

genCharUtilities(
	'Elf',
	'Woodelf',
	elfLore,
	'Rejecting the formalities of the civilized world, the Wood Elves discarded lavish living for a life in the wilderness, among nature, the trees, and animals. Despite their infamy, they are known to be extremely agile and quick. Their nimbleness serves them best in any art involving thievery. Many are well respected archers, due to their inherent mastery of the bow.',
	0,
	0,
	{
		male: {
			colors: { hair: hairColors.brown3, tattoo: tattooColors.green2 },
			features: { skin: 0, hair: 1, beard: 4, adornment: 0, tattoo: 1 }
		},
		female: {
			colors: { hair: hairColors.brown2, tattoo: tattooColors.green1 },
			features: { skin: 2, hair: 3, beard: 0, adornment: 0, tattoo: 4 }
		}
	}
);

genCharUtilities(
	'Elf',
	'Deepelf',
	elfLore,
	'Not much is known about Deep Elf society, much less their origins. Their combination of powerful intellects with strong and agile physiques produce superior warriors and sorcerers. On the battlefield, Deep Elves are noted for their skill with a balanced integration of the sword, the bow and magic.',
	0,
	0,
	{
		male: {
			colors: { hair: hairColors.black2, tattoo: tattooColors.red1 },
			features: { skin: 1, hair: 8, beard: 0, adornment: 0, tattoo: 2 }
		},
		female: {
			colors: { hair: hairColors.gray1, tattoo: tattooColors.red2 },
			features: { skin: 2, hair: 0, beard: 0, adornment: 0, tattoo: 2 }
		}
	}
);

console.log(raceGenderTemplateObject);

// pad zeros so number is always x digits long.
function padZeroes(number, length) {
    let my_string = '' + number;
    while (my_string.length < length) {
        my_string = '0' + my_string;
    }

    return my_string;
}

let racePrimaryIndex, racePrimaryName, racePrimaryLore, raceIndex, raceName, raceLore, genderIndex, genderName, raceGenderColorPresets, raceGenderFeaturePresets, raceGenderTemplate;

// Select Character Features Randomly
function randomChar() {
	let genChar = [];
	let genName = [];
	let genIndex = [];

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
	let selectedGenderRadio = document.getElementById('genderRadio' + (genderIndex + 1));
	selectedGenderRadio.checked = true;

	function getRandomFeature(array) {
		let randomInt = getRandomInt(array.length)
		genChar.push(array[randomInt]);
		let randomIntString = randomInt.toString();
		genName += padZeroes(randomIntString, 2);
		genIndex.push(randomInt);
	}

	for(let i = 0; i < raceGenderTemplate.length - 1; i++) {
		getRandomFeature(raceGenderTemplate[i]);
	}

	for(let i = 0; i < Object.keys(raceGenderFeaturePresets).length; i++) {
		let prop = Object.keys(raceGenderFeaturePresets)[i];
		raceGenderFeaturePresets[prop] = genIndex[i];
		document.getElementById(prop + 'Value').innerHTML = genIndex[i];
	}

	// get random hair color.
	let randomHairColorInt = getRandomInt(Object.keys(hairColors).length);
	let randomHairColorName = Object.keys(hairColors)[randomHairColorInt];
	selectHairColor(randomHairColorName);
	genColorSwatches(hairColors, 'hair');

	// get random tattoo color.
	let randomTattooColorInt = getRandomInt(Object.keys(tattooColors).length);
	let randomTattooColorName = Object.keys(tattooColors)[randomTattooColorInt];
	selectTattooColor(randomTattooColorName);
	genColorSwatches(tattooColors, 'tattoo');

	// 0(gender) 0(race) 00(features) 00(hairColor) 00(tattooColor)
	genName = racePrimaryIndex.toString() + (raceIndex ? raceIndex.toString() : '') + genderIndex.toString() + genName + padZeroes(hairColorIndex, 2) + padZeroes(tattooColorIndex, 2);
	drawChar(genChar, genName, true);
}

// Generate Selected Character Features
function genCharPresets(raceGenderTemplate) {
	let genChar = [];
	let genName = [];
	
	if (raceGenderTemplateObject[racePrimaryName].hasOwnProperty('races')) {
		raceGenderFeaturePresets = raceGenderTemplateObject[racePrimaryName]['races'][raceName]['genders'][genderName]['presets']['features'];
	} else {
		raceGenderFeaturePresets = raceGenderTemplateObject[racePrimaryName]['genders'][genderName]['presets']['features'];
	}

	for(let i = 0; i < Object.keys(raceGenderFeaturePresets).length; i++) {
		let prop = Object.keys(raceGenderFeaturePresets)[i];
		genChar.push(raceGenderTemplate[i][raceGenderFeaturePresets[prop]]);
		genName += padZeroes(raceGenderFeaturePresets[prop], 2);

		let featureIndex;
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

	let index = Object.keys(raceGenderFeaturePresets).indexOf(feature);

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

// Apply feature presets as index
function applyColorIndex() {
	
	if (raceGenderTemplateObject[racePrimaryName].hasOwnProperty('races')) {
		raceGenderColorPresets = raceGenderTemplateObject[racePrimaryName]['races'][raceName]['genders'][genderName]['presets']['colors'];
	} else {
		raceGenderColorPresets = raceGenderTemplateObject[racePrimaryName]['genders'][genderName]['presets']['colors'];
	}

	for(let i = 0; i < Object.keys(hairColors).length; i++) {
		let hairColorName = Object.keys(hairColors)[i];
		if(hairColors[hairColorName][0] === raceGenderColorPresets.hair[0]) {
			hairColorIndex = i;
		}
	}

	for(let i = 0; i < Object.keys(tattooColors).length; i++) {
		let tattooColorName = Object.keys(tattooColors)[i];
		if(tattooColors[tattooColorName] === raceGenderColorPresets.tattoo) {
			tattooColorIndex = i;
		}
	}
}

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

		applyColorIndex();
		genCharPresets(raceGenderTemplate);
		genColorSwatches(hairColors, 'hair');
		genColorSwatches(tattooColors, 'tattoo');
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
			if(raceIndex === undefined) {
				raceIndex = 0;
			}
			else if(raceIndex > Object.keys(raceGenderTemplateObject[racePrimaryName]['races']).length - 1) {
				raceIndex = Object.keys(raceGenderTemplateObject[racePrimaryName]['races']).length - 1;
			}
			raceName = Object.keys(raceGenderTemplateObject[racePrimaryName]['races'])[raceIndex];
			raceGenderTemplate = raceGenderTemplateObject[racePrimaryName]['races'][raceName]['genders'][genderName]['template'];
		} else  {
			raceGenderTemplate = raceGenderTemplateObject[racePrimaryName]['genders'][genderName]['template'];
		}

		applyColorIndex();
		genCharPresets(raceGenderTemplate);
		genRaceNameAndLore();
		genColorSwatches(hairColors, 'hair');
		genColorSwatches(tattooColors, 'tattoo');
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

		applyColorIndex();
		genRaceNameAndLore();
		genColorSwatches(hairColors, 'hair');
		genColorSwatches(tattooColors, 'tattoo');
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
	let selectedHairColor = hairColors[color];

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
	let selectedTattooColor = tattooColors[color];

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

	if( racePrimaryName.includes('halforc') ) {
		document.getElementById('selectedRacePrimary').innerHTML = 'Half-orc';
	} else {

		document.getElementById('selectedRacePrimary').innerHTML = racePrimaryName;
	}

	document.getElementById('selectedRacePrimaryLore').innerHTML = racePrimaryLore;

	if(raceGenderTemplateObject[racePrimaryName].hasOwnProperty('races')) {
		raceLore = raceGenderTemplateObject[racePrimaryName]['races'][raceName]['lore'];
		document.getElementById('selectedRaceDom').classList.remove('d-none');

		if(raceName.includes('elf')) {
			document.getElementById('selectedRace').innerHTML = raceName.split('elf')[0] + ' Elf';
		}
		else if(raceName.includes('alokr')) {
			document.getElementById('selectedRace').innerHTML = 'Halok\'r';
		}
		else {
			document.getElementById('selectedRace').innerHTML = raceName;
		}

		document.getElementById('selectedRaceLore').innerHTML = raceLore;
		
	} else {
		document.getElementById('selectedRaceDom').classList.add('d-none');
		document.getElementById('selectedRace').innerHTML = '';
		document.getElementById('selectedRaceLore').innerHTML = '';
	}
}

window.randomChar = randomChar;
randomChar();
import { charMaps } from '../../data/charMaps.js';

let canvas = null;
let ctx = null;

function ensureCanvas() {
  if (typeof document === 'undefined') return false;
  if (canvas && ctx) return true;

  const el = document.getElementById('canvas');
  if (!el) return false;

  canvas = el;
  ctx = canvas.getContext('2d');
  if (!ctx) return false;

  ctx.scale(10, 10);
  ctx.imageSmoothingEnabled = false;
  return true;
}

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
					src: '/assets/' + race + ' ' + racePrimary + genderCap + index + '.png',
					x: xOffset + (map[prop][j][0]),
					y: yOffset + (map[prop][j][1]),
				}
			}
			else if ( i > 0 ) {
				propArrayObject = {
					name: raceLowerCase + genderCap + propCap + index,
					src: '/assets/' + race + ' ' + racePrimary + genderCap + ' ' + propCap + index + '.png',
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
					src: '/assets/' + racePrimary + genderCap + ' ' + propCap + index + '.png',
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
				src: '/assets/_blank.png',
				x: 0,
				y: 0
			})
		}
	}

	return genTemplate;
}

let preload = function(imageArray, callback) {
  let completed = 0;
  let loadedImages = new Array(imageArray.length);

  for (let i = 0; i < imageArray.length; i++) {
    const imgObj = new Image();
    // same-origin assets served from /public, no crossOrigin needed; uncomment if using a CDN
    // imgObj.crossOrigin = 'anonymous';

    imgObj.onload = function() {
      loadedImages[i] = imgObj;
      completed++;
      if (completed === imageArray.length) callback(loadedImages);
    };
    imgObj.onerror = function(ev) {
      console.warn('[charGen] Failed to load image:', imageArray[i].src);
      // Still advance so we don't hang forever; use a 1x1 transparent placeholder
      const fallback = document.createElement('canvas');
      fallback.width = canvas ? canvas.width : 1;
      fallback.height = canvas ? canvas.height : 1;
      const fimg = new Image();
      // data URL for 1x1 transparent PNG
      fimg.src = 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8Xw8AAp8B6j3pBV8AAAAASUVORK5CYII=';
      loadedImages[i] = fimg;
      completed++;
      if (completed === imageArray.length) callback(loadedImages);
    };

    // set src after handlers
    imgObj.src = imageArray[i].src;
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
	if (typeof document === 'undefined') return;
	const swatchRoot = document.getElementById(subject + 'ColorSwatches');
	if (!swatchRoot) return;
	// Ensure container has wrap + gap
	swatchRoot.classList.add('flex', 'flex-wrap', 'gap-4');
	swatchRoot.innerHTML = '';
	
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

		let colorSwatchComponent =
		  '<div class="w-7">' +
			'<input class="sr-only peer" id="' + inputName + i.toString() + '" type="radio" name="' + inputName + '" autocomplete="off">' +
			'<label onclick=select' + subjectCap + 'Color("' + colorName + '") ' +
			  'class="block w-10 cursor-pointer rounded border border-2 border-base-300 p-1 hover:bg-base-300 transition' +
					 'peer-checked:border-2 peer-checked:border-primary" ' +
			  'for="' + inputName + i.toString() + '">' +
				'<span class="block h-6 w-full rounded" style="background-color: ' + primaryColor + '"></span>' +
			'</label>' +
		  '</div>';
		swatchRoot.innerHTML += colorSwatchComponent;
	}

	for( let i = 0; i < Object.keys(colorObject).length; i++ ) {
		colorName = Object.keys(colorObject)[i];
		setPrimaryColor();

		let inputName = 'radio' + subjectCap + 'Color';

		if( primaryColor === createdColorValue ) {
			const selectedColorRadio = document.getElementById(inputName + i);
			if (selectedColorRadio) selectedColorRadio.checked = true;
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
	if (!ensureCanvas()) return;
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
		let charGenComponent = '<div id="component_' + name + '" class="w-full md:w-1/2"><div class="flex flex-col items-center gap-2"><img id="img_' + name + '" src="' + img + '" class="mx-auto"/><a class="link text-center truncate" href="' + img + '" download="' + name + '">Export \"' + name + '\"</a></div></div>';

		if (typeof document !== 'undefined') {
			const cg = document.getElementById('charGen');
			if (cg) {
				if (!replace) {
					cg.innerHTML += charGenComponent;
				} else {
					cg.innerHTML = charGenComponent;
				}
			}
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
									if (typeof document !== 'undefined') {
										const el = document.getElementById('drawAmount');
										if (el) el.innerHTML = drawAmount + ' results.';
									}
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
	'',
	'Human',
	'',
	humanLore,
	0,
	0,
	{
		male: {
			colors: { hair: hairColors.yellow1, tattoo: tattooColors.green1 },
			features: { skin: 0, hair: 0, beard: 0, adornment: 0, tattoo: 0 }
		},
		female: {
			colors: { hair: hairColors.red1, tattoo: tattooColors.green1 },
			features: { skin: 0, hair: 0, beard: 0, adornment: 0, tattoo: 0 }
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

	// check gender radio (browser only)
	if (typeof document !== 'undefined') {
		const selectedGenderRadio = document.getElementById('genderRadio' + (genderIndex + 1));
		if (selectedGenderRadio) selectedGenderRadio.checked = true;
	}

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
		if (typeof document !== 'undefined') {
			const el = document.getElementById(prop + 'Value');
			if (el) el.innerHTML = String(genIndex[i]);
		}
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
		if (typeof document !== 'undefined') {
			const el = document.getElementById(prop + 'Value');
			if (el) el.innerHTML = String(featureIndex);
		}
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

function genRaceNameAndLore() {
  if (typeof document === 'undefined') return;
  racePrimaryLore = raceGenderTemplateObject[racePrimaryName]['lore'];

  const elPrimary = document.getElementById('selectedRacePrimary');
  const elPrimaryLore = document.getElementById('selectedRacePrimaryLore');
  const elRaceDom = document.getElementById('selectedRaceDom');
  const elRace = document.getElementById('selectedRace');
  const elRaceLore = document.getElementById('selectedRaceLore');

  if (elPrimary) elPrimary.innerHTML = racePrimaryName.includes('halforc') ? 'Half-orc' : racePrimaryName;
  if (elPrimaryLore) elPrimaryLore.innerHTML = racePrimaryLore || '';

  if (raceGenderTemplateObject[racePrimaryName].hasOwnProperty('races')) {
    raceLore = raceGenderTemplateObject[racePrimaryName]['races'][raceName]['lore'];
    if (elRaceDom) elRaceDom.classList.remove('hidden');

    let raceLabel = raceName;
    if (raceName.includes('elf')) raceLabel = raceName.split('elf')[0] + ' Elf';
    else if (raceName.includes('alokr')) raceLabel = "Halok'r";

    if (elRace) elRace.innerHTML = raceLabel;
    if (elRaceLore) elRaceLore.innerHTML = raceLore || '';
  } else {
    if (elRaceDom) elRaceDom.classList.add('hidden');
    if (elRace) elRace.innerHTML = '';
    if (elRaceLore) elRaceLore.innerHTML = '';
  }
}

if (typeof window !== 'undefined') {
  window.permute = permute;
  window.selectFeaturePresets = selectFeaturePresets;
  window.selectGender = selectGender;
  window.selectRacePrimary = selectRacePrimary;
  window.selectRace = selectRace;
  window.selectHairColor = selectHairColor;
  window.selectTattooColor = selectTattooColor;
  window.randomChar = randomChar;

  const run = () => {
    if (!ensureCanvas()) return;
    randomChar();
  };

  if (document.readyState === 'complete' || document.readyState === 'interactive') {
    setTimeout(run, 0);
  } else {
    window.addEventListener('DOMContentLoaded', run, { once: true });
  }
}
// ---- Named exports for React clients (safe guards for SSR) ----
export const onRandom = () => {
  if (typeof window !== 'undefined') randomChar();
};

export const onPermute = () => {
  if (typeof window !== 'undefined') permute();
};

export const onFeatureChange = (category, dir) => {
  if (typeof window !== 'undefined') selectFeaturePresets(category, dir);
};

export const onSelectGender = (g) => {
  if (typeof window !== 'undefined') selectGender(g);
};

export const onSelectRacePrimary = (dir) => {
  if (typeof window !== 'undefined') selectRacePrimary(dir);
};

export const onSelectRace = (dir) => {
  if (typeof window !== 'undefined') selectRace(dir);
};
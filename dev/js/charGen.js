let canvas = document.getElementById("canvas");
let ctx = canvas.getContext('2d');

ctx.scale(12, 12);
ctx.imageSmoothingEnabled = false;

var loadedImages = [];
var images = [{name: 'human1', src: '../../assets/Human1.png'}, {name: 'hair1', src: '../../assets/Hair1.png'}];

preload = function(images, callback){
	var imagesLoaded = 0;

	for (var i = 0; i < images.length; i++) {
		var imgObj = new Image();

		imgObj.src = images[i].src;
		loadedImages.push(imgObj);

		imgObj.onload = function() {
			imagesLoaded++
			if(imagesLoaded === images.length) {
				callback();
			}
		};
	}
}

preload(images, function(){
	console.log('Images Preloaded.');

	for (var i = 0; i < images.length; i++) {
		ctx.drawImage(loadedImages[i], 5, 5);
		console.log('Drew ' + loadedImages[i].src);
	}

	var img = canvas.toDataURL("image/png");
	document.write('<img src="'+img+'"/><a href="'+img+'" download="derp">export png</a>');

});
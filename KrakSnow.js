/*
	KrakSnow
	Mike Perron (2014)

	A cute snow effect rendered with double-buffering on a pair of HTML5 canvases.

	In order to use this effect, you should have on your page:
		<canvas id=snowscape style="position: absolute; top: 0; left: 0; right: 0; bottom: 0; pointer-events: none"></canvas>
		<canvas id=snowscape2 style="position: absolute; top: 0; left: 0; right: 0; bottom: 0; pointer-events: none"></canvas>
*/

var KrakSnow = {
	name: 'KrakSnow',

	// An array of all the snowflakes on screen.
	flakes: [],

	// Back buffer's 2D draw context
	context: undefined,

	// Configurable parameters for the current scene.
	scene: {
		minSpeed: 20,
		maxSpeed: 100,
		sway: 50,
		size: 4,
		count: 50,
		wind_force: 30,
		wind_angle: 90,
		fps: 45
	},

	// Snowing status. Informational, do not change.
	snowing: true,

	// Interval used to queue the next frame.
	interval: undefined,

	// Which buffer is currently in use.
	drawflag: false,

	// Start the blizzard! Optionally JSON object to override default parameters.
	init: function(scene){
		if(scene)
			for(var k in scene)
				this.scene[k] = scene[k];

		this.resize();
		window.addEventListener('resize', this.resize);
		this.scene.count = parseInt(snowscape.width / 20);

		this.context = snowscape.getContext('2d');
		this.snowing = true;

		for(var i = 0; i < this.scene.count; i++)
			this.flake_make(true);

		KrakSnow.flake_update();
	},


	// Flip display and draw canvases. The "active" canvas is the back buffer.
	flip: function(){
		var active;

		if(this.drawflag){
			document.getElementById('snowscape').style['visibility'] = 'visible';

			active = document.getElementById('snowscape2');
			active.style['visibility'] = 'hidden';
		} else {
			document.getElementById('snowscape2').style['visibility'] = 'visible';

			active = document.getElementById('snowscape');
			active.style['visibility'] = 'hidden';
		}

		this.context = active.getContext('2d');
		this.drawflag = !this.drawflag;
		return active;
	},

	// Get the currently active draw surface
	get_frame: function(getBgInstead){
		var flag = (getBgInstead ? !this.drawflag : this.drawflag);

		return document.getElementById(flag ? 'snowscape2' : 'snowscape');
	},

	// Toggle snowfall visibility and animation.
	toggle: function(){
		var snowscape = KrakSnow.get_frame(false);
		var snowscape2 = KrakSnow.get_frame(true);

		if(KrakSnow.snowing){
			KrakSnow.snowing = false;
			snowscape.style.display = snowscape2.style.display = 'none';
			clearInterval(KrakSnow.interval);
		} else {
			KrakSnow.snowing = true;
			snowscape.style.display = snowscape2.style.display = 'block';
			KrakSnow.flake_update();
		}
	},

	// Adjust the canvas, based on the size of the window
	resize: function(){
		// Resize foreground
		var snowscape = KrakSnow.get_frame();
		snowscape.width = KrakSnow.scene.w = document.documentElement.clientWidth;
		snowscape.height = KrakSnow.scene.h = document.documentElement.clientHeight;

		// Resize background
		snowscape = KrakSnow.get_frame(true);
		snowscape.width = KrakSnow.scene.w;
		snowscape.height = KrakSnow.scene.h;

		KrakSnow.scene.count = parseInt(snowscape.width / 40);
	},

	// Produce a new random snow flake
	flake_make: function(randomY){
		var fill = parseInt(Math.random() * 0xEF + 0x10).toString(16);
		fill = '#' + fill + fill + fill;

		this.flakes.push({
			cx: Math.random() * this.scene.w,
			cy: randomY ? (Math.random() * this.scene.h) : -this.scene.size,
			r: Math.random() * this.scene.size,
			speed: Math.random() * (this.scene.maxSpeed - this.scene.minSpeed) + this.scene.minSpeed,
			offset: Math.random() * 2 * Math.PI,
			amplitude: Math.random() * this.scene.sway,
			fill: fill
		});
	},

	// Erase the old flake position, adjust the parameters of the flake, and draw again.
	flake_update: function(newTime){
		var ctx = this.context;
		var flakes = this.flakes;
		var height = this.scene.h;
		var width = this.scene.w;
		var wind_angle = this.scene.wind_angle;
		var wind_force = this.scene.wind_force;

		// Calculate how long it's been since the last frame in seconds.
		if(!newTime)
			newTime = window.performance.now()
		var time = (this.lastUpdateTime ? ((newTime) - this.lastUpdateTime) : 0) / 1000;
		this.lastUpdateTime = newTime;

		// Prevent doubling by clearing the timeout.
		if(this.interval)
			clearTimeout(this.interval);

		// No flakes at all! Create a new array.
		if(!flakes)
			flakes = [];

		// Calculate the X-axis variance caused by sinusoidal sway.
		var sway = function(flake){
			var x = flake.cx;

			x += Math.sin(flake.offset + flake.cy / 100) * flake.amplitude;

			// Wrap the flakes on the east/west edges of the screen.
			if(x > (width + (2 * flake.r)))
				x -= (width + (4 * flake.r));
			else if(x < (-2 * flake.r))
				x += width + (4 * flake.r);

			return x;
		};

		// Clear the current frame.
		ctx.clearRect(0, 0, this.scene.w, this.scene.h);

		var angle = wind_angle / 180 * Math.PI;
		flakes.forEach(function(flake, index, array){
			// fall
			flake.cy += (flake.speed + Math.cos(angle) * wind_force) * time;
			flake.cx += (Math.random() + Math.sin(angle) * wind_force) * time;

			if(flake.cy > (height + flake.r * 2))
				// Kill off-screen flakes.
				array.splice(index, 1);
			else {
				// draw
				ctx.beginPath();
				ctx.arc(sway(flake), flake.cy, flake.r, 0, 2 * Math.PI);
				ctx.fillStyle = flake.fill;
				ctx.fill();
			}
		});

		// Make flakes to account for those that reached the bottom and died.
		var toMake = this.scene.count - this.flakes.length;
		while(toMake-- > 0)
			this.flake_make();

		this.flakes = flakes;

		// Show what we drew by flipping front and back buffers.
		this.flip();

		// Queue up the next frame.
		this.interval = setTimeout(function(){
			window.requestAnimationFrame(KrakSnow.flake_update.bind(KrakSnow));
		}, 1000 / this.scene.fps);
	},
};

// Start the snow effect immediately.
window.addEventListener('load', KrakSnow.init.bind(KrakSnow));

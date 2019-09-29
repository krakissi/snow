/*
	KrakSnow
	Mike Perron (2014)

	A cute snow effect rendered with double-buffering on a pair of HTML5 canvases.

	Import this script as a module:
		<script type=module src="js/KrakSnow.js"></script>

	Anywhere on the page, place a krak-snow element:
		<krak-snow></krak-snow>

	Adjust the color by passing in r, g, and b attributes as a percentage. The
	default is 100%. Example, green flakes:
		<krak-snow r=0 b=0></krak-snow>
*/

export default function Snow(config){
	var krakSnow = {
		name: 'KrakSnow',

		// An array of all the snowflakes on screen.
		flakes: [],

		// Back buffer's 2D draw context
		context: undefined,

		// Handle to each of the frame buffers (canvas elements).
		buffers: [],

		// Configurable parameters for the current scene.
		scene: {
			intensity: 100,
			minSpeed: 20,
			maxSpeed: 100,
			sway: 50,
			size: 4,
			wind_force: 30,
			wind_angle: 90,
			fps: 45,

			// 0-1 float to tune color
			red: 1,
			green: 1,
			blue: 1
		},

		// Snowing status. Informational, do not change.
		snowing: true,

		// Interval used to queue the next frame.
		interval: undefined,

		// Which buffer is currently in use.
		drawflag: false
	};

	for(let k in config)
		if(config.hasOwnProperty(k))
			krakSnow[k] = config[k];

	for(let k in krakSnow)
		this[k] = krakSnow[k];
};
Snow.prototype = {
	init: function(){
		this.resize();
		window.addEventListener('resize', this.resize.bind(this));

		this.context = this.buffers[0].getContext('2d');
		this.snowing = true;

		for(var i = 0; i < this.scene.count; i++)
			this.flake_make(true);

		this.flake_update();
	},

	// Flip display and draw canvases. The "active" canvas is the back buffer.
	flip: function(){
		this.buffers[(this.drawflag ? 0 : 1)].style['visibility'] = 'visible';

		var active = this.buffers[(this.drawflag ? 1 : 0)];
		active.style['visibility'] = 'hidden';

		this.context = active.getContext('2d');
		this.drawflag = !this.drawflag;
		return active;
	},

	// Toggle snowfall visibility and animation.
	toggle: function(){
		var snowscape = this.buffers[0];
		var snowscape2 = this.buffers[1];

		if(this.snowing){
			this.snowing = false;
			snowscape.style.display = snowscape2.style.display = 'none';
			clearInterval(this.interval);
		} else {
			this.snowing = true;
			snowscape.style.display = snowscape2.style.display = 'block';
			this.flake_update();
		}
	},

	// Adjust the canvas, based on the size of the window
	resize: function(){
		// Resize foreground
		var snowscape = this.buffers[(this.drawflag ? 0 : 1)];
		snowscape.width = this.scene.w = document.documentElement.clientWidth;
		snowscape.height = this.scene.h = document.documentElement.clientHeight;

		// Resize background
		snowscape = this.buffers[(this.drawflag ? 1 : 0)];
		snowscape.width = this.scene.w;
		snowscape.height = this.scene.h;

		this.scene.count = parseInt(((snowscape.width / 40) + (snowscape.height / 60)) * (this.scene.intensity / 100));
	},

	// Produce a new random snow flake
	flake_make: function(randomY){
		var fill = parseInt(Math.random() * 0xEF);
		fill = ('#' +
			(fill * this.scene.red + 0x10).toString(16) +
			(fill * this.scene.green + 0x10).toString(16) +
			(fill * this.scene.blue + 0x10).toString(16)
		);

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
			newTime = window.performance.now();
		var time = ((this.lastUpdateTime ?
			((newTime) - this.lastUpdateTime) :
			0
		) / 1000);
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
		this.flakes = flakes.filter(flake => {
			// fall
			flake.cy += (flake.speed + Math.cos(angle) * wind_force) * time;
			flake.cx += (Math.random() + Math.sin(angle) * wind_force) * time;

			// Kill off-screen flakes.
			if(flake.cy > (height + flake.r * 2))
				return false;

			// draw
			ctx.beginPath();
			ctx.arc(sway(flake), flake.cy, flake.r, 0, 2 * Math.PI);
			ctx.fillStyle = flake.fill;
			ctx.fill();

			return true;
		});

		// Make flakes to account for those that reached the bottom and died.
		var toMake = this.scene.count - this.flakes.length;
		while(toMake-- > 0)
			this.flake_make();

		// Show what we drew by flipping front and back buffers.
		this.flip();

		// Queue up the next frame.
		{
			var me = this;

			me.interval = setTimeout(function(){
				window.requestAnimationFrame(me.flake_update.bind(me));
			}, 1000 / me.scene.fps);
		}
	}
};

class KrakSnow extends HTMLElement {
	constructor(){
		super();

		var style = document.createElement('style');
		style.textContent = `
			canvas {
				position: fixed;
				top: 0;
				right: 0;
				bottom: 0;
				left: 0;
				z-index: 9001;

				pointer-events: none;
			}
		`;

		// Create canvas elements and pass into KrakSnow
		let buffers = [
			document.createElement('canvas'),
			document.createElement('canvas')
		];

		// Attach elements to the page.
		const shadow = this.attachShadow({ mode: 'closed' });
		shadow.appendChild(style);
		shadow.appendChild(buffers[0]);
		shadow.appendChild(buffers[1]);

		// Get color adjustments (as a percentage 0-100)
		var red = (this.hasAttribute('r') ? parseInt(this.getAttribute('r')) : 100);
		var green = (this.hasAttribute('g') ? parseInt(this.getAttribute('g')) : 100);
		var blue = (this.hasAttribute('b') ? parseInt(this.getAttribute('b')) : 100);

		var snow = new Snow({
			buffers: buffers
		});

		snow.scene.red = (red / 100);
		snow.scene.green = (green / 100);
		snow.scene.blue = (blue / 100);

		snow.init();
	}
};

customElements.define('krak-snow', KrakSnow);

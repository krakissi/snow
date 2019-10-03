/*
	KrakSnow
	Mike Perron (2014-2019)

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
			wind_force: 50,
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
		drawflag: 0
	};

	for(let k in config)
		if(config.hasOwnProperty(k))
			krakSnow[k] = config[k];

	for(let k in krakSnow)
		this[k] = krakSnow[k];

	// Instead of binding this function later, we can define it here and keep
	// 'me' in scope.
	{
		var me = this;

		// Flip display and draw canvases. The "active" canvas is the back buffer.
		me.flip = function(){
			me.buffers[me.drawflag].style['visibility'] = 'visible';
			me.drawflag ^= 1;

			var active = me.buffers[me.drawflag];
			active.style['visibility'] = 'hidden';
			me.context = active.getContext('2d');
		};
	}
};
Snow.prototype = {
	init: function(){
		this.resize();
		window.addEventListener('resize', this.resize.bind(this));

		this.context = this.buffers[this.drawflag].getContext('2d');
		this.snowing = true;

		for(var i = 0; i < this.scene.count; i++)
			this.flakes.push(this.flake_make(true));

		this.flake_update();
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

		localStorage.setItem('KrakSnow.snowing', this.snowing);
	},

	// Adjust the canvas, based on the size of the window
	resize: function(){
		// Resize foreground
		var snowscape = this.buffers[this.drawflag];
		snowscape.width = this.scene.w = document.documentElement.clientWidth;
		snowscape.height = this.scene.h = document.documentElement.clientHeight;

		// Resize background
		snowscape = this.buffers[(this.drawflag ^ 1)];
		snowscape.width = this.scene.w;
		snowscape.height = this.scene.h;

		this.scene.count = parseInt(((snowscape.width / 40) + (snowscape.height / 60)) * (this.scene.intensity / 100));

		// Adjust count of flakes.
		{
			let diff = (this.flakes.length - this.scene.count);

			if(diff > 0){
				// Remove excess flakes.
				this.flakes.splice(0, diff);
			} else if(diff < 0){
				// Make new flakes to fill space.
				for(var i = 0; i < -diff; i++)
					this.flakes.push(this.flake_make(true));
			}
		}
	},

	// Produce a new random snow flake
	flake_make: function(randomY){
		var fill = parseInt(Math.random() * 0xEF);

		return {
			cx: Math.random() * this.scene.w,
			cy: randomY ? (Math.random() * this.scene.h) : -this.scene.size,
			r: Math.random() * this.scene.size,
			speed: Math.random() * (this.scene.maxSpeed - this.scene.minSpeed) + this.scene.minSpeed,
			offset: Math.random() * 2 * Math.PI,
			amplitude: Math.random() * this.scene.sway,
			fill: ('#' +
				(fill * this.scene.red + 0x10).toString(16) +
				(fill * this.scene.green + 0x10).toString(16) +
				(fill * this.scene.blue + 0x10).toString(16)
			)
		};
	},

	// Calculate the X-axis variance caused by sinusoidal sway.
	sway: function(flake){
		var width = this.scene.w;
		var x = flake.cx;

		x += Math.sin(flake.offset + flake.cy / 100) * flake.amplitude;

		// Wrap the flakes on the east/west edges of the screen.
		if(x > (width + (2 * flake.r)))
			x -= (width + (4 * flake.r));
		else if(x < (-2 * flake.r))
			x += width + (4 * flake.r);

		return x;
	},

	// Erase the old flake position, adjust the parameters of the flake, and draw again.
	flake_update: function(newTime){
		var ctx = this.context;
		var height = this.scene.h;
		var wind_angle = this.scene.wind_angle;
		var wind_force = this.scene.wind_force;

		// Prevent doubling by clearing the timeout.
		if(this.interval)
			clearTimeout(this.interval);

		// Calculate how long it's been since the last frame in seconds.
		if(!newTime)
			newTime = window.performance.now();
		var time = ((this.lastUpdateTime ?
			((newTime) - this.lastUpdateTime) :
			0
		) / 1000);
		this.lastUpdateTime = newTime;

		// Clear the current frame.
		ctx.clearRect(0, 0, this.scene.w, this.scene.h);

		var angle = wind_angle / 180 * Math.PI;
		for(let i = 0, len = this.flakes.length; i < len; i++){
			let flake = this.flakes[i];

			// fall
			flake.cy += (flake.speed + Math.cos(angle) * wind_force) * time;
			flake.cx += (Math.random() + Math.sin(angle) * wind_force) * time;

			if(flake.cy > (height + flake.r * 2)){
				// Replace this flake if it fell off screen.
				this.flakes[i] = this.flake_make();
			} else {
				// Draw the flake.
				ctx.beginPath();
				ctx.arc(this.sway(flake), flake.cy, flake.r, 0, 2 * Math.PI);
				ctx.fillStyle = flake.fill;
				ctx.fill();
			}
		}

		{
			var me = this;

			// Show what we drew by flipping front and back buffers.
			window.requestAnimationFrame(me.flip);

			// Queue up the next frame.
			me.interval = setTimeout(function(){
				me.flake_update();
			}, 1000 / me.scene.fps);
		}
	}
};

class KrakSnow extends HTMLElement {
	set intensity(val){
		this.snow.scene.intensity = val;
		this.snow.resize();
	}
	get intensity(){
		return this.snow.scene.intensity;
	}

	set r(val){
		this.snow.scene.red = (parseInt(val) / 100);
	}
	get r(){
		return Math.floor(this.snow.scene.red * 100);
	}
	set g(val){
		this.snow.scene.green = (parseInt(val) / 100);
	}
	get g(){
		return Math.floor(this.snow.scene.green * 100);
	}
	set b(val){
		this.snow.scene.blue = (parseInt(val) / 100);
	}
	get b(){
		return Math.floor(this.snow.scene.blue * 100);
	}

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

			/* For the 'toggle' link. */
			a {
				background-color: black;
				color: white;
				padding: 4px;
				border-radius: 3px;;
			}
			a:hover {
				cursor: pointer;
				color: yellow;
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

		var snow = this.snow = new Snow({
			buffers: buffers
		});

		// Parse effect configuration from attributes.
		{
			let attrOrDefault = function(attr, def){
				let val = this.getAttribute(attr);

				return ((val === null) ? def : val);
			}.bind(this);

			// Get color adjustments (as a percentage 0-100)
			snow.scene.red = parseInt(attrOrDefault('r', 100)) / 100;
			snow.scene.green = parseInt(attrOrDefault('g', 100)) / 100;
			snow.scene.blue = parseInt(attrOrDefault('b', 100)) / 100;

			// Affects the number of flakes on screen at any given time.
			snow.scene.intensity = parseInt(attrOrDefault('intensity', 100));
		}

		// Start the effect.
		snow.init();

		// Show a "Toggle Snow" link if the toggle attribute is set.
		if(this.hasAttribute('toggle')){
			var toggleElement = document.createElement('a');

			toggleElement.textContent = 'Toggle Snow';
			toggleElement.addEventListener('click', function(){
				snow.toggle();
			});

			shadow.appendChild(toggleElement);
		}

		// If the element has the hidden attribute, or the user has hidden the
		// effect before, we'll hide it by default.
		if(this.hasAttribute('notsnowing') || (this.hasAttribute('toggle') && (localStorage.getItem('KrakSnow.snowing') === 'false')))
			snow.toggle();
	}
};

customElements.define('krak-snow', KrakSnow);

KrakSnow
--------

A cute snow effect for your page. Extremely configurable (keep reading).

Mike Perron (2014-2019)

Usage
-----

You should include this source file:
```
	<script type=module src=KrakSnow.js></script>
```

Somewhere in your page body:
```
	<krak-snow></krak-snow>
```


Configurable Attributes
-----------------------

You may set these attributes when creating the element (see examples below), or
programmatically in javascript at any time (except those that "only apply on
creation").

- `notsnowing`: If this attribute is present, the snow effect will be hidden by default. This ignores the user preference. Only applies on creation.

- `toggle`: Render a clickable link in the <krak-snow> element which shows/hides the snow effect. Clicking the link will store the user's preference locally. Only applies on creation.

- `intensity`: (default 100) Percentage of flake density. Try 200, 500, etc. for more flakes.

- `r`: (default 100) Percentage of red in flakes.
- `g`: (default 100) Percentage of green in flakes.
- `b`: (default 100) Percentage of blue in flakes.

- `flakesize`: (default 4) Scaling factor for the size of the flakes.

- `minspeed`: (default 20) Speed of the slowest flakes.
- `maxspeed`: (default 100) Speed of the fastest flakes.

- `sway`: (default 50) Scaling factor for the amplitude of sinusoidal sway in each flake's path.

- `windforce`: (default 30) Strength of prevailing winds. This affects the speed and direction of flakes.
- `windangle`: (default 90) Angle of prevailing winds. 90 is toward the right side of the screen, 0 is down, and -90 is left.

- `fps`: (default 45) Maximum screen buffer flips per second. Reduce this number to reduce client CPU load (values below 24 not recommended).


Example
-------

For green snow that the user can toggle off:

```
	<krak-snow r=0 b=0 toggle></krak-snow>
```

For a big blizzard:
```
	<krak-snow intensity=1000></krak-snow>
```

Heavy rain or hail can be achieved with no sway, high speed, and small flakes:
```
	<krak-snow sway=0 windforce=200 windangle=-90 flakesize=2 intensity=600 maxspeed=1000 minspeed=500></krak-snow>
```

Nightmare screen distortion/static effect:
```
	<krak-snow intensity=500 flakesize=2 windangle=-90 windforce=10000></krak-snow>
```

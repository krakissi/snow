KrakSnow
--------

A cute snow effect for your page. Read the comments in the javascript
source for more information about using this.

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

- `intensity`: Percentage of flake density (default 100). Try 200, 500, etc. for more flakes.

- `r`: Percentage of red in flakes (default 100)
- `g`: Percentage of green in flakes (default 100)
- `b`: Percentage of blue in flakes (default 100)

- `notsnowing`: If this attribute is present, the snow effect will be hidden by default. This ignores the user preference. Only applies on creation.

- `toggle`: Render a clickable link in the <krak-snow> element which shows/hides the snow effect. Clicking the link will store the user's preference locally. Only applies on creation.


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

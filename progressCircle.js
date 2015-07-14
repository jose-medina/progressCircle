
/**
 * @author: Jose Luis Medina Burgos
 */
(function (window, document) {
	'use strict';

	/*-
	 * progress circle module:
	-*/
	var ProgressCircle = function (el, options) {
		this.defaults = {
			// canvas
			width: 100,
			height: 100,
			defaultColor: '#fff',
			// item options
			canvasClass: "progress-circle",
			// animation parameters
			animation: true,
			animationTime: 1000
		};

		if (!el) {
			throw new Error('No Node El defined');
		}

		this.el = el;
		// set options from defaults, options from javascript and from the Node Element
		options = this.Utils.extend(this.Utils.getOptionsFromEl(el), options ? options : {});
		this.options = this.Utils.extend(this.defaults, options);
		// 
		this._initialize();
	}

	ProgressCircle.prototype = {
		/*-
		 * query the important elements from this module and
		 * bind the event listeners 
		-*/
		_initialize: function() {	
			this.id = Math.random().toString(32).slice(2).substr(0, 5);
			this.progress = 0;

			this.width = 100;//this.el.offsetWidth;
			this.height = 100;//this.el.offsetHeight;

			this.counter = 0;
			this.startTheta = - Math.PI / 2;
			this.endTheta = this.startTheta + Math.PI * 2;
			// get current theme colors
			this._getElThemeColors();
			this.gradient = this._createGradient(this.startTheta);
			this._calculateProgress();

			this._canvas();
			// this._renderGradient(true);
		},
		/*-
		 * clear progress circle
		-*/
		clearCanvas: function() {
			// clear canvas
			this.context.clearRect(0, 0, this.width, this.height);
		},
		/*-
		 * refresh progress circle from outside the widget
		-*/
		refresh: function() {
			// clear canvas
			this.clearCanvas();
			this._getElThemeColors();
			this._calculateProgress();
			this._renderGradient(true);
		},
		/*-
		 * _canvas
		-*/
		_canvas: function(o) {
			this.canvas = document.createElement("canvas");
			this.canvas.setAttribute('id', this.id);
			this.canvas.setAttribute('width', this.width);
			this.canvas.setAttribute('height', this.height);
			this.canvas.setAttribute('class', this.options.canvasClass);
			this.el.appendChild(this.canvas);

			this.context = this.canvas.getContext("2d");
			this.context.imageSmoothingEnabled = false;
		},
		/**
		 *
		 */
		_getElThemeColors: function() {
			// get colors
			var that = this,
				themeColors = ['#0000FF', '#00FF00', '#FF0000'];

			this.colors = [];

			themeColors.forEach(function (hexColor) {
				that.colors.push(that._hexToRgb(hexColor));
			});
		},
		/**
		 * define the gradients
		 **/
		_createGradient: function(start, end, radius) {
			// colors
			var n = this.colors.length,
				i = 0,
				// interpolation parameters
				theta = 0,
				increment = Math.PI / 360,
				interpolation = 0,
				section = Math.PI * 2 / n,
				sectionStart,
				// gradient
				gradient = [];

			for (; i < n; i++) {
				// start and end angle of a section
				sectionStart = start + section * i;
				// section - increment avoid overlaping
				for (; theta < section - increment; theta += increment) {
					interpolation = theta / section;
					gradient[parseFloat(theta + sectionStart)] = this._interpolateRGBHelper(this.colors[i], this.colors[(i + 1) % n], interpolation);					
				}
				theta = 0;
			}

			return gradient;
		},
		_renderGradient: function(from, to) {
			var that = this,
				clockWise = from < to,
				gradientLength = this.gradient.length,
				// gradient = this._createGradient(this.startTheta),
			// show progress
				keys = this._gradientSortHelper(this.gradient.slice(Math.floor(gradientLength * from), Math.floor(gradientLength * to)), clockWise),
				length = keys.length,
				i = length - 1;

			this.Utils.delayLoop({
				iteration: length - 1,
				length: length,
				hasNext: function (iteration) {
					return iteration > 0;
				},
				nextIteration: function (iteration) {
					return iteration - 1;
				},
				actionOnLoop: this._drawLine.bind(this),
				actionOpts: {keys}
			});
		},
		_drawLine: function(options) {//, isProgress) {
			var theta = options.keys[options.iteration],
				// params: radius, theta
				outterCoord = this._polarCoordinatesHelper(this.width / 2, theta),
				// params: innerRadius, theta
				innerCoord = this._polarCoordinatesHelper(0, theta),
				color = this.gradient[theta],
				//opacity = isProgress && ((length - iteration) / length) <= this.progress ? 1 : 0.3;
				opacity = 1;

			this.context.save();
			this.context.beginPath();

			this.context.strokeStyle = this._getRGBString(color, opacity);
			this.context.moveTo(outterCoord.x, outterCoord.y);
			this.context.lineTo(innerCoord.x, innerCoord.y);
			this.context.lineWidth = 0;
			this.context.stroke();
		},
		/**
		 * sort gradient helper
		 */
		_gradientSortHelper: function(array, clockWise) {
			// Somewhere reusable
			function sort(a, b) {
				var anum = parseFloat(a),
					bnum = parseFloat(b);
				return clockWise ? anum - bnum : bnum - anum;
			}

			return Object.keys(array).sort(sort);
		},
		/**
		 * Interpolate colors
		 */
		_interpolateRGBHelper: function(color1, color2, p) {
			return {
				r: Math.floor(color1.r * (1 - p) + color2.r * p),
				g: Math.floor(color1.g * (1 - p) + color2.g * p),
				b: Math.floor(color1.b * (1 - p) + color2.b * p)
			}
		},
		/**
		 * Interpolate colors
		 */
		_polarCoordinatesHelper: function(radius, theta) {
			var cX = this.width / 2;
			var cY = cX;

			return {
				x: cX + radius * Math.cos(theta),
				y: cY + radius * Math.sin(theta)
			}
		},
		/**
		 * hexadecimal to rgb colors
		 */
		_hexToRgb: function(hex) {
			var result = hex.length > 4 ?
							/^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex)
						:
							/^#?([a-f\d]{1})([a-f\d]{1})([a-f\d]{1})$/i.exec(hex);
			return result ? {
				r: parseInt(result[1], 16),
				g: parseInt(result[2], 16),
				b: parseInt(result[3], 16)
			} : null;
		},
		/*-
		 *
		-*/
		_calculateProgress: function() {
			// date calculation
			var endDate = parseInt(this.el.getAttribute("data-enddate"));
			endDate = new Date(endDate);
			var now = new Date();
			var day = 3600 * 24 * 1000;
			var diff = Math.round(parseFloat((endDate.setHours(0, 0, 0) - now.setHours(0, 0, 0)) / day));
			// progress parameters
			this.progress = (diff <= 14 && diff >= 0) ? (14 - diff) / 14 * 0.75 + 0.25 : 0.25;
		},
		/*-
		 * _getHexColor
		-*/
		_getRGBString: function(object, opacity) {
			return "rgba(" + object.r + ", " + object.g + ", " + object.b + ", " + opacity + ")";
		},
		getProgress: function () {
			return this.progress;
		},
		/**
		 * set progress from 0 till 1
		 */
		setProgress: function (progress) {
			this._renderGradient(this.progress, progress);
		}
	};

	ProgressCircle.prototype.Utils = {
		extend: function (a, b) {
			var key;

			for (key in b) {
				if (b.hasOwnProperty(key)) {
					a[key] = b[key];
				}
			}

			return a ? a : (b ? b : undefined);
		},
		getOptionsFromEl: function (el) {
			try {
				var options = el.getAttribute('data-progresscircle');
				return options ? JSON.parse(options) : {};
			} catch (error) {
				throw new Error('Options format is not correct');
			}
		},
		delayLoop: function (options) {
			var that = this,
				defaults = {
					iterationRate: 5,
					hasNext: function (iteration) {
						return iteration > 0;
					},
					nextIteration: function (iteration) {
						return iteration - 1;
					}
				},
				options = that.extend(defaults, options),
				tillIteration = function (iteration) {
					return (iteration - options.iterationRate) > 0 ? (iteration - options.iterationRate) : 0;
				},
				iteration = options.iteration,
				drawTill = tillIteration,
				loop;

			loop = function () {
				setTimeout(function() {
					while (iteration >= drawTill) {
						options.actionOnLoop(that.extend(options.actionOpts, {iteration: iteration, length: length}));
						iteration = options.nextIteration(iteration);
					}
					
					if (options.hasNext(iteration)) {
						drawTill = tillIteration(iteration);
						loop();
					}
				}, 0);
			}

			loop();
		}
	};

	window.ProgressCircle = ProgressCircle;

})(window, window.document);

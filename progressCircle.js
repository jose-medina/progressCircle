
/**
 * @author: Jose Luis Medina Burgos
 */
(function (window, document) {
	'use strict';

	/**
	 * ProgressCircle
	 * @param {object} el - progress circle dom node
	 * @param {object} options - options object.
	 */
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
		/**
		 * Initialize the module
		 */
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

			this._canvas();
			// this._renderGradient(true);
		},
		/**
		 * clear progress circle
		 */
		_clearCanvas: function() {
			// clear canvas
			this.context.clearRect(0, 0, this.width, this.height);
		},
		/**
		 * reset progress circle from
		 */
		reset: function() {
			// clear canvas
			this._clearCanvas();
			this.progress = 0;
		},
		/**
		 * create the canvas
		 */
		_canvas: function() {
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
		 * get colors
		 * @todo: get them from options
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
		 * create the gradient
		 * @param {number} start - the point from where the gradient values is goint to be calculated
		 * @returns {object|Array}
		 */
		_createGradient: function(start) {
			// colors
			var n = this.colors.length,
				i = 0,
				// interpolation parameters
				theta = 0,
				increment = Math.PI / 360,
				section = Math.PI * 2 / n,
				sectionStart,
				// gradient
				gradient = [];

			for (; i < n; i++) {
				// start and end angle of a section
				sectionStart = start + section * i;
				// section - increment avoid overlaping
				for (; theta < section - increment; theta += increment) {
					gradient.push({
						// @params: colorCurrentSection, colorNextSection, interpolation
						color: this._interpolateRGBHelper(this.colors[i], this.colors[(i + 1) % n], theta / section),
						theta: parseFloat(theta + sectionStart)
					});
				}
				theta = 0;
			}

			return gradient;
		},
		/**
		 * render gradient. Performs animation
		 * @param {number} from - the point from where the gradient values is goint to be calculated
		 * @param {number} to - the point from where the gradient values is goint to be calculated
		 * @param {boolean} clockwise - clockwise if true, anticlockwise if false
		 */
		_renderGradient: function(from, to, clockwise) {
			var that = this,
				gradientLength = this.gradient.length,
				from = 	clockwise ? from : Math.abs(from - 1),
				to = 	clockwise ? to : Math.abs(to - 1),
				fromIndex = from < to ? from : to,
				tillIndex = from < to ? to : from,
				// show progress
				subset = this.gradient.slice(Math.floor(gradientLength * fromIndex), Math.floor(gradientLength * tillIndex)),
				length = subset.length;

			this.delayLoop(function (loop) {
				var elem = subset[loop.iteration];
				this._drawLine(elem.theta, elem.color);
			}, {
				iteration: clockwise ? 0 : length - 1,
				length: length,
				clockwise: clockwise,
				done: function () {
					this.progress = to;
				}
			});
		},
		/**
		 * draw line of the gradient
		 * @param {function} actionOnLoop - actions to be done in every iteration
		 * @param {object} options - loop options
		 */
		_drawLine: function(theta, color) {//, isProgress) {
			// params: radius, theta
			var outterCoord = this._polarCoordinatesHelper(this.width / 2, theta),
				// params: innerRadius, theta
				innerCoord = this._polarCoordinatesHelper(0, theta),
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
		 * delay loop
		 * @param {function} actionOnLoop - actions to be done in every iteration
		 * @param {object} options - loop options
		 */
		delayLoop: function (actionOnLoop, options) {
			var that = this,
				loop,
				defaults = {
					iterationRate: 5,
					iteration: 0,
					length: 0,
					clockwise: true,
					speed: 10
				},
				options = this.Utils.extend(defaults, options),
				iteration = options.iteration,
				drawTill = this._tillIterationIndex.call(options, iteration);

			loop = function () {
				setTimeout(function() {
					while (that._hasNextIteration.call(options, iteration, drawTill)) {
						actionOnLoop.call(that, {iteration: iteration, length: options.length});
						iteration = that._nextIteration.call(options, iteration);
					}
					
					if (that._hasNextLoop.call(options, iteration)) {
						drawTill = that._tillIterationIndex.call(options, iteration);
						loop();
					} else {
						options.done.call(that);
					}
				}, options.speed);
			}
			// first iteration
			loop();
		},
		/**
		 * delay loop helper
		 * @param {number} iteration - current iteration index
		 * @param {number} - index till where the while can run 
		 */
		_tillIterationIndex: function (iteration) {
			return this.clockwise ? 
				((iteration + this.iterationRate) < this.length ? (iteration + this.iterationRate) : this.length - 1)
					:
				((iteration - this.iterationRate) > 0 ? (iteration - this.iterationRate) : 0);
		},
		/**
		 * delay loop helper
		 * @param {number} iteration - current iteration index
		 * @param {number} drawTill - index till where the while can run 
		 * @returns {boolean} - if internal while has next iteration 
		 */
		_hasNextIteration: function (iteration, drawTill) {
			return this.clockwise ? iteration < drawTill : iteration >= drawTill;
		},
		/**
		 * delay loop helper
		 * @param {number} iteration - current iteration index
		 * @returns {boolean} - if delay loop has next iteration 
		 */
		_hasNextLoop: function (iteration) {
			return this.clockwise ? iteration < this.length - 1 : iteration > 0;
		},
		/**
		 * delay loop helper
		 * @param {number} iteration - current iteration index
		 * @returns {number} - next iteration index
		 */
		_nextIteration: function (iteration) {
			return this.clockwise ? iteration + 1 : iteration - 1;
		},
		/**
		 * interpolate colors
		 * @param {object} color1 - rgb color
		 * @param {object} color2 - rgb color
		 * @returns {object} - rgb color interpolation
		 */
		_interpolateRGBHelper: function(color1, color2, p) {
			return {
				r: Math.floor(color1.r * (1 - p) + color2.r * p),
				g: Math.floor(color1.g * (1 - p) + color2.g * p),
				b: Math.floor(color1.b * (1 - p) + color2.b * p)
			}
		},
		/**
		 * _polarCoordinatesHelper
		 * @param {number} radius
		 * @param {number} theta
		 * @returns {object}
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
		 * _hexToRgb
		 * @param {number} hex
		 * @returns {object}
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
		/**
		 * _getRGBString
		 * @param {object} object
		 * @param {opacity} number
		 * @returns {string}
		 */
		_getRGBString: function(object, opacity) {
			return "rgba(" + object.r + ", " + object.g + ", " + object.b + ", " + opacity + ")";
		},
		/**
		 * get progress
		 * @returns {number}
		 */
		getProgress: function () {
			return this.progress;
		},
		/**
		 * set progress
		 * @param {number} progress
		 * @param {boolean} clockwise
		 */
		setProgress: function (progress, clockwise) {
			this._renderGradient(this.progress, progress, clockwise);
		}
	};
	/**
	 * Utils
	 */
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
		}
	};

	window.ProgressCircle = ProgressCircle;

})(window, window.document);

'use strict';

// `requestAnimationFrame` polyfill

(function () {
  var vendors = ['webkit', 'moz', 'ms', 'o'];

  vendors.forEach(function (vendor) {
    window.requestAnimationFrame = window.requestAnimationFrame ||
      window[vendor + 'RequestAnimationFrame'];
  });

  if (!window.requestAnimationFrame) {
    var lastTime = 0;
    window.requestAnimationFrame = function (callback) {
      var currTime = Date.now();
      var timeToCall = Math.max(0, 16 - (currTime - lastTime));
      var id = window.setTimeout(function () { callback(currTime + timeToCall); }, timeToCall);
      lastTime = currTime + timeToCall;
      return id;
    };
  }
})();

// Helpers

var slice = Array.prototype.slice;

var bind = function (func, context) {
  var args = slice.call(arguments, 2);
  return function () {
    func.apply(context, args.concat(slice.call(arguments)));
  };
};

var bindAll = function (context) {
  slice.call(arguments, 1).forEach(function (func) {
    context[func] = bind(context[func], context);
  });
};

var clamp = function (num, min, max) {
  return Math.min(Math.max(num, min), max);
};

var clone = function (arr) {
  return arr.slice(0);
};

var extend = function (obj) {
  slice.call(arguments, 1).forEach(function (source) {
    for (var prop in source) {
      if (source.hasOwnProperty(prop)) {
        obj[prop] = source[prop];
      }
    }
  });

  return obj;
};

// Grid

var defaults = {
  width:        640,
  height:       480,
  rows:         10,
  cols:         20,

  incRadius:    5,
  decRadius:    0.25,

  idleDuration: 5000,
  idlePeriod:   100,

  colors:       ['#333', '#666', '#999']
};

module.exports = {
  init: function (canvas, options) {
    bindAll(this, 'onResize', 'onMove');

    this.initOptions(extend({}, defaults, options));
    this.initCanvas(canvas);
    this.buildCircles();

    window.addEventListener('resize', this.onResize, false);
    this.canvas.addEventListener('mousemove', this.onMove, true);
    this.canvas.addEventListener('touchmove', this.onMove, true);
  },

  refresh: function () {
    this.clearCanvas();
    this.drawCircles();
    this.decreaseCircles();
  },

  start: function () {
    var that = this;

    (function step() {
      that.refresh();
      window.requestAnimationFrame(step);
    })();

    this.resetIdleTimeout();
  },

  initOptions: function (options) {
    this.width        = options.width;
    this.height       = options.height;
    this.rows         = options.rows;
    this.cols         = options.cols;
    this.incRadius    = options.incRadius;
    this.decRadius    = options.decRadius;
    this.idleDuration = options.idleDuration;
    this.idlePeriod   = options.idlePeriod;
    this.colors       = options.colors;

    this.maxRadius    = Math.min(this.width / this.cols, this.height / this.rows) / 1.75;
    this.minRadius    = this.maxRadius / 4;
    this.margin       = this.maxRadius / 3;

    this.cellWidth    = (this.width  - this.margin * 2) / this.cols;
    this.cellHeight   = (this.height - this.margin * 2) / this.rows;
    this.marginWidth  = this.cellWidth  / 2 + this.margin;
    this.marginHeight = this.cellHeight / 2 + this.margin;
  },

  initCanvas: function (canvas) {
    this.canvas  = canvas;
    this.context = this.canvas.getContext('2d');

    this.devicePixelRatio  = this.getDevicePixelRatio();
    this.backingStoreRatio = this.getBackingStoreRatio();
    this.ratio = this.devicePixelRatio / this.backingStoreRatio;

    canvas.width  = this.width * this.ratio;
    canvas.height = this.height * this.ratio;
    this.context.scale(this.ratio, this.ratio);

    canvas.style.cursor = 'crosshair';
  },

  getDevicePixelRatio: function () {
    return window.devicePixelRatio || 1;
  },

  getBackingStoreRatio: function () {
    return this.context.webkitBackingStorePixelRatio ||
           this.context.mozBackingStorePixelRatio ||
           this.context.msBackingStorePixelRatio ||
           this.context.oBackingStorePixelRatio ||
           this.context.backingStorePixelRatio || 1;
  },

  clearCanvas: function () {
    this.context.clearRect(0, 0, this.width, this.height);
  },

  position: function (coords, value) {
    var pos = coords.row * this.cols + coords.col;

    if (typeof value === 'undefined') {
      return this.circles[pos];
    }
    this.circles[pos] = value;
  },

  coordinates: function () {
    var coords = [];

    for (var row = 0; row < this.rows; row++) {
      for (var col = 0; col < this.cols; col++) {
        coords.push({row: row, col: col});
      }
    }

    return coords;
  },

  unsortedCircles: function () {
    return this.circles;
  },

  sortedCircles: function () {
    return clone(this.circles).sort(function (circle1, circle2) {
      return circle1.r > circle2.r;
    });
  },

  buildCircles: function () {
    this.circles = [];

    this.coordinates().forEach(function (coords) {
      this.position(coords, this.buildCircle(coords));
    }, this);
  },

  buildCircle: function (coords) {
    return {
      x:      coords.col * this.cellWidth  + this.marginWidth,
      y:      coords.row * this.cellHeight + this.marginHeight,
      radius: this.minRadius,
      color:  this.colors[Math.floor(Math.random() * this.colors.length)]
    };
  },

  drawCircles: function () {
    this.sortedCircles().forEach(function (circle) {
      this.drawCircle(circle);
      this.decreaseCircle(circle);
    }, this);
  },

  drawCircle: function (circle) {
    var context = this.context;

    context.beginPath();
    context.arc(circle.x, circle.y, circle.radius, 0, Math.PI * 2, true);
    context.fillStyle = circle.color;
    context.fill();
  },

  decreaseCircles: function () {
    this.unsortedCircles().forEach(this.decreaseCircle, this);
  },

  decreaseCircle: function (circle) {
    if (circle.radius > this.minRadius) {
      circle.radius = clamp(circle.radius, this.minRadius, circle.radius - this.decRadius);
    }
  },

  increaseCircles: function () {
    this.unsortedCircles().forEach(this.increaseCircle, this);
  },

  increaseCircle: function (circle) {
    if (circle.radius < this.maxRadius) {
      circle.radius = clamp(circle.radius, circle.radius + this.incRadius, this.maxRadius);
    }
  },

  maximizeCircles: function () {
    this.unsortedCircles().forEach(this.maximizeCircle, this);
  },

  maximizeCircle: function (circle) {
    circle.radius = this.maxRadius;
  },

  runIdleAnimation: function (index) {
    var circles = this.unsortedCircles();
    var circle  = circles[index];
    this.maximizeCircle(circle);

    var next = (index + 1) % circles.length;
    this.idleTimeout = setTimeout(bind(this.runIdleAnimation, this, next), this.idlePeriod);
  },

  resetIdleTimeout: function () {
    clearTimeout(this.idleTimeout);
    this.idleTimeout = setTimeout(bind(this.runIdleAnimation, this, 0), this.idleDuration);
  },

  onResize: function () {
    this.realWidth = this.realHeight = null;
  },

  onMove: function (evt) {
    if (this.realWidth == null || this.realHeight == null) {
      this.calculateDimensions();
    }

    this.eventTouches(evt).forEach(function (touch) {
      var coords = this.eventCoords(touch);
      var circle = this.position(coords);
      this.increaseCircle(circle);
    }, this);

    this.resetIdleTimeout();
  },

  eventCoords: function (evt) {
    var x = (evt.pageX - this.offsetLeft) * this.width  / this.realWidth;
    var y = (evt.pageY - this.offsetTop)  * this.height / this.realHeight;
    x = clamp(x, 0, this.width  - 1);
    y = clamp(y, 0, this.height - 1);

    var row = Math.round((y - this.marginHeight) / this.cellHeight);
    var col = Math.round((x - this.marginWidth)  / this.cellWidth);
    row = clamp(row, 0, this.rows - 1);
    col = clamp(col, 0, this.cols - 1);

    return {row: row, col: col};
  },

  eventTouches: function (evt) {
    return (evt.touches != null) ? slice.call(evt.touches, 0) : [evt];
  },

  calculateDimensions: function () {
    var styles      = window.getComputedStyle(this.canvas, null);
    var rect        = this.canvas.getBoundingClientRect();

    var offsetLeft  = rect.left + window.pageXOffset;
    var offsetTop   = rect.top  + window.pageYOffset;
    var paddingLeft = parseInt(styles.paddingLeft,     10) || 0;
    var paddingTop  = parseInt(styles.paddingTop,      10) || 0;
    var borderLeft  = parseInt(styles.borderLeftWidth, 10) || 0;
    var borderTop   = parseInt(styles.borderTopWidth,  10) || 0;

    this.realWidth  = rect.width  - 2 * paddingLeft - 2 * borderLeft;
    this.realHeight = rect.height - 2 * paddingTop  - 2 * borderTop;
    this.offsetLeft = offsetLeft + paddingLeft + borderLeft;
    this.offsetTop  = offsetTop  + paddingTop  + borderTop;
  }
};

/*globals $*/

var _ = require('underscore');
var Backbone = require('backbone');

function LeakChecker(options) {
  this.initialize(options);
}

LeakChecker.DEFAULT_OPTIONS = {
  interval: 5000,
  gc: false
};

_.extend(LeakChecker.prototype, {

  constructor: LeakChecker,

  initialize: function(options) {
    _.extend(this, this.sanitizeOptions(options));
    this.interval = 5000;
    this.clear();
    console.warn('**** LeakyRegistery - Your best pal for backbone view memory leak detection. ****');
  },

  sanitizeOptions: function(options) {
    var defaultOptions = LeakChecker.DEFAULT_OPTIONS;
    options = _.pick(options || {}, 'interval', 'gc');
    return _.extend({}, defaultOptions, options);
  },

  start: function() {
    this._handle = setInterval(this.reportLeaks.bind(this), this.interval);
  },

  get: function(cid) {
    return this.views[cid];
  },

  register: function(view) {
    if (this.views[view.cid]) {
      console.error('View' + view.cid + 'is already registerd!');
      return;
    }

    this.views[view.cid] = view;
  },

  unregister: function(view) {
    if (!this.views[view.cid]) {
      console.error('View' + view.cid + 'is not registerd!');
      return;
    }

    delete this.views[view.cid];
  },

  reportLeaks: function() {
    console.log('checking leaky views');
    _.each(this.views, function(view) {
      view.__warnIfLeaky();
    });

    if (this.gc) {
      this.gc();
    }
  },

  clear: function() {
    this.views = {};
  },

  stop: function() {
    clearInterval(this._handle);
  },

  gc: function() {
    _.each(this.views, function(view) {
      if (view.__isLeaky()) {
        view.remove();
      }
    });
  },

  dispose: function() {
    this.stop();
    this.clear();
  }
});

var leakyRegistry = global.leakyRegistry = window.leakyRegistry = ;

function intercept(fn, after) {
  return function() {
    var val = fn.apply(this, arguments);
    after.apply(this);
    return val;
  };
}

module.exports = function init(options) {
  var leakChecker = new LeakChecker(options);

  // instrument Backbone.View#_configure
  // since we cannot override the constructor itself
  // the #_configure method invoked by the constructor is our next best choice
  Backbone.View.prototype._configure = intercept(
    Backbone.View.prototype._configure,
    function() {
      leakyRegistry.register(this);
    }
  );

  Backbone.View.prototype.remove = intercept(
    Backbone.View.prototype.remove,
    function() {
      this.__gced = true;
      console.trace('[' + this.cid + '] removed.', this);
      leakyRegistry.unregister(this);
    });

  Backbone.View.prototype.__warnIfLeaky = function() {
    if (this.__isLeaky()) {
      console.warn('[' + this.cid + '] is leaky.', this.el, this);
    }

    if(this.__isOnScreen()) {
      console.debug('[' + this.cid + '] still on screen.', this.el, this);
    }
  };

  Backbone.View.prototype.__isOnScreen = function() {
    return $.contains(document, this.el);
  };

  Backbone.View.prototype.__isLeaky = function() {
    // gc'ed already
    if(this.__gced) {
      return false;
    }

    // not gc'ed, but still attached to dom
    if (this.__isOnScreen()) {
      return false;
    }

    // not gc'ed and not on dom
    // we think this might be a leaky view
    return true;
  };

  leakChecker.start();
}

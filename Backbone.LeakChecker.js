/*globals define */

(function (root, factory) {
  'use strict';

  if (typeof exports === 'object') {
    // CommonJS
    var $ = require('jquery');
    var _ = require('underscore');
    var Backbone = require('backbone');
    module.exports = factory($, _, Backbone);
  } else if (typeof define === 'function' && define.amd) {
    // AMD
    define(['jquery', 'underscore', 'backbone'], function ($, _, Backbone) {
      return (root.returnExportsGlobal = factory($, _, Backbone));
    });
  } else {
    // Global Variables
    root.initLeakChecker = factory(root.$, root._, root.Backbone);
  }
}(this, function ($, _, Backbone) {
  'use strict';

  function LeakChecker(options) {
    this.initialize(options);
  }

  LeakChecker.DEFAULT_OPTIONS = {
    interval: 5000,
    performGC: false,
    logger: console
  };

  _.extend(LeakChecker.prototype, {

    constructor: LeakChecker,

    initialize: function(options) {
      _.extend(this, this.sanitizeOptions(options));
      this.interval = 5000;
      this.clear();
      this.logger.warn('**** Backbone.LeakChecker - Your best pal for backbone view memory leak detection. ****');
    },

    sanitizeOptions: function(options) {
      var defaultOptions = LeakChecker.DEFAULT_OPTIONS;
      options = _.pick(options || {}, 'interval', 'performGC', 'logger');
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
        this.logger.error('View' + view.cid + 'is already registered!');
        return;
      }

      this.views[view.cid] = view;
    },

    unregister: function(view) {
      if (!this.views[view.cid]) {
        this.logger.error('View' + view.cid + 'is not registered!');
        return;
      }

      delete this.views[view.cid];
    },

    reportLeaks: function() {
      this.logger.log('checking leaky views');
      _.each(this.views, function(view) {
        view.__warnIfLeaky();
      });

      if (this.performGC) {
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

  function intercept(fn, after) {
    return function() {
      var val = fn.apply(this, arguments);
      after.apply(this);
      return val;
    };
  }

  var leakChecker;

  function initLeakChecker(options) {
    if(leakChecker) {
      return leakChecker;
    }

    leakChecker = new LeakChecker(options);

    // instrument Backbone.View#_configure
    // since we cannot override the constructor itself
    // the #_configure method invoked by the constructor is our next best choice
    Backbone.View.prototype._configure = intercept(
      Backbone.View.prototype._configure,
      function() {
        leakChecker.register(this);
      }
    );

    Backbone.View.prototype.remove = intercept(
      Backbone.View.prototype.remove,
      function() {
        this.__gced = true;
        leakChecker.logger.trace('[' + this.cid + '] removed.', this);
        leakChecker.unregister(this);
      });

    Backbone.View.prototype.__warnIfLeaky = function() {
      if (this.__isLeaky()) {
        leakChecker.logger.warn('[' + this.cid + '] is leaky.', this.el, this);
      }

      if(this.__isOnScreen()) {
        leakChecker.logger.debug('[' + this.cid + '] still on screen.', this.el, this);
      }
    };

    Backbone.View.prototype.__isOnScreen = function() {
      return $.contains(document, this.el);
    };

    Backbone.View.prototype.__isLeaky = function() {
      // GC'ed already
      if(this.__gced) {
        return false;
      }

      // not GC'ed, but still attached to DOM
      if (this.__isOnScreen()) {
        return false;
      }

      // not GC'ed and not on DOM
      // we think this might be a leaky view
      return true;
    };

    leakChecker.start();
  }

  return initLeakChecker;
}));

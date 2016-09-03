'use strict';

var _ = require('lodash');

module.exports = function() {
  return [{
    name: '$lt',
    priority: 0,
    type: function(hi, value) {
      return value < hi;
    }
  }, {
    name: '$lte',
    priority: 0,
    type: function(hi, value) {
      return value <= hi;
    }
  }, {
    name: '$gt',
    priority: 0,
    type: function(lo, value) {
      return value > lo;
    }
  }, {
    name: '$gte',
    priority: 0,
    type: function(lo, value) {
      return value >= lo;
    }
  }, {
    name: '$lenLt',
    priority: 0,
    type: function(hi, value) {
      return _.isInteger((value || {}).length) && value.length < hi;
    }
  }, {
    name: '$lenLte',
    priority: 0,
    type: function(hi, value) {
      return _.isInteger((value || {}).length) && value.length <= hi;
    }
  }, {
    name: '$lenGt',
    priority: 0,
    type: function(lo, value) {
      return _.isInteger((value || {}).length) && value.length > lo;
    }
  }, {
    name: '$lenGte',
    priority: 0,
    type: function(lo, value) {
      return _.isInteger((value || {}).length) && value.length >= lo;
    }
  }, {
    name: '$keyCntLt',
    type: function(hi, value) {
      return _.isPlainObject(value) && Object.keys(value).length < hi;
    },
    priority: 0
  }, {
    name: '$keyCntLte',
    priority: 0,
    type: function(hi, value) {
      return _.isPlainObject(value) && Object.keys(value).length <= hi;
    }
  }, {
    name: '$keyCntGt',
    priority: 0,
    type: function(lo, value) {
      return _.isPlainObject(value) && Object.keys(value).length > lo;
    }
  }, {
    name: '$keyCntGte',
    priority: 0,
    type: function(lo, value) {
      return _.isPlainObject(value) && Object.keys(value).length >= lo;
    }
  }, {
    name: '$re',
    priority: 0,
    type: function(re, value) {
      return re.test(value);
    }
  }, {
    name: '$reStr',
    priority: 0,
    type: function(reStr, value) {
      return new RegExp(reStr).test(value);
    }
  }, {
    name: '$keyRe',
    priority: 0,
    type: function(re, value) {
      return _.isPlainObject(value) &&
        Object.keys(value).every(function(key) {
          return re.test(key);
        });
    }
  }, {
    name: '$keyReStr',
    priority: 0,
    type: function(reStr, value) {
      var re = new RegExp(reStr);
      return _.isPlainObject(value) &&
        Object.keys(value).every(function(key) {
          return re.test(key);
        });
    }
  }];
};

'use strict';

var _ = require('lodash');

/**
 * Ensure immutability
 */

var BUILT_IN_SPECIAL =
[{
  name: '$avro',
  priority: -1,
  type: _.noop
}, {
  name: '$in',
  priority: -Infinity,
  type: _.identity
}, {
  name: '$out',
  priority: Infinity,
  type: _.identity
}].map(Object.freeze);


var BUILT_IN_GENERIC =
[{
  name: '$avro',
  priority: -1,
  type: _.noop
}, {
  name: '$in',
  priority: -Infinity,
  type: _.identity
}, {
  name: '$out',
  priority: Infinity,
  type: _.identity
}, {
  name: '$lt',
  priority: 1,
  type: function(hi, value) {
    return value < hi;
  }
}, {
  name: '$lte',
  priority: 1,
  type: function(hi, value) {
    return value <= hi;
  }
}, {
  name: '$gt',
  priority: 1,
  type: function(lo, value) {
    return value > lo;
  }
}, {
  name: '$gte',
  priority: 1,
  type: function(lo, value) {
    return value >= lo;
  }
}, {
  name: '$lenLt',
  priority: 1,
  type: function(hi, value) {
    return _.isInteger((value || {}).length) && value.length < hi;
  }
}, {
  name: '$lenLte',
  priority: 1,
  type: function(hi, value) {
    return _.isInteger((value || {}).length) && value.length <= hi;
  }
}, {
  name: '$lenGt',
  priority: 1,
  type: function(lo, value) {
    return _.isInteger((value || {}).length) && value.length > lo;
  }
}, {
  name: '$lenGte',
  priority: 1,
  type: function(lo, value) {
    return _.isInteger((value || {}).length) && value.length >= lo;
  }
}, {
  name: '$keyCntLt',
  type: function(hi, value) {
    return _.isPlainObject(value) && Object.keys(value).length < hi;
  },
  priority: 1
}, {
  name: '$keyCntLte',
  priority: 1,
  type: function(hi, value) {
    return _.isPlainObject(value) && Object.keys(value).length <= hi;
  }
}, {
  name: '$keyCntGt',
  priority: 1,
  type: function(lo, value) {
    return _.isPlainObject(value) && Object.keys(value).length > lo;
  }
}, {
  name: '$keyCntGte',
  priority: 1,
  type: function(lo, value) {
    return _.isPlainObject(value) && Object.keys(value).length >= lo;
  }
}, {
  name: '$re',
  priority: 1,
  type: function(re, value) {
    return re.test(value);
  }
}, {
  name: '$reStr',
  priority: 1,
  type: function(reStr, value) {
    return new RegExp(reStr).test(value);
  }
}, {
  name: '$keyRe',
  priority: 1,
  type: function(re, value) {
    return _.isPlainObject(value) &&
      Object.keys(value).every(function(key) {
        return re.test(key);
      });
  }
}, {
  name: '$keyReStr',
  priority: 1,
  type: function(reStr, value) {
    var re = new RegExp(reStr);
    return _.isPlainObject(value) &&
      Object.keys(value).every(function(key) {
        return re.test(key);
      });
  }
}].map(Object.freeze);

module.exports = BUILT_IN_SPECIAL.concat(BUILT_IN_GENERIC);

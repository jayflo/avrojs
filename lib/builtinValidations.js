'use strict';

var format = require('util').format;

var _ = require('lodash');

var INTERNAL = Object.freeze(
  [{
    name: '$children',
    priority: 0,
    type: _.noop
  }, {
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
  }].map(Object.freeze)
);

var PUBLIC = Object.freeze(
  [{
    name: '$lt',
    priority: 1,
    type: function(hi, value) {
      return messageWhenFalse(
        value < hi,
        format('Value must be less than %s', hi)
      );
    }
  }, {
    name: '$lte',
    priority: 1,
    type: function(hi, value) {
      return messageWhenFalse(
        value <= hi,
        format('Value must be less than or equal to %s', hi)
      );
    }
  }, {
    name: '$gt',
    priority: 1,
    type: function(lo, value) {
      return messageWhenFalse(
        value > lo,
        format('Value must be greater than %s', lo)
      );
    }
  }, {
    name: '$gte',
    priority: 1,
    type: function(lo, value) {
      return messageWhenFalse(
        value >= lo,
        format('Value must be greater than or equal to %s', lo)
      );
    }
  }, {
    name: '$lenLt',
    priority: 1,
    type: function(hi, value) {
      return messageWhenFalse(
        intLength(value) < hi,
        format('Length must be less than %s', hi)
      );
    }
  }, {
    name: '$lenLte',
    priority: 1,
    type: function(hi, value) {
      return messageWhenFalse(
        intLength(value) <= hi,
        format('Length must be less than or equal to %s', hi)
      );
    }
  }, {
    name: '$lenGt',
    priority: 1,
    type: function(lo, value) {
      return messageWhenFalse(
        intLength(value) > lo,
        format('Length must be greater than %s', lo)
      );
    }
  }, {
    name: '$lenGte',
    priority: 1,
    type: function(lo, value) {
      return messageWhenFalse(
        intLength(value) >= lo,
        format('Length must be greater than or equal to %s', lo)
      );
    }
  }, {
    name: '$keyCntLt',
    priority: 1,
    type: function(hi, value) {
      return messageWhenFalse(
        keyCount(value) < hi,
        format('Key count must be less than %s', hi)
      );
    }
  }, {
    name: '$keyCntLte',
    priority: 1,
    type: function(hi, value) {
      return messageWhenFalse(
        keyCount(value) <= hi,
        format('Key count must be less than or equal to %s', hi)
      );
    }
  }, {
    name: '$keyCntGt',
    priority: 1,
    type: function(lo, value) {
      return messageWhenFalse(
        keyCount(value) > lo,
        format('Key count must be greater than %s', lo)
      );
    }
  }, {
    name: '$keyCntGte',
    priority: 1,
    type: function(lo, value) {
      return messageWhenFalse(
        keyCount(value) >= lo,
        format('Key count must be greater than or equal to %s', lo)
      );
    }
  }, {
    name: '$re',
    priority: 1,
    type: function(re, value) {
      return messageWhenFalse(
        re.test(value),
        format('Value \'%s\' must match regular expression %s', re)
      );
    }
  }, {
    name: '$reStr',
    priority: 1,
    type: function(reStrs, value) {
      var re = reFromStrArr(reStrs);
      return messageWhenFalse(
        re.test(value),
        format('Value \'%s\' must match regular expression %s', re)
      );
    }
  }, {
    name: '$keyRe',
    priority: 1,
    type: function(re, value) {
      var test = allKeys(value, function(key) {
        return re.test(key);
      });
      return messageWhenFalse(
        test,
        format('All keys must match regular expression %s', re)
      );
    }
  }, {
    name: '$keyReStr',
    priority: 1,
    type: function(reStrs, value) {
      var re = reFromStrArr(reStrs);
      var test = allKeys(value, function(key) {
        return re.test(key);
      });
      return messageWhenFalse(
        test,
        format('All keys must match regular expression %s', re)
      );
    }
  }].map(Object.freeze)
);

module.exports = Object.freeze({
  INTERNAL: INTERNAL,
  PUBLIC: PUBLIC
});

function messageWhenFalse(predicate, message) {
  return !predicate && message;
}

function intLength(value) {
  return _.isInteger((value || {}).length) && value.length;
}

function keyCount(value) {
  return _.isPlainObject(value) && Object.keys(value).length;
}

function reFromStrArr(strArr) {
  var reArgs = [].concat(strArr);
  return reArgs.length === 1 ?
         new RegExp(reArgs[0]) :
         new RegExp(reArgs[0], reArgs[1]);
}

function allKeys(value, cb) {
  return _.isPlainObject(value) && value.every(cb);
}

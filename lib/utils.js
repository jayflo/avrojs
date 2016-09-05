'use strict';

var _ = require('lodash');

module.exports = Object.freeze({
  fromPairs: fromPairs,
  setKeys: setKeys,
  jsonPretty: jsonPretty
});

function jsonPretty(value) {
  return JSON.stringify(value, null, 2);
}

function setKeys(obj, keys, value) {
  return keys.reduce(function(result, key) {
    return _.set(obj, [key], value);
  }, obj);
}

function fromPairs(kvArr) {
  return kvArr.reduce(function(result, kvPair) {
    result[_.head(kvPair)] = _.last(kvPair);
    return result;
  }, {});
}

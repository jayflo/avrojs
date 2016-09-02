'use strict';

var _ = require('lodash');

var builtinValidators = require('./builtinValidators');

var COMPLEX_TYPES_NAMES = Object.freeze({
  RECORD: 'record',
  ENUM: 'enum',
  ARRAY: 'array',
  MAP: 'map',
  UNION: 'union',
  FIXED: 'fixed'
});

var PRIMITIVE_TYPE_NAMES = Object.freeze({
  NULL: 'null',
  BOOLEAN: 'boolean',
  INT: 'int',
  LONG: 'long',
  FLOAT: 'float',
  DOUBLE: 'double',
  BYTES: 'bytes',
  STRING: 'string'
});

module.exports = Object.freeze({
  validate: validate
});

function validate(schema, value) {
}

/**
 * Helpers
 */

function isPrimitiveType(value) {
  return PRIMITIVE_TYPE_NAMES.hasOwnProperty(value);
}

function fromPairs(kvArr) {
  return kvArr.reduce(function(result, kvPair) {
    result[_.head(kvPair)] = _.last(kvPair);
    return result;
  }, {});
}

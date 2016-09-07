'use strict';

var _ = require('lodash');

var builtinValidations = require('./builtinValidations');
var setKeys = require('./utils').setKeys;

var COMPLEX_TYPE_NAMES = Object.freeze({
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
  COMPLEX_TYPE_NAMES: COMPLEX_TYPE_NAMES,
  PRIMITIVE_TYPE_NAMES: PRIMITIVE_TYPE_NAMES,
  COMPLEX_TYPES: Object.freeze(_.invert(COMPLEX_TYPE_NAMES)),
  PRIMITIVE_TYPES: Object.freeze(_.invert(PRIMITIVE_TYPE_NAMES)),
  RECURSABLE_TYPES: Object.freeze(setKeys({}, [
    COMPLEX_TYPE_NAMES.RECORD,
    COMPLEX_TYPE_NAMES.UNION,
    COMPLEX_TYPE_NAMES.MAP,
    COMPLEX_TYPE_NAMES.ARRAY
  ], true)),
  PUBLIC_VALIDATIONS: builtinValidations.PUBLIC,
  PUBLIC_VALIDATIONS_MAP: Object.freeze(
    builtinValidations.PUBLIC.reduce(function(result, v) {
      return _.set(result, [v.name], v);
    }, {})
  ),
  INTERNAL_VALIDATIONS: builtinValidations.INTERNAL,
  INTERNAL_VALIDATIONS_MAP: Object.freeze(
    builtinValidations.INTERNAL.reduce(function(result, v) {
      return _.set(result, [v.name], v);
    }, {})
  )
});

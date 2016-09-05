'use strict';

var _ = require('lodash');
var map = require('avro-map').map;

var validationManager = require('./validationManager');
var isValidationEntry = validationManager.isValidationEntry;
var ValidationManager = validationManager.ValidationManager;
var builtinValidations = require('./builtinValidations');

var Tree = require('./tree').Tree;

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

var AVRO_VALIDATOR_MAP = Object.freeze(fromPairs([
  [COMPLEX_TYPES_NAMES.RECORD, recordValidation],
  [COMPLEX_TYPES_NAMES.ENUM, enumValidation],
  [COMPLEX_TYPES_NAMES.ARRAY, arrayValidation],
  [COMPLEX_TYPES_NAMES.MAP, mapValidation]
]));

module.exports = Object.freeze({
  build: build
});

function treeFactory(parent, attributes) {
  return new Tree(parent, null, attributes);
}

function validationManagerFactory(initValidations) {
  return new ValidationManager(initValidations);
}

function build(schema) {
  schema = builtinValidations.concat(schema);

  return map(schema, function(parent, entry, keyChain) {
    if (isValidationEntry(entry)) return;

    var avroValidation = getAvroValidation(entry.type);
    var v = validationManagerFactory()
      .addValidations(entry.registry, entry.namespace, entry.ref)
      .overridePriority()
      .overrideValidator(avroValidation)
      .finalize();
    var t = treeFactory(parent, {
      key: _.last(keyChain),
      path: keyChain.join('.'),
      entry: entry,
      validations: v
    });

    parent.addChild(t);

    return t;
  });
}

function getAvroValidation(type) {
  var validator = AVRO_VALIDATOR_MAP[type];

  if (!validator)
    throw new Error('Invalid type found: %s', type);

  return avroValidationBase(validator);
}

function avroValidationBase(fn) {
  return [{
    name: '$avro',
    priority: -1,
    type: fn
  }];
}

function recordValidation(entry, value) {
  if (!_.isPlainObject(value))
    return false;

  var fieldNames = entry.fields.map(function(v) {
    return v.key;
  });
  var invalidKeys = _.difference(Object.keys(value), fieldNames);

  return Boolean(invalidKeys.length);
}

function enumValidation(entry, value) {
  return entry.symbols.indexOf(value) !== -1;
}

function arrayValidation(__, value) {
  return _.isArray(value);
}

function mapValidation(__, value) {
  return _.isPlainObject(value);
}

function fromPairs(kvArr) {
  return kvArr.reduce(function(result, kvPair) {
    result[_.head(kvPair)] = _.last(kvPair);
    return result;
  }, {});
}

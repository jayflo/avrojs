'use strict';

var _ = require('lodash');
var map = require('avro-map').map;

var validationManager = require('./validationManager');
var isValidationEntry = validationManager.isValidationEntry;
var ValidationManager = validationManager.ValidationManager;
var collections = require('./collections');
var PUBLIC_VALIDATIONS = collections.PUBLIC_VALIDATIONS;
var COMPLEX_TYPES_NAMES = collections.COMPLEX_TYPES_NAMES;
var INTERNAL_VALIDATIONS_MAP = collections.INTERNAL_VALIDATIONS_MAP;
var Tree = require('./tree').Tree;

module.exports = Object.freeze({
  build: build
});

function treeFactory(parent, attributes) {
  return new Tree(parent, null, attributes);
}

function validationManagerFactory(args) {
  return new ValidationManager(args.$avro, args.$children);
}

function build(schema) {
  schema = PUBLIC_VALIDATIONS.concat(schema);

  return map(schema, function(parent, entry, keyChain) {
    if (isValidationEntry(entry)) return;

    var typeVs = getTypeValidations(entry.type);
    var vm =
      validationManagerFactory(typeVs.$avro, typeVs.$children)
      .setValidationsFromEntry(entry.registry, entry.namespace, entry.ref)
      .finalize();
    var t = treeFactory(parent, {
      key: _.last(keyChain),
      path: keyChain.join('.'),
      entry: entry,
      validationManager: vm
    });

    parent.addChild(t);

    return t;
  });
}

function getTypeValidations(type) {
  return;
}

function internalTemplate(entry) {
  return {
    name: entry.name,
    priority: entry.priority,
    validator: entry.type,
    args: []
  };
}

function $avroRecord(entry, value) {
  if (!_.isPlainObject(value))
    return false;

  var fieldNames = entry.fields.map(function(v) {
    return v.key;
  });
  var invalidKeys = _.difference(Object.keys(value), fieldNames);

  return Boolean(invalidKeys.length);
}

function $avroEnum(entry, value) {
  return entry.symbols.indexOf(value) !== -1;
}

function $avroArray(__, value) {
  return _.isArray(value);
}

function $avroMap(__, value) {
  return _.isPlainObject(value);
}

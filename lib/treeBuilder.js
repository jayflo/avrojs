'use strict';

var map = require('avro-map').map;
var validationManager = require('./validationManager');
var isValidationEntry = validationManager.isValidationEntry;
var ValidationManager = validationManager.ValidationManager;
var builtinValidations = require('./builtinValidations');

var Tree = require('./tree').Tree;

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

    var v = validationManagerFactory().addValidations(
      entry.registry, entry.namespace, entry.ref
    );
    var t = treeFactory(parent, {validations: v});

    parent.addChild(t);

    return t;
  });
}

function avroValidation(fn) {
  return [{
    name: '$avro',
    priority: -1,
    type: fn
  }];
}

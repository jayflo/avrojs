'use strict';

var _ = require('lodash');
var map = require('avro-map').map;
var validator = require('./validator');
var isValidationEntry = validator.isValidationEntry;
var Validator = validator.Validator;
var builtinValidations = require('./builtinValidations');

var Tree = require('./tree').Tree;

module.exports = Object.freeze({
  build: build
});

function treeFactory(parent, children, attributes) {
  return new Tree(parent, children, attributes);
}

function validatorFactory(registry, namespace, entry) {
  return new Validator(registry, namespace, entry);
}

function build(schema) {
  schema = builtinValidations().concat(schema);

  var trees = map(schema, function(parent, entry, keyChain, extra) {
    if (isValidationEntry(entry)) return;

    var v = validatorFactory(extra.registry, extra.namespace, entry);

  });
}

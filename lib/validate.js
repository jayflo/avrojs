'use strict';

var _ = require('lodash');

var treeBuilder = require('./treeBuilder');
var fromPairs = require('./utils').fromPairs;
var ValidationManager = require('./validationManager').ValidationManager;

var OPTION_STYLE = Object.freeze({
  FAIL_ON_FIRST: 'failOnFirst'
});
var DEFAULT_OPTIONS = {
  style: OPTION_STYLE.FAIL_ON_FIRST
};
var ALGO_STYLES = Object.freeze(fromPairs([
  OPTION_STYLE.FAIL_ON_FIRST, failOnFirst
]));

module.exports = Object.freeze({
  validate: validate,
  validator: validator
});

function validator(schema, options) {
  options = _.defaults(options || {}, DEFAULT_OPTIONS);

  var tree = treeBuilder.build(schema);
  var algo = ALGO_STYLES[options.style];

  return function(values) {
    values = [].concat(values);
    return values.map(function(value) {
      var keyChain = [];

      return algo(tree, value, keyChain);
    });
  };
}

function validate(schema, values, options) {
  return validator(schema, options)(values);
}

function failOnFirst(tree, value, keyChain) {
  var vm = tree.validationManager;
  var validations = _.groupBy(vm.validations(), function(v) {
    if (v.priority < 0) return 'pre';
    if (v.priority === 0) return '$children';
    return 'post';
  });
  var $children = _.head(validations.$children);
  var error;
  var v;

  while ((v = validations.pre.shift())) {
    error = ValidationManager.applyValidation(v, value);

    if (error) return [error];
  }

  error = [];

  $children.$map(tree, value).some(function(recurse) {
    var _keyChain = _.compact(keyChain.concat(recurse.key));
    var _error = failOnFirst(recurse.tree, recurse.value, _keyChain);

    if (_error)
      error.push(_error);
    if (tree.type === 'union')
      return error.length;

    return false;
  });

  error = $children.$combine(error);

  if (error.length) return error;

  while ((v = validations.post.shift())) {
    error = ValidationManager.applyValidation(v, value);

    if (error) return [error];
  }

  return [];
}

'use strict';

var _ = require('lodash');

var treeBuilder = require('./treeBuilder');
var fromPairs = require('./utils').fromPairs;

var OPTION_STYLE = Object.freeze({
  FAIL_FAST: 'failfast'
});
var DEFAULT_OPTIONS = {
  style: OPTION_STYLE.FAIL_FAST
};
var ALGO_STYLES = Object.freeze(fromPairs([
  OPTION_STYLE.FAIL_FAST, failFast
]));

module.exports = Object.freeze({
  validate: validate,
  validator: validator
});

function validator(schema, options) {
  options = _.defaults(options || {}, DEFAULT_OPTIONS);

  var tree = treeBuilder.build(schema);
  var algo = ALGO_STYLES[options.style];

  return function(objects) {
    objects = [].concat(objects);
    return objects.map(function(obj) {
      return algo(tree, obj);
    });
  };
}

function validate(schema, objects, options) {
  return validator(schema, options)(objects);
}

function failFast(tree, obj) {

}

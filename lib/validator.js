'use strict';

var _ = require('lodash');

var DEFAULT_PRIORITY = 1;
var CUSTOM_KEY_RE = /^\$[^\$]+/;
var NOT_PRIORITY = /^[^:]+:/;

module.exports = Object.freeze({
  Validator: Validator,
  isValidationEntry: isValidationEntry
});

function Validator(namespace, registry, entry) {
  this.validations = [];
}

Object.defineProperties(Validator.prototype, {
  addValidations: {value: addValidations},
  addValidation: {value: addValidation}
});

function addValidations(registry, namespace, obj) {
  this.validations.concat(
    _(obj)
    .keys()
    .filter(isCustomKey)
    .map(function(key) {
      return parseValidation(registry, namespace, obj, obj[key]);
    })
    .value()
  );
  this.validations.sort(function(a, b) {
    return a.priority - b.priority;
  });

  return this;
}

function addValidation(registry, namespace, key, value) {
  var obj = _.set({}, [key], value);

  return this.addValidations(registry, namespace, obj);
}

function parseValidation(registry, namespace, key, value) {
  var name = nameFromKey(key);
  var priority = getKeyPriority(key);
  var entry;

  if (!name.length < 2)
    throw new Error('Invalid key: ' + key);
  if (_.isInteger(priority) && !priority)
    throw new Error('Priority cannot be 0: ' + key);

  entry = isValidationEntry(value) ?
          value :
          tryGetEntry(registry, namespace, name);

  if (!entry)
    throw new Error('Undefined validation: ' + key);

  priority = first(_.isInteger, priority, entry.priority, DEFAULT_PRIORITY);

  if (!keyPriority)
    throw new Error('Priority cannot be 0: ' + key);

  return {
    priority: priority,
    validator: entry.type,
    args: [].concat(isValidationEntry(value) ? [] : value),
    message: entry.message
  };
}

function nameFromKey(str) {
  return _.head(/^\$[^\$]+/.exec(str)) || '';
}

function getKeyPriority(str) {
  return parseInt((str || '').replace(NOT_PRIORITY, ''));
}

function tryGetEntry(registry, namespace, name) {
  return registry(namespace, name) ||
         registry(namespace, unqualifiedName(name)) ||
         registry(null, unqualifiedName(name));
}

function first() {
  return _.head(
    Array.prototype.slice.call(arguments, 0).filter(arguments[0])
  ) || null;
}

function isValidationEntry(entry) {
  return _.isPlainObject(entry) &&
         isCustomKey(unqualifiedName(entry.name)) &&
         _.isFunction(entry.type);
}

function unqualifiedName(str) {
  return _.last((str || '').split('.'));
}

function isCustomKey(str) {
  return (str || '').indexOf('$') === 0;
}

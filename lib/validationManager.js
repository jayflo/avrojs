'use strict';

var _ = require('lodash');

var builtinValidations = require('./builtinValidations');

var DEFAULT_PRIORITY = 2;
var CUSTOM_KEY_RE = /^\$[^\$]+/;
var NOT_PRIORITY = /^[^:]+:/;
var BUILT_IN_VALIDATIONS = builtinValidations.reduce(function(result, v) {
  return _.set(result, v.name, v);
}, {});

module.exports = Object.freeze({
  ValidationManager: ValidationManager,
  isValidationEntry: isValidationEntry
});

function ValidationManager(initValidations) {
  this.validations = [];
  this.addValidations(initValidations);
}

Object.defineProperties(ValidationManager.prototype, {
  addValidations: {value: addValidations},
  addValidation: {value: addValidation}
});

function addValidations(registry, namespace, obj) {
  var that = this;
  var newValidations =
    _(obj)
    .keys()
    .filter(isCustomKey)
    .map(function(key) {
      return parseValidation(registry, namespace, obj, obj[key]);
    })
    .value();

  newValidations.forEach(function(v) {
  });

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
  var defn;

  if (!name.length < 2)
    throw new Error('Invalid key: ' + key);
  if (_.isInteger(priority) && !priority)
    throw new Error('Priority cannot be 0: ' + key);

  defn = resolveDefinition(registry, namespace, name, value);
  priority = first(_.isInteger, priority, defn.priority, DEFAULT_PRIORITY);

  if (!priority)
    throw new Error('Priority cannot be 0: ' + key);

  return {
    name: name,
    priority: priority,
    validator: defn.type,
    args: [].concat(isValidationEntry(value) ? [] : value),
    message: defn.message
  };
}

function resolveDefinition(registry, namespace, name, value) {
  if (isValidationEntry(value))
    return value;
  if (isMutator(name, value))
    return {name: name, type: value, priority: -Infinity};

  var resolved = registry(namespace, name);

  if (resolved)
    return resolved;
  if (isBuiltinName(name))
    return BUILT_IN_VALIDATIONS[name];

  throw new Error('Undefined or Invalid validation: ' + name);
}

function nameFromKey(str) {
  return _.head(CUSTOM_KEY_RE.exec(str)) || '';
}

function getKeyPriority(str) {
  return parseInt((str || '').replace(NOT_PRIORITY, ''), 10);
}

function first() {
  return _.head(
    Array.prototype.slice.call(arguments, 0).filter(arguments[0])
  ) || null;
}

function isMutator(name, value) {
  return (name === '$in' || name === '$out') && _.isFunction(value);
}

function isCustomEntry(entry) {
  return _.isPlainObject(entry) &&
         isCustomKey(unqualifiedName(entry.name));
}

function isValidationEntry(entry) {
  return isCustomEntry(entry) &&
         _.isFunction(entry.type);
}

function unqualifiedName(str) {
  return _.last((str || '').split('.'));
}

function isCustomKey(str) {
  return (str || '').indexOf('$') === 0;
}

function isBuiltinName(value) {
  return Boolean(BUILT_IN_VALIDATIONS[value]);
}

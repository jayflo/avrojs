'use strict';

var _ = require('lodash');

var builtinValidations = require('./builtinValidations');

var DEFAULT_PRIORITY = 2;
var CUSTOM_KEY_RE = /^\$[^\$]+/;
var NOT_PRIORITY = /^[^:]+:/;
var BUILT_IN_VALIDATIONS = builtinValidations.reduce(function(result, v) {
  return _.set(result, v.name, v);
}, {});
var MUTATORS = ['$in', '$out'];

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
  addValidation: {value: addValidation},
  overrideValidator: {value: overrideValidator},
  overridePriority: {value: overridePriority},
  addIfAbsent: {value: addIfAbsent},
  finalize: {value: finalize}
});

function finalize() {
  this.validations.sort(function(v1, v2) {
    return v1.priority - v2.priority;
  });
  this.validations.forEach(Object.freeze);
  Object.freeze(this.validations);

  return this;
}

function overrideValidator(validations) {
  var names = (validations || []).reduce(function(result, v) {
    return _.set(result, [v.name], v);
  }, {});

  this.validations.forEach(function(v) {
    if (names[v.name])
      v.validator = names[v.name].validator;
  });

  return this;
}

function overridePriority(validations) {
  var names = (validations || []).reduce(function(result, v) {
    return _.set(result, [v.name], v);
  }, {});

  this.validations.forEach(function(v) {
    if (names[v.name])
      v.priority = names[v.name].priority;
  });

  return this;
}

function addValidations(registry, namespace, obj) {
  this.validations = this.validations.concat(
    _(obj).keys()
    .filter(isCustomKey)
    .map(function(key) {
      return parseValidation(registry, namespace, obj, obj[key]);
    })
  );

  errorOnDuplicates(this.validations);

  return this;
}

function addValidation(registry, namespace, key, value) {
  var obj = _.set({}, [key], value);

  return this.addValidations(registry, namespace, obj);
}

function parseValidation(registry, namespace, key, value) {
  var name = nameFromKey(key);
  var keyPriority = getKeyPriority(key);
  var entry = getEntry(registry, namespace, name, value);

  return {
    name: name,
    priority: resolvePriority(name, keyPriority, entry),
    validator: resolveValidator(name, value, entry),
    args: resolveArgs(value),
    message: entry.message
  };
}

function getEntry(registry, namespace, name, value) {
  var entry;

  if (isValidationEntry(value))
    return value;

  entry = registry(namespace, name);

  if (entry)
    return entry;
  if (isBuiltinName(name))
    return BUILT_IN_VALIDATIONS[name];

  throw new Error('Undefined validator `%s`', name);
}

function resolvePriority(name, keyPriority, entry) {
  if (keyPriority === 0)
    throw new Error('Priority override must be non-zero for `%s`', name);
  if (entry.priority === 0)
    throw new Error('Validation priority must be non-zero for `%s`', name);
  if (isMutator(name))
    return entry.priority;

  return first(_.isInteger, keyPriority, entry.priority, DEFAULT_PRIORITY);
}

function resolveValidator(name, value, entry) {
  if (isValidationEntry(value)) {
    if (!_.isFunction(value.type))
      throw new Error('Validation `%s` type must be function', name);

    return value.type;
  } else if (isMutator(name)) {
    if (!_.isFunction(value))
      throw new Error('`%s` value must be function', name);

    return value;
  }

  return entry.type;
}

function resolveArgs(value) {
  if (isValidationEntry(value) || _.isFunction(value))
    return [];

  return [].concat(value || []);
}

function errorOnDuplicates(validations) {
  _(validations)
  .groupBy(function(v) {
    return v.name;
  })
  .forEach(function(vArr, name) {
    if (vArr.length > 1)
      throw new Error('Validation `%s` occurs twice on same object', name);
  });
}

function nameFromKey(str) {
  return _.head(CUSTOM_KEY_RE.exec(str)) || '';
}

function getKeyPriority(str) {
  return parseInt((str || '').replace(NOT_PRIORITY, ''), 10);
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

function first() {
  return _.head(
    Array.prototype.slice.call(arguments, 1).filter(arguments[0])
  ) || null;
}

function isCustomKey(str) {
  return (str || '').indexOf('$') === 0;
}

function isBuiltinName(value) {
  return Boolean(BUILT_IN_VALIDATIONS[value]);
}

function isMutator(name) {
  return isBuiltinName(name) && MUTATORS.indexOf(name) !== -1;
}

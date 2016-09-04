'use strict';

var _ = require('lodash');

var builtinValidations = require('./builtinValidations');

var DEFAULT_PRIORITY = 2;
var CUSTOM_KEY_RE = /^\$[^\$]+/;
var NOT_PRIORITY = /^[^:]+:/;
var SPECIAL_KEYS = ['$avro', '$in', '$out'];
var DEFAULT_VALIDATIONS =
  builtinValidations
  .filter(function(entry) {
    return SPECIAL_KEYS.indexOf(entry.name) !== -1;
  }).reduce(function(result, entry) {
    result[entry.name] = entry;
    return result;
  }, {});

module.exports = Object.freeze({
  ValidationManager: ValidationManager,
  isValidationEntry: isValidationEntry
});

function ValidationManager() {
  this.validations = [];
  this.addValidations(null, null, DEFAULT_VALIDATIONS);
}

Object.defineProperties(ValidationManager.prototype, {
  addValidations: {value: addValidations},
  addValidation: {value: addValidation}
});

function addValidations(registry, namespace, obj) {
  var updatedValidations = this.validations.concat(
    _(obj)
    .keys()
    .filter(isCustomKey)
    .map(function(key) {
      return parseValidation(registry, namespace, obj, obj[key]);
    })
    .value()
  );
  this.validations = handleDuplicates(updatedValidations);
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
    throw new Error('Undefined or Invalid validation: ' + key);

  priority = first(_.isInteger, priority, entry.priority, DEFAULT_PRIORITY);

  if (!priority)
    throw new Error('Priority cannot be 0: ' + key);

  return {
    name: name,
    priority: priority,
    validator: entry.type,
    args: [].concat(isValidationEntry(value) ? [] : value),
    message: entry.message
  };
}

function handleDuplicates(validations) {
  var dups = _(validations)
    .groupBy(function(v) {
      return v.name;
    })
    .filter(function(arr) {
      return arr.length > 1;
    })
    .value();
  var handledDups = dups.map(function(dupVArr) {
    var def = _.head(dupVArr);
    var set = _.last(dupVArr);
    var name = def.name;

    return specialKeyOverrides(name, def, set);
  });
  var dupNames = handledDups.map(function(v) {
    return v.name;
  });

  return validations
    .filter(function(v) {
      return dupNames.indexOf(v) === -1;
    })
    .concat(handledDups);
}

/**
 * By this point we know the priority is non-zero.
 */

function specialKeyOverrides(name, def, set) {
  switch (name) {
    case '$avro':
      return _.assign({}, def, {priority: set.priority});
    case '$in':
    case '$out':
      return _.assign({}, def, {validator: set.validator});
    default:
      throw new Error('Key set twice: ' + name);
  }
}

function nameFromKey(str) {
  return _.head(CUSTOM_KEY_RE.exec(str)) || '';
}

function getKeyPriority(str) {
  return parseInt((str || '').replace(NOT_PRIORITY, ''), 10);
}

function tryGetEntry(registry, namespace, name) {
  return registry(namespace, name) || registry(null, unqualifiedName(name));
}

function first() {
  return _.head(
    Array.prototype.slice.call(arguments, 0).filter(arguments[0])
  ) || null;
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

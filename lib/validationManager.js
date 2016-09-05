'use strict';

var _ = require('lodash');

var utils = require('./utils');
var setKeys = utils.setKeys;
var collections = require('./collections');
var INTERNAL_VALIDATIONS_MAP = collections.INTERNAL_VALIDATIONS_MAP;

var DEFAULT_PRIORITY = 2;
var CUSTOM_KEY_RE = /^\$[^\$]+/;
var NOT_PRIORITY_RE = /^[^:]+:/;
var INVALID_UQ_NAMES = Object.freeze({
  $children: true
});
var NO_PRIORITY_OVERRIDE = Object.freeze(setKeys({}, [
  '$in', '$out'
], true));

module.exports = Object.freeze({
  ValidationManager: ValidationManager,
  isValidationEntry: isValidationEntry
});

function parseValidationKeyNamePriority(key) {
  var keyInfo = getKeyNamePriorityInfo(key);

  if (!keyInfo.name)
    throw new Error('Name not defined: %s', key);
  if (INVALID_UQ_NAMES[key.unqualifiedName])
    throw new Error('Invalid key name found: `%s`', key);
  if (keyInfo.priorityStr && !/-?\d+/.test(keyInfo.priorityStr))
    throw new Error('Priority override must be integer, found `%s`', key);
  if (!keyInfo.priority)
    throw new Error('Priority override must be non-zero, found `%s`', key);
  if (_.isInteger(keyInfo.priority) &&
      NO_PRIORITY_OVERRIDE[keyInfo.unqualifiedName])
    throw new Error('Cannot override priority in `%s`', key);

  return {name: keyInfo.name, priority: keyInfo.priority};
}

function getKeyNamePriorityInfo(key) {
  var name = _.head((key || '').exec(CUSTOM_KEY_RE));
  var priorityStr = (key || '').replace(NOT_PRIORITY_RE, '');

  return {
    name: name,
    unqualifiedName: unqualifiedName(name),
    priorityStr: priorityStr,
    priority: parseInt(priorityStr, 10)
  };
}

function ValidationManager($avro, $children) {
  if (!$avro || !$children)
    throw new Error('$avro and $children required');

  this.$avro = $avro;
  this.$children = $children;
  this.validations = [];
}

Object.defineProperties(ValidationManager.prototype, {
  setValidationsFromEntry: {value: setValidationsFromEntry},
  finalize: {value: finalize}
});

function finalize() {
  this.validations.push(this.$avro);
  this.validations.push(this.$children);
  this.validations.sort(function(v1, v2) {
    return v1.priority - v2.priority;
  });
  this.validations.forEach(Object.freeze);
  Object.freeze(this.validations);
  Object.freeze(this);
}

function setValidationsFromEntry(registry, namespace, entry) {
  var vm = this;

  this.validations =
    _(entry)
    .keys()
    .filter(isAvroJsKey)
    .map(function(key) {
      return getValidation(vm, registry, namespace, key, entry[key]);
    });

  return this;
}

function getValidation(vm, registry, namespace, key, value) {
  var np = parseValidationKeyNamePriority(key);

  if (INTERNAL_VALIDATIONS_MAP[np.unqualifiedName])
    return getInternalValidation(vm, np.unqualifiedName, np.priority, value);

  return getPublicValidation(np.name, np.priority, value);
}

function getInternalValidation(vm, name, priority, value) {
  var entry = INTERNAL_VALIDATIONS_MAP[name];

  switch (name) {
    case '$avro':
      return _.assign({}, vm.$avro, {priority: priority});
    case '$in':
    case '$out':
      if (!_.isFunction(value))
        throw new Error('Value of `%s` must be function', name);
      return _.assign({}, entry, {validator: value});
    default:
      throw new Error('This is a bug');
  }
}

function getPublicValidation(registry, namespace, name, priority, value) {
  var entry = registry(namespace, name);

  return {
    name: name,
    priority: first(_.isInteger, priority, entry.priority, DEFAULT_PRIORITY),
    validator: resolveValidator(name, value, entry),
    args: resolveArgs(value)
  };
}

function resolveValidator(name, value, entry) {
  if (_.isFunction(value))
    return value;

  if (!_.isFunction((entry || {}).type))
    throw new Error('No validator definition for `%s`', name);

  return entry.type;
}

function resolveArgs(value) {
  if (isValidationEntry(value) || _.isFunction(value))
    return [];

  return [].concat(value || []);
}

function isCustomEntry(entry) {
  return _.isPlainObject(entry) &&
         isAvroJsKey(unqualifiedName(entry.name));
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

function isAvroJsKey(str) {
  return (str || '').indexOf('$') === 0;
}

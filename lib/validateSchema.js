'use strict';

var format = require('util').format;

var _ = require('lodash');
var map = require('avro-map').map;

var messageWhenFalse = require('./utils').messageWhenFalse;

module.exports = Object.freeze({
});

function validateSchema(schema) {
  var errors = {};

  map(schema, function(__, entry, keyChain) {

  });
}

function validateEntry(entry) {
    if (_.isString(entry)) return [];


}

var UQ_AVRO_NAME_RE = /^[A-Za-z_][A-Za-z0-9_]*$/;
var UQ_AVRO_JS_NAME_RE = /^\$[A-Za-z_][A-Za-z0-9_]*$/;
var NAMESPACE_CHUNK_RE = /^[A-Za-z_][A-Za-z0-9_]*$/;
var ENUM_SYMBOLS_RE = NAMESPACE_CHUNK_RE;

var CHECK_MAP = Object.freeze()

var RECORD_CHECKS = {
  name: {required: true, check: nameCheck},
  namespace: {check: namespaceCheck},
  doc: {check: stringCheck},
  aliases: {check: aliasesCheck},
  fields: {required: true, check: _.constant('TODO')}
};

var RECORD_FIELD_CHECKS = {
  name: {required: true, check: stringCheck},
  doc: {check: stringCheck},
  type: {required: true, check: stringOrArrayOrObject},
  default: {},
  order: {check: orderCheck},
  aliases: {check: stringArray}
};

var ENUM_CHECKS = {
  name: {required: true, check: nameCheck},
  namespace: {check: namespaceCheck},
  aliases: {check: aliasesCheck},
  doc: {stringCheck},
  symbols: {required: true, check: symbolsCheck}
};

var ARRAY_CHECKS = {
  name: {required: false, check: _.partialRight(nameCheck, UQ_AVRO_JS_NAME_RE)},
  namespace: {required: false, check: namespaceCheck}
};

function stringCheck(value) {
  return messageWhenFalse(_.isString(value), 'Must be a string');
}

function isValidUnqaulifiedName(name, re) {
  return (re || UQ_AVRO_NAME_RE).test(name);
}

function unqualifiedNameCheck(value, re) {
  re = re || UQ_AVRO_NAME_RE;

  return messageWhenFalse(
    isValidUnqaulifiedName(value, re),
    format('Unqualified name must match %s', re)
  )
}

function isValidNamespace(namespace) {
  return _.isString(namespace) && name.split('.').every(function(chunk) {
    return NAMESPACE_CHUNK_RE.test(chunk);
  });
}

function namespaceCheck(value) {
  return messageWhenFalse(
    isValidNamespace(value),
    format('Namespace must be dot separated string of %s', NAMESPACE_CHUNK_RE)
  )
}

function nameCheck(name, re) {
  var chunks = name.split('.');

  if (chunks.length === 1)
    return unqualifiedNameCheck(name, re);

  var errors = _.compact([
    namespaceCheck(_.initial(chunks).join('.')),
    unqualifiedNameCheck(_.last(chunks), re)
  ]);

  return messageWhenFalse(!errors.length, errors.join(' and '));
}

function arrayCheck(value) {
  return messageWhenFalse(_.isArray(value), 'Must be an array');
}

function aliasesCheck(value) {
  var error = arrayCheck(value);

  if (error) return error;

  error = _.compact(value.map(function(alias) {
    return nameCheck(alias);
  }));

  return messageWhenFalse(
    !error.length,
    format('All aliases must satisfy: %s', _.head(error))
  );
}

function stringOrArrayOrObject(value) {
  return messageWhenFalse(
    _.isString(value) || _.isArray(value) || _.isPlainObject(value),
    'Must be of type string, array or object'
  );
}

function orderCheck(value) {
  return ['ascending', 'descending', 'ignore'].indexOf(value) !== -1;
}

function stringArray(value) {
  var error = arrayCheck(value)

  if (error) return error;

  error = _.compact(value.map(function(v) {
    return stringCheck(v);
  }));

  return messageWhenFalse(!error.length, 'Each item must be a string');
}

function symbolsCheck(value) {
  var error = arrayCheck(value);
  var dups;

  if (error) return error;

  error = _.compact(value.map(function(s) {
    return ENUM_SYMBOLS_RE.test(s);
  }));

  if (error.length)
    return format('All symbols must match %s', ENUM_SYMBOLS_RE);

  dups = _(value)
    .groupBy(_.identity)
    .map(function(sArr) {
      return Boolean(sArr.length);
    })
    .compact()
    .head();

  if (dups)
    return 'All symbols must be unique';
}
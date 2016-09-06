'use strict';

var format = require('util').format;

var _ = require('lodash');
var map = require('avro-map').map;

var validationManager = require('./validationManager');
var isValidationEntry = validationManager.isValidationEntry;
var ValidationManager = validationManager.ValidationManager;
var collections = require('./collections');
var PUBLIC_VALIDATIONS = collections.PUBLIC_VALIDATIONS;
var COMPLEX_TYPE_NAMES = collections.COMPLEX_TYPE_NAMES;
var PRIMITIVE_TYPE_NAMES = collections.PRIMITIVE_TYPE_NAMES;
var INTERNAL_VALIDATIONS_MAP = collections.INTERNAL_VALIDATIONS_MAP;
var Tree = require('./tree').Tree;
var utils = require('./utils');
var jsonPretty = utils.jsonPretty;
var fromPairs = utils.fromPairs;

var AVRO_ENTRY = INTERNAL_VALIDATIONS_MAP.$avro;
var CHILDREN_ENTRY = INTERNAL_VALIDATIONS_MAP.$children;
var REQUIRED_VALIDATIONS_MAP = Object.freeze(fromPairs([
  [COMPLEX_TYPE_NAMES.RECORD, $avroRecord, $mapRecord, $combineProduct],
  [COMPLEX_TYPE_NAMES.ENUM, $avroEnum],
  [COMPLEX_TYPE_NAMES.ARRAY, $avroArray, $mapArray, $combineProduct],
  [COMPLEX_TYPE_NAMES.MAP, $avroMap, $mapMap, $combineProduct],
  [COMPLEX_TYPE_NAMES.UNION, _.noop, $mapUnion, $combineUnion],
  [COMPLEX_TYPE_NAMES.FIXED, $avroFixed],

  [PRIMITIVE_TYPE_NAMES.NULL, $avroNull],
  [PRIMITIVE_TYPE_NAMES.BOOLEAN, $avroBoolean],
  [PRIMITIVE_TYPE_NAMES.INT, $avroInt],
  [PRIMITIVE_TYPE_NAMES.LONG, $avroInt],
  [PRIMITIVE_TYPE_NAMES.FLOAT, $avroFloat],
  [PRIMITIVE_TYPE_NAMES.DOUBLE, $avroFloat],
  [PRIMITIVE_TYPE_NAMES.BYTES, $avroString],
  [PRIMITIVE_TYPE_NAMES.STRING, $avroString]
].map(_.spread(function(typeName, $avro, $map, $combine) {
  return [typeName, getTypeValidations(
    $avro, $map || $mapNone, $combine || $combineNone
  )];
}))));

module.exports = Object.freeze({
  build: build
});

function treeFactory(parent, attributes) {
  return new Tree(parent, null, attributes);
}

function validationManagerFactory(args) {
  return new ValidationManager(args.$avro, args.$children);
}

function build(schema) {
  schema = PUBLIC_VALIDATIONS.concat(schema);

  return map(schema, function(parent, entry, keyChain) {
    if (isValidationEntry(entry)) return;

    var typeVldtns = REQUIRED_VALIDATIONS_MAP[entry.type];
    var vm;
    var tree;

    if (!typeVldtns)
      throw new Error('Invalid type found in %s', jsonPretty(entry));

    vm = validationManagerFactory(typeVldtns.$avro, typeVldtns.$children)
      .setValidationsFromEntry(entry.registry, entry.namespace, entry.ref)
      .finalize();
    tree = treeFactory(parent, {
      key: _.last(keyChain),
      validationManager: vm,
      type: entry.type
    });

    parent.addChild(tree);

    return tree;
  });
}

function getTypeValidations($avroFn, $map, $combine) {
  return {
    $avro: validationBase(AVRO_ENTRY, $avroFn),
    $children: validationBase(CHILDREN_ENTRY, {$map: $map, $combine: $combine})
  };
}

function validationBase(entry, fnOrObj) {
  return {
    name: entry.name,
    priority: entry.priority,
    validator: fnOrObj,
    args: [entry]
  };
}

function $mapNone() {
  return [];
}

function $combineNone() {
  return [];
}

function $avroRecord(entry, value) {
  if (!_.isPlainObject(value))
    return 'Valuse must be an object';

  var fieldNames = entry.fields.map(function(f) {
    return f.name;
  });
  var invalidKeys = _.difference(Object.keys(value), fieldNames);

  if (invalidKeys.length)
    return format('Invalid keys on record: %s', invalidKeys.join(', '));
}

function $mapRecord(tree, value) {
  return tree.children().map(function(childTree) {
    var fieldName = childTree.key;

    return {
      key: fieldName,
      value: value[fieldName],
      tree: childTree
    };
  });
}

function $combineProduct(childResults) {
  return _.compact(_.flatten(childResults));
}

function $mapUnion(tree, value) {
  return tree.children().map(function(childTree) {
    return {
      key: '',
      value: value,
      tree: childTree
    };
  });
}

function $combineUnion(childResults) {
  var oneValid = childResults.some(function(result) {
    return _.compact(result).length === 0;
  });

  if (!oneValid)
    return _.compact(_.flatten(childResults));
}

function $avroEnum(entry, value) {
  return entry.symbols.indexOf(value) === -1 &&
         'Value must be one of `symbols`';
}

function $avroArray(__, value) {
  return !_.isArray(value) && 'Value must be an array';
}

function $mapArray(tree, value) {
  var itemTree = _.head(tree.children());

  return value.map(function(item, idx) {
    return {
      key: idx,
      value: item,
      tree: itemTree
    };
  });
}

function $avroMap(__, value) {
  return !_.isPlainObject(value) && 'Value must be an object';
}

function $mapMap(tree, value) {
  var valuesTree = _.head(tree.children());

  return Object.keys(value).map(function(key) {
    return {
      key: key,
      value: value[key],
      tree: valuesTree
    };
  });
}

function $avroFixed(entry, value) {
  var test = _.isString(value) &&
             Buffer.byteLength(value, 'utf8') === entry.size;
  if (!test)
    return format('Value must be a string of byte length %s', entry.size);
}

function $avroNull(__, value) {
  return !_.isNil(value) && 'Value must be `null` or `undefined`';
}

function $avroBoolean(__, value) {
  return !_.isBoolean(value) && 'Value must be `true` or `false`';
}

function $avroInt(__, value) {
  return !_.isInteger(value) && 'Value must be an integer';
}

function $avroFloat(__, value) {
  return !(_.isInteger(value) && value % 1 === 0) && 'Value must be an float';
}

function $avroString(__, value) {
  return !_.isString(value) && 'Value must be an string';
}



function defaultDefnDetect(name, entry) {
    return (_.isPlainObject(entry) && entry.type === name) ||
           (_.isString(entry) && entry === name);
}

function isNonEmptyString(val) {
    return _.isString(val) && val.length;
}

function isUndefinedEmptyString(val) {
    return _.isUndefined(vale) || (_.isString(val) && !val.length);
}

function isGlobalType(obj, type) {
    return obj.type === type && isUndefinedEmptyString(obj.namespace);
}


// Attributes


[{
    name: 'name',
    type: '$attribute',
    requires: function(obj) {
        assert(isNonEmptyString(obj.name), 'msg');
    }
}, {
    name: 'requires',
    type: '$attribute',
    requires: function(obj) {
        assert(isNonEmptyString(obj.name), 'msg');
        assert(obj.type === '$attribute', 'msg');
    }
}]


// Types

/**
 * 1. Detect type.
 * 2. If defn isPlainObject:
 *     1. validate all own properties
 *     2. validate definition has all required properties
 * 3. Recurse
 *
 * Any typedef missing a detect method uses the default detection.
 */

[{
    name: 'null',
    validate: {
        pre: function(defn, value) {}
    }
}, {
    name: 'boolean',
    validate: {
        pre: function(defn, value) {}
    }
}, {
    name: 'int',
    validate: {
        pre: function(defn, value) {}
    }
}, {
    name: 'long',
    validate: {
        pre: function(defn, value) {}
    }
}, {
    name: 'float',
    validate: {
        pre: function(defn, value) {}
    }
}, {
    name: 'double',
    validate: {
        pre: function(defn, value) {}
    }
}, {
    name: 'bytes',
    validate: {
        pre: function(defn, value) {}
    }
}, {
    name: 'string',
    validate: {
        pre: function(defn, value) {}
    }
}, {
    name: 'record',
    requires: ['name', 'fields'],
    childTypes: function(defn) {
        return defn.fields.map(function(f) {
            return {
                keys: function(key) { return key === f.name; },
                type: f.type
            };
        });
    },
    children: function(defn, value) {
        return defn.fields.map(function(f) {
            return { key: f.name, value: value[f.name] };
        });
    },
    validate: {
        pre: function(defn, value) {
            if (!_.isPlainObject(value)) return { msg: 'msg' };
        },
        post: function(defn, value, childrenErrors) {}
    }
}, {
    name: 'enum',
    requires: ['name', 'symbols'],
    validate: {
        pre: function(defn, value) {
            if (defn.symbols.indexOf(value) < 0) return { msg: 'msg' };
        }
    }
}, {
    name: 'array',
    requires: ['items'],
    childTypes: function(defn) {
        return {
            keys: function(key) {
                return /\d+/.test(key);
            },
            type: defn.items
        };
    },
    children: function(defn, value) {
        return value.map(function(item, index) {
            return { key: _.toString(index), value: item };
        });
    },
    validate: {
        pre: function(defn, value) {
            if (!_.isArray(value)) return {msg: 'msg' };
        },
        post: function(defn, value, childrenErrors) {}
    }
}, {
    name: 'map',
    requires: ['values'],
    childTypes: function(defn) {
        return {
            keys: _.constant(true),
            type: defn.values
        };
    },
    children: function(defn, value) {
        return _.map(value, function(v, k) {
            return { key: k, value: v };
        });
    },
    validate: {
        pre: function(defn, value) {
            if (!_.isPlainObject(value)) return { msg: 'msg' };
        },
        post: function(defn, value, childrenErrors) {}
    }
}, {
    name: 'union',
    detect: function(entry) {
        return _.isArray(entry);
    },
    childTypes: function(defn) {
        return defn.map(function(d) {
            return {
                keys: _.constant(true),
                type: d
            };
        });
    },
    children: function(defn, value) {
        return [{ key: '', type: value }];
    },
    validate: {
        pre: function(defn, value) {},
        post: function(defn, value, childrenErrors) {}
    }
}, {
    name: 'fixed',
    requires: ['name', 'size'],
    validate: {
        pre: function(defn, value) {
            // byte count of value
        },
        post: function(defn, value, childrenErrors) {}
    }
}, {
    name: '$attribute',
    requires: ['name', 'requires']
}]

// Global, non-primitive attributes

[{
    name: 'namespace',
    type: '$attribute',
    requires: function(obj) {
        assert(isNonEmptyString(obj.namespace), 'msg');
    }
}, {
    name: 'type',
    type: '$attribute',
    requires: function(obj) {
        assert(isNonEmptyString(obj.type), 'msg');
    }
}, {
    name: 'doc',
    type: '$attribute',
    requires: function(obj) {
        assert(_.isString(obj.doc), 'msg');
    }
}, {
    name: 'aliases',
    type: '$attribute',
    requires: function(obj) {
        assert(_.isArray(obj.aliases), 'msg');
        obj.aliases.forEach(function(a) {
            assert(isNonEmptyString(a), 'msg');
        });
    }
}, {
    name: 'fields',
    type: '$attribute',
    requires: function(obj) {
        assert(isGlobalType(obj, 'record'), 'msg');
        assert(_.isArray(obj.fields), 'msg');
        obj.fields.forEach(function(f) {
            assert(_.isPlainObject(f), 'msg');
            assert(isNonEmptyString(f.name), 'msg');
            assert(isUniqueKey(f.name), 'msg');
            assert(f.type, 'msg');
        });
    }
}, {
    name: 'default',
    type: '$attribute',
    requires: function(obj) {}
}, {
    name: 'order',
    type: '$attribute',
    requires: function(obj) {
        assert({ ascending: true, descending: true, ignore: true }[obj.order]);
    }
}, {
    name: 'symbols',
    type: '$attribute',
    requires: function(obj) {
        assert(isGlobalType(obj, 'enum'), 'msg');
        assert(_.isArray(obj.symbols), 'msg');
        obj.symbols.forEach(function(s) {
            assert(isNonEmptyString(s), 'msg');
        });
    }
}, {
    name: 'items',
    type: '$attribute',
    requires: function(obj) {
        assert(isGlobalType(obj, 'array'), 'msg');
        assert(obj.items, 'msg');
    }
}, {
    name: 'values',
    type: '$attribute',
    requires: function(obj) {
        assert(isGlobalType(obj, 'map'), 'msg');
        assert(obj.values, 'msg');
    }
}, {
    name: 'size',
    type: '$attribute',
    requires: function(obj) {
        assert(isGlobalType(obj, 'fixed'), 'msg');
        assert(_.isInteger(obj.size), 'msg');
    }
}, {
    name: '$validation',
    type: '$attribute',
    requires: function(obj) {
        assert(isGlobalType(obj, '$attribute'), 'msg');
        assert(_.isFunction(obj.$validation), 'msg');
    }
}]
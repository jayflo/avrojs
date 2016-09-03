# AvroJS

# Under Construction

<!---

1. [How it works](#howItWorks)

AvroJS enriches standard AVRO JSON schemas by allowing you to:

  1. define custom "validation" types
  2. name previously un-nameable types

# How it works<a name="howItWorks"></a>

Suppose you have an `array` type in an AVRO schema that you want to ensure has at least two items.  With AvroJS you can do the following:

```js
[{
  "type": "array",
  "items": "string",
  "$lenGte": 2
}]
```

Suppose also that you would like the `string` items to match a regular expression:

```js
[{
  "name": "$$spacedString",
  "type": "string",
  "$reStr": "\w(\s\w)*"
}, {
  "type": "array",
  "items": "$$spacedString",
  "$lenGte": 2
}]
```

SUPPOSE ALSO that you have a `string` validation so complex that AvroJS could not even attempt to replicate, but you, master of the JS universe, easily compact it into a simple method `uberComplexity`.  You can still use this for validation, but the schema must be written as a JS array:

```js
var somethingElse = getSomething();
var schema =
[{
  name: '$$uber',
  type: function(uberArg1, uberArg2, str) {
    return uberComplexity(uberArg1, uberArg2, somethingElse, str);
  }
}, {
  name: '$$uberStringAB',
  type: 'string',
  $$uber: ['A', 'B']
}, {
  type: 'array',
  items: '$$uberStringAB',
  $lenGte: 2
}]
```

Or maybe you don't actually need `$$uber` anywhere else and you'd rather just validate the items of this array yourself:

```js
var somethingElse = getSomething();
var uberArg1 = 'A';
var uberArg2 = 'B';
var schema =
[{
  type: 'array',
  items: 'string',
  $lenGte: 2,
  $$uberArray: function(arr) {
    return arr.every(function(str) {
      return uberComplexity(uberArg1, uberArg2, somethingElse, str);
    });
  }
}]
```

Now you decide you want to reuse the whole array!

```js
var somethingElse = getSomething();
var uberArg1 = 'A';
var uberArg2 = 'B';
var schema =
[{
  name: '$$reusableUberArray',
  type: 'array',
  items: 'string',
  $lenGte: 2,
  $$uberArray: function(arr) {
    return arr.every(function(str) {
      return uberComplexity(uberArg1, uberArg2, somethingElse, str);
    });
  }
}, {
  name: 'uberRecord',
  type: 'record',
  fields: [{
    name: 'uberField', type: '$$reusableUberArray'
  }]
}]
```

AvroJS also provides an export method that removes all `$` custom attributes/types to provide a valid AVRO JSON schema.

# Built-in (JSON friendly) Validations<a name="builtInValidations"></a>

The validators listed below are used as, e.g.:

```js
{
  type: '...',
  $validation: arg // or [arg1, arg2, ...]
}
```

| name | arg(s) | input | assertion |
| --- | --- | --- | --- | --- |
| `$lt` | `Number` | `Number` | `input < arg` |  
| `$lte` | `Number` | `Number` | `input <= arg` |  
| `$gt` | `Number` | `Number` | `input > arg` |  
| `$gte` | `Number` | `Number` | `input >= arg` |  
| `$lenLt` | `Number` | `arrayLike` | `input.length < arg` |  
| `$lenLte` | `Number` | `arrayLike` | `input.length <= arg` |  
| `$lenGt` | `Number` | `arrayLike` | `input.length > arg` |  
| `$lenGte` | `Number` | `arrayLike` | `input.length >= arg` |  
| `$keyCntLt` | `Number` | `Object` | `Object.keys(input).length < arg` |  
| `$keyCntLte` |`Number`  | `Object` | `Object.keys(input).length <= arg` |  
| `$keyCntGt` | `Number` | `Object` | `Object.keys(input).length > arg` |  
| `$keyCntGte` | `Number` | `Object` | `Object.keys(input).length >= arg` |  
| `$re` | `RegExp` | `String` | `arg.test(input)` |  
| `$reStr` | `[String, String]` | `String` | `new RegExp(arg1, arg2).text(input)` |  
| `$keyRe` | `RegExp` | `Object` | `Object.keys(input).every(function(item) { return arg.test(item)) })` |
| `$keyReStr` | `[String, String]` | `Object` | `Object.keys(input).every(function(item) { return new RegExp(arg1, arg2).test(item)) })` |

Built-in validators live in the "null" namespace, i.e. `''`.  Other than AVRO specific validation checks, there is nothing special about built-in validators and their definitions *will be overridden* but custom validators of the same name in the null namespace.  We suggest that you prefix all your validator names with `$$` to differentiate AvroJS definitions (which use a single `$`) from your own.

# Validators<a name="validators"></a>

Validators can be though of as "Function" types and are defined in the schema as follows:

```js
[{
  name: '$$validatorName',
  namespace: 'A.B',
  priority: 1,
  type: function(args..., value) {
    return trueOrFalse(args..., value);
  }
}]
```

Supported attributes:

1. `name`: `String`, **required**.  The string to be used as a key on a type definition to apply the validator.  **Must start with a `$` and it is recommended you start with `$$` to differentiate from built-in validators.**
2. `namespace`: `String`.  Use if you want to restrict the definition to a namespace.
3. `priority`: `Integer`, default `1`.  Used to determine validation order.   Non built-in validators cannot have priority 0.  Negative priorities are valid.  See *Priority* section below.
4. `type`: `Function`, **required**.  The validation function.  When `name` is added to a type definition, it's value will be the initial positional arguments provided to the function, and the value being validated the last.  E.g.

  ```js
  [{
    name: '$$inOpenInterval',
    type: function(a, b, value) {
      return value > a && value < b;
    }
  }, {
    name: '$$float01',
    type: 'float',
    $$inOpenInterval: [0, 1]
  }]
  ```

  During validation on a `$$float01`, the `$$inOpenInterval` validation function will have arguments `a=0`, `b=1` and `value` the float being validated (should it exist).


# Validated types<a name="validatedTypes"></a>

These are native AVRO types decorated with custom (validator) attributes that can be referenced by name; just like standard "nameable" types.  In AVRO, the only nameable types are `record`, `enum` and `fixed`.  Typically there may not be much need for naming other types, but now you can bundle a type with it's validation and reuse it.

```js
[{
  name: '$$myValidatedInt',
  namespace: 'A.B',
  type: 'int',
  $lt: 10,
  $gte: 0
}]
```

You can then use the name `A.B.$$myValidatedInt` as you would a usual nameable type.  Although the `$$` prefix in the `name` is not required, it is highly recommended so that AVRO, AvroJS, and your own custom definitons are clearly distinguishable.

---

# `name` and `namespace`<a name="nameAndNamespace"></a>

`name` + `namespace` follow all the usual (AVRO specification)[https://avro.apache.org/docs/current/spec.html#names] rules, and this includes validators' keys.  For example, both validators

```js
[{
  name: 'A.B.$$validator1',
  type: function(value) { /* ... */ }
}, {
  name: '$$validator2',
  namespace: 'A.B',
  type: function(value) { /* ... */ }
}]
```

must be used as follows *when outside the namespace* `A.B`:

```js
{
  type: 'string',
  'A.B.$$validator1': ['arg1', 'arg2']
}
```

# Priority and Built-in validator priority overrides<a name="priority"></a>

Priority can be used to orchestrate the order that validations are applied which can effect when validation algorithms exit, e.g. stop validation of object on first failed validation ("fail fast"). In the absence of any overrides, validation order is as follows:

| name | Priority | Description |
| --- | --- | --- |
| `$type` | -1 | type/nullability checking |
| N/A | 0 | child validations for `record`, `map`, `array` and `union` types |
| see above | 1 | built-in validators default |

You can override the priority of any validator "inline" by appending `:X`, where `X` is the new priority, to a validator's key.  For example:

```js
{
  type: 'map',
  items: 'string',
  $keyRe: /\d+/,
  '$keyCntLt:2': 3
}
```

will validate that `map`'s keys are integers via regular expression before it checks the key count is less than 3.  "Inline" priorities override the `priority` property defined in custom validators.  The priority of type checking can be changed via the `$type` key.  `$type` exists only to change the priority of type checking on the specified schema entry; its value is ignored.

# API Documentation<a name="apiDocs"></a>

-->
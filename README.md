# AvroJS

# Under Construction

AvroJS enriches standard AVRO JSON schemas by allowing you to:

  1. define validation attributes
  2. define validated types

# How it works

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
  items: '$$uberString',
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
  items: '$$uberString',
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
  name: '$$uberArray2'
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

AvroJS also provides an export method that removes all `$` custom attributes/types to provide a valid AVRO JSON schema.

# Built-in (JSON friendly) Validations

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
| `$type` | N/A | N/A | set the priority of type checking (see *Priority* section below) |

### !Provide a mechanism to include pseudo-built-in validators.

# Custom validators

Custom validators can be added into the schema as follows:

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

1. `name`: `String`, **required**.  The string used (later as a key) to refer to the validator.  **Must start with a `$` and it is recommended you start with `$$` to differentiate from built-in validators.**
2. `namespace`: `String`.  Use if you want to restrict the definition to a namespace.
3. `priority`: `Integer`, default `1`.  Used to determine validation order.   Custom validators my not have priority 0.  Negative priorities are valid.  See *Priority* section below.
4. `type`: `Function`, **required**.  The validation function.  The arguments provided to the property `name` when applied to a schema entry are given as the initial positional parameters, and the value being tested as the last.

### `name`/`namespace`

`name` + `namespace` follow the (AVRO specification)[https://avro.apache.org/docs/current/spec.html#names] the same as any other named types, e.g. `record`, `fixed`.  If you define a `name` as a fullname, e.g. `A.B.$$validator`, or you provide a `name: $$validator` with `namespace: A.B`, and you wish to use the validator outside the namespace `A.B`, you must refer to it via the fullname, e.g.

```js
{
  type: 'record',
  'A.B.$$validator': ['arg1', 'arg2']
}
```

### Priority and Priority Overrides

Priority can be used to orchestrate the order that validations are applied.  In the absence of custom validations, application order is as follows:

| Priority | Description |
| --- | --- |
| -1 | type/nullability checking (customisable) |
| 0 | child validations for `record`, `map`, `array` and `union` types |
| 1 | built-in validators |

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

# Custom types

These are native AVRO types decorated with custom (validator) attributes.

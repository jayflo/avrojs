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

# Validators<a name="validators"></a>

Validators can be thought of as "Function" types and are defined in the schema as follows:

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
3. `priority`: `Integer`, default `2`.  Used to determine validation order.   Non built-in validators cannot have priority 0.  Negative priorities are valid.  See *Priority* section below.
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

  During validation on a `$$float01`, the `$$inOpenInterval` validation function will have arguments `a=0`, `b=1` and `value` the float being validated (should it exist).  Array brackets around validator arguments are not necessary when only *one* argument is to be passed and that argument is *not* an array.  For example, `$$validation: [[0, 1]]` would pass the array `[0, 1]` as the *first* argument to `$$validation`'s validator function.  To pass no arguments, you must use `$$validation: []`.

Validations can also be defined "inline" when they only need to be used once:

```js
[{
  type: 'array',
  items: 'string',
  $usedOnce: function(value) { /* ... */ }
}]

Validations defined inline receive only one argument which is the value to be validated.

# Built-in (JSON friendly) Validations: Simple List<a name="builtInValidations"></a>

The validators listed below are used as follows:

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

Built-in validators are injected into every namespace similar to AVRO primitives.  HOWEVER, you **can** override their definition for specific namespaces simply by creating a validator with the same name.  For example, when `$lt` is used within namespace `org.X`, we first look for a definition of `$lt` whose `namespace = 'org.X'` before falling back to the built-in definition.

**We suggest that you prefix all your validator names with `$$` to differentiate AvroJS definitions (which use a single `$`) from your own.**

There are other built-in validations whose definitions first require an understanding of *Priority*.  Please see the Priority section below.

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

# Priority and Built-in priority overrides<a name="priority"></a>

Priority can be used to orchestrate the order that validations are applied which can effect when validation algorithms exit, e.g. stop validation of object on first failed validation ("fail fast"). In the absence of any overrides, validation order is as follows:

| name(s) | Priority | Priority overridable | Description |
| --- | --- | --- | --- |
| `$in` | ``-Infinity` | No | pre-validation transform |
| `$avro` | `-1` | Yes | native AVRO validation |
| N/A | `0` | No | child validations for `record`, `map`, `array` and `union` types |
| see above | `1` | Yes | built-in validators default |
| see above | `2` | Yes | custom validators default |
| `$out` | `Infinity` | No | post-validation transform  |

You can override the priority of a validator with overridable priority "inline" by appending `:X`, where `X` is the new priority, to the validator's key.  For example:

```js
{
  type: 'map',
  items: 'string',
  $keyRe: /\d+/,
  '$keyCntLt:2': 3
}
```

will validate that `map`'s keys are integers via regular expression before it checks the key count is less than 3.  Of course, "inline" priorities take precedence over the `priority` value in the validator's definition.  **You cannot override a priority to `0`**.

# Special keys

These are keys that can be added to schema entries whose value and/or priority cannot be overriden.

1. `$avro`: exists only to allow changing of the priority of AVRO validations; any value is ignored.  Suppose you want to perform some validation(s) after the AVRO validation, but before children are validated:

  ```js
  {
    type: 'record',
    '$avro:-2': 'n/a',
    $custom: function(value) { /* do something here before recursion */ },
    fields: [/*...*/]
  }
  ```

2. `$in`: (**MUTATES**) define a function whose return value will mutate the object being validated *before* any validations occur.

  ```js
  {
    name: '$$escapeHtml',
    type: 'string',
    $in: function(value) { return escapeHtml(value); }
  }
  ```

  Since `$in` has priority `-Infinity`, the value of the string within the object being validated will be escaped before **any** validations occur.

3. `$out`: (**MUTATES**) define a function whose return value will mutate the object being validated *after* all validations occur.

```js
{
  name: '$$escapeHtml',
  type: 'string',
  $out: function(value) { return escapeHtml(value); }
}
```

In this case, all validations will be performed on the raw (unescaped) HTML, but the escaped HTML will be present in the object after the validation method has finished.

It is highly recommended that you avoid the use of `$in` and `$out` if at all possible.  They exist for special cases where the results of such mutations will be minimal, e.g. for use on primitives.  For example, transforming the string representation of an `enum` value for display on UI.

# API Documentation<a name="apiDocs"></a>

-->

# Json Joi

[![Build Status](https://travis-ci.org/rundef/json-joi-converter.svg?branch=master)](https://travis-ci.org/rundef/json-joi-converter)
[![Node version required](https://img.shields.io/node/v/json-joi-converter.svg)](https://www.npmjs.com/package/json-joi-converter)
[![Latest Stable Version](https://img.shields.io/npm/v/json-joi-converter.svg)](https://www.npmjs.com/package/json-joi-converter)

Json-Joi is a powerfull TypeScript module that builds on top of [Joi](https://www.npmjs.com/package/@hapi/joi) module. Converts Joi objects to json and vice versa, makes Joi objects from json.

From Joi description: "The most powerful schema description language and data validator for JavaScript."

See [Joi API](https://hapi.dev/module/joi/api/?v=17.1.1) for documentation and api.

Json-Joi supports almost entire Joi API!

## Installation

```bash
npm install json-joi-converter
```

### Usage

```js
import Joi, {fromJson, toJson, Schema} from 'json-joi-converter';

const json: Schema = {
  type: "object",
  properties: {
    a: {
      type: "number",
      min: 100,
      max: 1000
    }
  }
};

// fromJson(json) is equal to following

const joi = Joi.object({
  a: Joi.number().min(100).max(1000)
});

// toJson(joi) is equal to "const json"

console.log(JSON.stringify(toJson(joi)) === JSON.stringify(toJson(fromJson(json)))); // TRUE


```

### Joi Reference & Functions
```js
{
  a: {
    type: "number"
  },
  b: {
    type: "number",
    min: {
      $ref: "a",
      adjust: "value => value + 1"
    }
  }
}

// where adjust is a stringed function

// is equal to
Joi.object({
  a: Joi.number(),
  b: Joi.number.min(Joi.ref("a", {
    adjust: value => value + 1
  }))
})
```

### Joi RegExp
```js
{
  type: "string",
  replace: {find: {$regex: "a", flags: "gi"}, replace: "b"}
}

// is equal to
Joi.string().replace(/a/gi, "b")

{
  type: "string",
  replace: [
    {find: {$regex: "a", flags: "gi"}, replace: "b"},
    {find: "a", replace: "b"}
  ]
}

// is equal to
Joi.string().replace(/a/gi, "b").replace("a", "b")

```
import * as Joi from "@hapi/joi";
import {StringSchema} from "@hapi/joi";
import {isObject, regexToString, extractRef, jsonToRegex, jsonToRef, propertiesToJson} from "./Utils";
import {
  Schema,
  ObjectSchema,
  TypeReplace
} from "./Interfaces";

let OptionKey: any = {
  example: "example",
  external: "method",
  length: "limit",
  max: "limit",
  min: "limit",
  pattern: "pattern",
  regex: "pattern",
};


export function fromJson(json: any): Joi.Schema {
  let validation: any = json.type === "object" ? Joi.object(propertiesToJson((json as ObjectSchema).properties)) : (Joi as any)[json.type]();
  for (let k in json) {

    switch (k) {
      case "type":
      case "properties":
        break;
      // no arguments
      case "exist":
      case "forbidden":
      case "keep":
      case "optional":
      case "required":
      case "warn":
      case "warning":
      case "integer":
      case "negative":
      case "port":
      case "positive":
      case "alphanum":
      case "creditCard":
      case "hostname":
      case "insensitive":
      case "isoDate":
      case "isoDuration":
      case "lowercase":
      case "token":
      case "uppercase":
      case "iso":
        validation = validation[k]();
        break;

      // single/no argument
      case "empty":
      case "base64":
      case "dataUri":
      case "domain":
      case "email":
      case "guid":
      case "hex":
      case "ip":
      case "normalize":
      case "uri":
      case "uuid":
      case "schema":
      case "sort":
        if (k === "uri" && isObject(json[k]) && "scheme" in json[k])
          json[k].schema = Array.isArray(json[k].schema) ? json[k].schema.map((o: any) => jsonToRegex(o)) : jsonToRegex(json[k].schema);
        validation = json[k] === true ? validation[k]() : validation[k](json[k]);
        break;

      // single argument
      case "allow":
      case "alter":
      case "cast":
      case "concat":
      case "default":
      case "description":
      case "disallow":
      case "equal":
      case "error":
      case "extract":
      case "failover":
      case "id":
      case "invalid":
      case "label":
      case "message":
      case "messages":
      case "meta":
      case "not":
      case "note":
      case "only":
      case "options":
      case "prefs":
      case "preferences":
      case "presence":
      case "raw":
      case "rule":
      case "shared":
      case "strict":
      case "strip":
      case "tag":
      case "tailor":
      case "unit":
      case "valid":
      case "validate":
      case "falsy":
      case "sensitive":
      case "truthy":
      case "greater":
      case "less":
      case "multiple":
      case "precision":
      case "sign":
      case "unsafe":
      case "case":
      case "trim":
      case "truncate":
      case "append":
      case "keys":
      case "unknown":
      case "has":
      case "single":
      case "sparse":
      case "encoding":
      case "timetamp":
      case "match":
      case "min":
      case "max":
      case "length":
      case "map": {
        let arg = json[k];
        if (["default", "multiple", "less", "max", "min", "greater", "length"].includes(k)) {
          if (isObject(arg) && !("$ref" in arg)) {
            if ("limit" in arg)
              arg.limit = jsonToRef(arg.limit);
            else if ("base" in arg)
              arg.base = jsonToRef(arg.base);
          }
          else
            arg = jsonToRef(arg);
        }
        validation = validation[k](arg);
      }
        break;

      // with options
      case "example":
      case "external":
      case "fork": {
        let arg1, arg2, key = OptionKey[k] || k;
        if (isObject(json[k]) && key in (json[k] as any)) {
          arg1 = json[k][key];
          delete json[k][key];
          arg2 = json[k][key];
        }
        else
          arg1 = json[k];

        if (k === "external")
          arg1 = eval(arg1);

        // @ts-ignore
        validation = arg2 !== undefined ? validation[k](arg1, arg2) : validation[k](arg1);
        break;
      }

      // spread
      case "items":
      case "ordered":
      case "try":
        validation = validation[k](...json[k]);
        break;

      // peers
      case "and":
      case "nand":
      case "or":
      case "oxor":
      case "xor":
        let args;
        if (isObject(json[k])) {
          if ("options" in json[k])
            args = [...json[k].peers, json[k].options];
          else
            args = json[k].peers;
        }
        else
          args = json[k];

        validation = validation[k](...args);
        break;

      // with options property
      case "pattern":
      case "regex": {

        if (json[k].type === "object")
          validation = (validation as Joi.ObjectSchema).regex();
        else {
          let arg1, arg2, arg3, key = OptionKey[k] || k;
          if (isObject(json[k]) && key in json[k]) {
            arg1 = json[k][key];
            arg2 = json[k].options;
            // object pattern
            arg3 = json[k].schema;
          }
          else
            arg1 = json[k];

          arg1 = jsonToRegex(arg1);

          validation = arg3 !== undefined ? validation[k](arg1, arg2, arg3) : arg2 !== undefined ? validation[k](arg1, arg2) : validation[k](arg1);
        }

        break;
      }

      case "unique":
        if (json[k] === true)
          validation = validation[k]();
        else if (isObject(json[k])) {
          const comparator: Function = eval(json[k].comparator);
          validation = "options" in json[k] ? validation[k](comparator, json[k].options) : validation[k](comparator);
        }
        break;

      case "rename":
        const from: string = json[k].from;
        const to: string = json[k].to;
        delete json[k].from;
        delete json[k].to;
        validation = validation[k](from, to, json[k]);
        break;

      case "replace":
        if (Array.isArray(json[k]))
          json[k].forEach((f: TypeReplace) => {
            validation[k] = validation[k](jsonToRegex(json[k].find), json[k].replace);
          });
        else
          validation[k] = validation[k](jsonToRegex(json[k].find), json[k].replace);
        break;

      case "assert":
        let reference, schema, message;
        if (isObject(json[k])) {
          reference = json[k].reference;
          schema = json[k].schema;
          message = json[k].message;
        }
        else if (Array.isArray(json[k]))
          [reference, schema, message] = json[k];

        reference = jsonToRef(reference);

        validation = message !== undefined ? validation[k](reference, schema, message) : validation[k](reference, schema);

        break;

      case "with":
      case "without": {
        let key, peers, options;
        if (isObject(json[k])) {
          key = json[k].key;
          peers = json[k].peers;
          options = json[k].options;
        }
        else if (Array.isArray(json[k]))
          [key, peers, options] = json[k];

        validation = message !== undefined ? validation[k](key, peers, options) : validation[k](key, peers);

      }
        break;

      case "when":
      case "conditional":
        let ref = null;
        if ("reference" in json[k]) {
          ref = jsonToRef(json[k].reference);
          delete json[k].reference;
        }
        else if ("schema" in json[k]) {
          ref = fromJson(json[k].schema);
          delete json[k].schema;
        }
        validation = validation[k](ref, json[k]);
        break;
      default:
        throw new Error(`Validation "${k}" not found!`);
    }
  }
  return validation;
}

export function toJson(joi: any): Schema {
  const json: any = {
    type: joi.type as Schema["type"]
  };
  Object.keys(joi).forEach((key: string) => {
    const value = joi[key];
    switch (key) {
      case "_valids":
      case "_invalids":
        let schemaKey = null;
        switch (key) {
          case "_valids":
            schemaKey = "valid";
            break;
          case "_invalids":
            schemaKey = "invalid";
            break;
        }
        if (value) {
          json[schemaKey] = [];
          if (value._values)
            json[schemaKey] = [...json[schemaKey], ...Array.from(value._values)];
          if (value._refs)
            json[schemaKey] = [...json[schemaKey], ...Array.from(value._refs)];
        }
        break;
      case "_flags":
        if (joi[key]) {
          if ("default" in joi[key])
            json.default = joi[key].default;
          if ("presence" in joi[key])
            json[joi[key].presence] = true;
        }

        break;
      case "_singleRules":
      case "_rules":
        joi[key].forEach((rule: any) => {
          let method: string = rule.method;
          const optionsOnly: Array<string> = ["guid", "uuid", "email", "hex", "hostname", "ip", "base64", "dataUri", "domain"];
          let value = optionsOnly.includes(method)
            ? ((!!Object.keys(rule.args?.options || {}).length) ? rule.args.options : true)
            : (!!Object.keys(rule.args || {}).length) ? rule.args : true;

          if (["length", "compare"].includes(method))
            switch (rule.operator) {
              case ">=":
                method = "min";
                break;
              case "<=":
                method = "max";
                break;
              case "<":
                method = "less";
                break;
              case ">":
                method = "greater";
                break;
            }

          if (method === "sign") {
            switch (value.sign) {
              case "positive":
                method = "positive";
                value = true;
                break;
              case "negative":
                method = "negative";
                value = true;
                break;
            }
          }


          if (value?.limit)
            value.limit = extractRef(value?.limit);

          if (isObject(value)) {
            if (isObject(value) && "limit" in value && Object.keys(value).length === 1)
              value = value.limit;
            if (isObject(value) && "base" in value && Object.keys(value).length === 1)
              value = value.base;
            if (isObject(value) && "regex" in value)
              value.regex = regexToString(value.regex);
          }

          json[method] = value;

        });
        break;
      case "$_terms":
        if (Array.isArray(joi[key]?.replacements)) {
          // @ts-ignore
          (json as StringSchema).replace = joi[key].replacements.map(r => {
            return {
              find: (r.pattern instanceof RegExp) ? regexToString(r.pattern) : r.pattern,
              replace: r.replacement
            };
          });
        }
        break;
      case "_ids":
        if (value._byKey && json.type === "object") {
          (json as ObjectSchema).properties = {};
          value._byKey.forEach((k: any) => {
            (json as ObjectSchema).properties[k.id] = toJson(k.schema);
          })
        }
    }
  });

  return json;
}

export {Schema};
export default Joi;
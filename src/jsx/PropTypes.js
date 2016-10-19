const { ensure, Exists, Length, Type } = require('./ensure');

function string(key, value) {
  ensure(Type(value), 'string', `PropType "${key}" must be a string`);
}

function number(key, value) {
  ensure(Type(value), 'number', `PropType "${key}" must be a number`);
}

function array(key, value) {
  return Array.isArray(value);
}

function children(keys) {
  function validateChildren(key, value) {
    ensure(Length(value), keys.length, `PropType "children" requires a length of ${keys.length} for this type.`);
    return value.every(child => child.constructor);
  }
  validateChildren.types = keys;
  return enhance(validateChildren);
}

function oneOf(types) {
  return (key, value) => types.forEach(type => type(key, value));
}

function enhance(fn) {
  fn.isRequired = function(key, value) {
    ensure(Exists(value), `PropType "${key}" is required.`);
    fn(key, value);
  };
  fn.isRequired.types = fn.types;
  return fn;
}

module.exports = {
  children: children,
  string: enhance(string),
  number: enhance(number),
  array: enhance(array),
  oneOf: enhance(oneOf),
};

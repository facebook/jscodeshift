function ensure({ test, value }, data, message) {
  const result = test(data);
  if (!result) {
    throw new Error(message || data);
  }
}

function Exists(value) {
  return {
    value,
    test: () => value !== undefined,
  };
}

function Length(value) {
  return {
    value: value.length,
    test: (length) => {
      return value.length === length;
    },
  };
}

function Type(value) {
  return {
    value: typeof value,
    test: (type) => typeof value === type,
  }
}

module.exports = {
  ensure: ensure,
  Exists: Exists,
  Length: Length,
  Type: Type,
};

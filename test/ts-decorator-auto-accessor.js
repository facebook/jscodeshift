function transformer(file, api) {
  const j = api.jscodeshift;

  return j(file.source).toSource();
}

module.exports = transformer;

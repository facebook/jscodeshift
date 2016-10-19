const j = require('../core');
const AstWrapper = require('./AstWrapper');
const components = require('./components');
const { createElement } = require('./util');

function jsx(source) {
  return new AstWrapper(j(source));
}
jsx.createElement = createElement;

module.exports = Object.assign(jsx, components);

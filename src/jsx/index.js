const { createElement, parse } = require('./util');
const components = require('./components');

const jsx = Object.assign(parse, components, {
  createElement: createElement,
});

module.exports = jsx;

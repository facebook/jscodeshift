const j = require('../core');
const { fromNodes } = require('../Collection');

const { ensure, Exists, Length } = require('./ensure');

module.exports = class AstWrapper {
  constructor(ast) {
    this.ast = ast;
  }

  length() {
    return this.ast.nodes().length;
  }

  toSource() {
    return this.ast.toSource();
  }

  at(index) {
    const nodes = this.ast.nodes();
    ensure(Exists(nodes[index]), `No node at index: ${index}`);
    return new AstWrapper(fromNodes([nodes[index]]));
  }

  debug() {
    return this.ast.toSource();
  }

  /* Single node methods */

  prop(key) {
    const nodes = this.ast.nodes();
    ensure(Length(nodes), 1, `Function must be called on 1 node. Found: ${nodes.length}`);
    return nodes[0][key];
  }

  type() {
    return this.prop('type');
  }

  /* Utility methods */

  find(component) {
    const found = this.ast.find(j[component.TYPE], component.matches.bind(component));
    return new AstWrapper(found);
  }

  remove() {
    this.ast.remove();
    return this;
  }

  setProp(key, value) {
    this.ast.nodes().forEach(node => {
      node[key] = value;
    });
    return this;
  }

  replaceWith(arg) {
    if (typeof arg === 'function') {
      this.ast.nodes().forEach((childNode, index) => {
        const childAst = fromNodes([childNode]);
        const component = new AstWrapper(childAst);
        this.ast.at(index).replaceWith(arg(component).toAST());
      });
    } else {
      this.ast.replaceWith(arg.toAST());
    }
    return this;
  }

  /* Iteration methods */

  forEach(callback) {
    this.ast.nodes().forEach(node => {
      callback(new AstWrapper(node));
    });
    return this;
  }
}

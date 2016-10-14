const j = require('../../core');
const { ensure, Exists, Length } = require('../ensure');

const existsError = 'VariableDeclarator must have children';
const lengthError = 'VariableDeclarator must have two children';

module.exports = class VariableDeclarator {
  constructor(props) {
    this.TYPE = 'VariableDeclarator';
    this.props = props;
  }

  toAST() {
    const { children } = this.props;
    ensure(Exists(children), existsError);
    ensure(Length(children), 2, lengthError);
    return j.variableDeclarator(
      children[0].toAST(),
      children[1].toAST()
    );
  }

  matches(node) {
    const { children } = this.props;
    const filters = [];
    if (children.length !== 0) {
      ensure(Length(children), 2, lengthError);
      filters.push(ast => (
        ast.id.type === children[0].TYPE &&
        ast.init.type === children[1].TYPE &&
        children[0].matches(ast.id) &&
        children[1].matches(ast.init)
      ));
    }
    return filters.every(filter => filter(node));
  }
}

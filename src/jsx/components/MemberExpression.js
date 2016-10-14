const j = require('../../core');
const { ensure, Exists, Length } = require('../ensure');
const { arrayEquals } = require('../util');

const existsError = 'MemberExpression must have children';
const lengthError = 'MemberExpression must have two children';

module.exports = class MemberExpression {
  constructor(props) {
    this.TYPE = 'MemberExpression';
    this.props = props;
  }

  toAST() {
    const { children } = this.props;
    ensure(Exists(children), existsError);
    ensure(Length(children), 2, lengthError);
    return j.memberExpression(
      children[0].toAST(),
      children[1].toAST()
    );
  }

  matches(node) {
    const { args, children } = this.props;
    const filters = [];
    if (args) {
      filters.push(ast => arrayEquals(args, ast.arguments));
    }
    if (children.length !== 0) {
      ensure(Length(children), 2, lengthError);
      filters.push(ast => (
        ast.object.type === children[0].TYPE &&
        ast.property.type === children[1].TYPE &&
        children[0].matches(node.object) &&
        children[1].matches(node.property)
      ));
    }
    return filters.every(filter => filter(node));
  }
}

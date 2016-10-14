const j = require('../../core');
const { arrayEquals } = require('../util');
const { ensure, Exists, Length } = require('../ensure');

const existsError = 'CallExpression must have a child.';
const lengthError = 'CallExpression must have only one child';

module.exports = class CallExpression {
  constructor(props) {
    this.TYPE = 'CallExpression';
    this.props = props;
  }

  toAST() {
    const { children } = this.props;
    ensure(Exists(children), existsError);
    ensure(Length(children), 2, lengthError);
    return j.callExpression(children[0]);
  }

  matches(node) {
    const { args, children } = this.props;
    const filters = [];
    if (args) {
      filters.push(ast => arrayEquals(args, ast.arguments));
    }
    if (children.length !== 0) {
      ensure(Length(this.props.children), 1, lengthError);
      filters.push(ast => (
        ast.callee.type === children[0].TYPE &&
        children[0].matches(ast.callee)
      ));
    }
    return filters.every(filter => filter(node));
  }
}

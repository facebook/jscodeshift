const j = require('../../core');

module.exports = class Literal {
  constructor(props) {
    this.TYPE = 'Literal';
    this.props = props;
  }

  toAST() {
    return j.literal(this.props.value);
  }

  matches(node) {
    return node.value === this.props.value;
  }
}

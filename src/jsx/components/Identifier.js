const j = require('../../core');
const { ensure, Exists } = require('../ensure');

const error = 'Identifier must have a <name> prop.';

module.exports = class Identifier {
  constructor(props) {
    this.TYPE = 'Identifier';
    this.props = props;
  }

  toAST() {
    const { name } = this.props;
    ensure(Exists(name), error);
    return j.identifier(this.props.name);
  }

  matches(node) {
    const { name } = this.props;
    return name ? node.name === name : true;
  }
}

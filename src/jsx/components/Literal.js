const j = require('../../core');
const { oneOf, string, number } = require('../PropTypes');

module.exports = class Literal {

  static propTypes = {
    value: oneOf([string, number])
  };

  static toAST = ({ value }) => {
    return j.literal(value);
  }

}

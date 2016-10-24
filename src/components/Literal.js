const recast = require('recast');
const { oneOf, string, number } = require('./PropTypes');

module.exports = class Literal {

  static propTypes = {
    value: oneOf([string, number])
  };

  static toAST = ({ value }) => {
    return recast.types.builders.literal(value);
  }

}

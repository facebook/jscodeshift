const recast = require('recast');
const PropTypes = require('./PropTypes');

module.exports = class Identifier {

  static propTypes = {
    name: PropTypes.string.isRequired,
  };

  static toAST = ({ name }) => {
    return recast.types.builders.identifier(name);
  }

}

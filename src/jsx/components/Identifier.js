const j = require('../../core');
const PropTypes = require('../PropTypes');

module.exports = class Identifier {

  static propTypes = {
    name: PropTypes.string.isRequired,
  };

  static toAST = ({ name }) => {
    return j.identifier(name);
  }

}

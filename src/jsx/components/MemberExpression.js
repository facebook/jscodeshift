const j = require('../../core');
const PropTypes = require('../PropTypes');

module.exports = class MemberExpression {

  static propTypes = {
    children: PropTypes.children(['object', 'property']).isRequired,
  };

  static toAST = ({ children }) => {
    return j.memberExpression(
      children[0].constructor.toAST(children[0].props),
      children[1].constructor.toAST(children[1].props),
    );
  }

}

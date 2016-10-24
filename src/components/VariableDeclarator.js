const recast = require('recast');
const PropTypes = require('./PropTypes');

module.exports = class VariableDeclarator {

  static propTypes = {
    children: PropTypes.children(['id', 'init']).isRequired,
  }

  static toAST = ({ children }) => {
    return recast.types.builders.variableDeclarator(
      children[0].constructor.toAST(children[0].props),
      children[1].constructor.toAST(children[1].props),
    );
  }

}

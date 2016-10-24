const recast = require('recast');
const PropTypes = require('./PropTypes');

module.exports = class CallExpression {

  static propTypes = {
    arguments: PropTypes.array.isRequired,
    children: PropTypes.children(['callee']).isRequired,
  };

  static toAST = (props) => {
    const children = props.children;
    return recast.types.builders.callExpression(
      children[0].constructor.toAST(children[0].props),
      props.arguments
    );
  }

}

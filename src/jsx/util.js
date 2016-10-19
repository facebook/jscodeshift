/*
 * This is what the jsx parser uses. We have to pass in the props,
 * even though our components have no constructor, to allow for
 * custom functional components.
 * From - <Identifier name="_" />
 * To   - jsx.createElement(Identifier, props, child1, child2, ...)
 */
function createElement(Component, props, ...children) {
  const finalProps = Object.assign(props || {}, { children });
  const astNode = new Component(finalProps);
  astNode.props = finalProps;
  return astNode;
}

/*
 * Run all PropType validators before calling toAST. The
 * validators will throw an error if the structure is invalid.
 */
function toAST(component) {
  Object.keys(component.constructor.propTypes).forEach(key => {
    component.constructor.propTypes[key](key, component.props[key]);
  });
  return component.constructor.toAST(component.props);
}

/*
 * Undefined prop values are treated as wildcards. Currently
 * the children prop defaults to an empty array, so that is a
 * separate wildcard check. For children we just check to see if the
 * child type matches with the ordering of children, and descend
 * from there.
 */
function find(component) {
  const { props } = component;
  const { propTypes } = component.constructor;
  return (node) => Object.keys(propTypes).every(propKey => {
    if (props[propKey] !== undefined) {
      if (propKey === 'children') {
        if (props.children.length === 0) {
          return true;  // children wildcard
        }
        return propTypes.children.types.every((childKey, i) => {
          return node[childKey].type === props.children[i].constructor.name && find(props.children[i])(node[childKey]);
        });
      } else {
        return node[propKey] === props[propKey];
      }
    } else {
      return true;  // wildcard
    }
  });
}

function arrayEquals(array1, array2) {
  if (array1 === array2) return true;
  if (array1 === null || array2 === null) return false;
  if (array1.length !== array2.length) return false;

  for (let i = 0; i < array1.length; i++) {
    if (array1[i] !== array2[i]) return false;
  }
  return true;
}

module.exports = {
  createElement: createElement,
  find: find,
  toAST: toAST,
  arrayEquals: arrayEquals
};

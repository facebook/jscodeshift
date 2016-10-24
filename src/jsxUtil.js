/*
 *  Copyright (c) 2015-present, Facebook, Inc.
 *  All rights reserved.
 *
 *  This source code is licensed under the BSD-style license found in the
 *  LICENSE file in the root directory of this source tree. An additional grant
 *  of patent rights can be found in the PATENTS file in the same directory.
 *
 */

 'use strict';

function jsxToAst(component) {
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
function matchJSX(component) {
  const { props } = component;
  const { propTypes } = component.constructor;
  return (node) => Object.keys(propTypes).every(propKey => {
    if (props[propKey] !== undefined) {
      if (propKey === 'children') {
        if (props.children.length === 0) {
          return true;  // children wildcard
        }
        return propTypes.children.types.every((childKey, i) => {
          const matchesType = node[childKey].type === props.children[i].constructor.name;
          return matchesType && matchJSX(props.children[i])(node[childKey]);
        });
      } else {
        return node[propKey] === props[propKey];
      }
    } else {
      return true;  // wildcard
    }
  });
}

module.exports = {
  jsxToAst: jsxToAst,
  matchJSX: matchJSX
};


/**
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

'use strict';

const hasOwn =
  Object.prototype.hasOwnProperty.call.bind(Object.prototype.hasOwnProperty);

/**
 * Checks whether needle is a strict subset of haystack.
 *
 * @param {*} haystack Value to test.
 * @param {*} needle Test function or value to look for in `haystack`.
 * @return {bool}
 */
function matchNode(haystack, needle) {
  if (typeof needle === 'function') {
    return needle(haystack);
  }
  if (isNode(needle) && isNode(haystack)) {
    return Object.keys(needle).every(function(property) {
      return (
        hasOwn(haystack, property) &&
        matchNode(haystack[property], needle[property])
      );
    });
  }
  return haystack === needle;
}

const DECORATOR_CONTAINERS = ['ClassDeclaration', 'ClassExpression', 'ClassMethod', 'ClassProperty'];

function isNode(value) {
  if (typeof value !== 'object' || !value) {
    return false;
  }
  if (value.type && DECORATOR_CONTAINERS.includes(value.type)) {
    return true;
  }
  return typeof value === 'object' && value !== null;
}

module.exports = matchNode;

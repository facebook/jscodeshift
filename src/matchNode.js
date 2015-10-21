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

var hasOwn =
  Object.prototype.hasOwnProperty.call.bind(Object.prototype.hasOwnProperty);

/**
 * Checks whether needle is a strict subset of haystack.
 *
 * @param {Object} haystack The object to test
 * @param {Object|Function} needle The properties to look for in test
 * @return {bool}
 */
function matchNode(haystack, needle) {
  if (typeof needle === 'function') {
    return needle(haystack);
  }
  var props = Object.keys(needle);
  return props.every(function(prop) {
    if (!hasOwn(haystack, prop)) {
      return false;
    }
    if (haystack[prop] &&
      typeof haystack[prop] === 'object' &&
      typeof needle[prop] === 'object') {
      return matchNode(haystack[prop], needle[prop]);
    }
    return haystack[prop] === needle[prop];
  });
}

module.exports = matchNode;

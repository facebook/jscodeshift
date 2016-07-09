/**
 *  Copyright (c) 2016-present, Facebook, Inc.
 *  All rights reserved.
 *
 *  This source code is licensed under the BSD-style license found in the
 *  LICENSE file in the root directory of this source tree. An additional grant
 *  of patent rights can be found in the PATENTS file in the same directory.
 */

/**
 * Example jscodeshift transformer. Simply reverses the names of all
 * identifiers.
 */
function transformer(file, api) {
  const j = api.jscodeshift;

  return j(file.source)
    .find(j.Identifier)
    .replaceWith(
      p => j.identifier(p.node.name.split('').reverse().join(''))
    )
    .toSource();
}

module.exports = transformer;

/**
 *  Copyright (c) 2016-present, Facebook, Inc.
 *  All rights reserved.
 *
 *  This source code is licensed under the BSD-style license found in the
 *  LICENSE file in the root directory of this source tree. An additional grant
 *  of patent rights can be found in the PATENTS file in the same directory.
 */

/**
 * Example jsx transformer. Simply reverses the names of all
 * identifiers.
 */
function transformer(file, { j }) {
  const { Identifier } = j.components;
  const reverse = str => str.split('').reverse().join('');
  return j(file.source)
    .find(<Identifier />)
    .replaceWith(path => <Identifier name={reverse(path.value.name)} />)
    .toSource();
}

module.exports = transformer;

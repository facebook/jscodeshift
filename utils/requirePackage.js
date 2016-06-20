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

const path = require('path');

module.exports = function requirePackage(name) {
	const entry = require.resolve(name);
  let dir = path.dirname(entry);
  while (dir !== '/') {
    try {
      const pkg = require(path.join(dir, 'package.json'));
      return pkg.name === name ? pkg : {};
    } catch(error) {} // eslint-disable-line no-empty
    dir = path.dirname(dir);
  }
  return {};
}

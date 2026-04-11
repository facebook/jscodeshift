
/**
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

'use strict';

const babylon = require('@babel/parser');
const baseOptions = require('./tsOptions');
const options = {
  ...baseOptions,
  plugins: baseOptions.plugins.map(plugin =>
    Array.isArray(plugin) && plugin[0] === 'typescript'
      ? ['typescript', { disallowAmbiguousJSXLikeChildren: true }]
      : plugin
  ),
};

/**
 * Doesn't accept custom options because babylon should be used directly in
 * that case.
 */
module.exports = function() {
  return {
    parse(code) {
      return babylon.parse(code, options);
    },
  };
};

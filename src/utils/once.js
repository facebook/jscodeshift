/*
 *  Copyright (c) Facebook, Inc. and its affiliates. All rights reserved.
 *
 *  This source code is licensed under the BSD-style license found in the
 *  LICENSE file in the root directory of this source tree. An additional grant
 *  of patent rights can be found in the PATENTS file in the same directory.
 *
 */

/**
 * This replicates lodash's once functionality for our purposes.
 */
module.exports = function(func) {
  let called = false;
  let result;
  return function(...args) {
    if (called) {
      return result;
    }
    called = true;
    return result = func.apply(this, args);
  };
};

/*
 *  Copyright (c) Facebook, Inc. and its affiliates. All rights reserved.
 *
 *  This source code is licensed under the BSD-style license found in the
 *  LICENSE file in the root directory of this source tree. An additional grant
 *  of patent rights can be found in the PATENTS file in the same directory.
 *
 */

module.exports = function(arrays) {
  const result = new Set(arrays[0]);

  let i,j, array;
  for (i = 1; i < arrays.length; i++) {
    array = arrays[i];
    for (j = 0; j < array.length; j++) {
      result.add(array[j]);
    }
  }

  return Array.from(result);
};

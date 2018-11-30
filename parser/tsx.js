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

const _ = require('lodash');
const babylon = require('babylon');
const baseOptions = require('./tsOptions');

const options = _.merge(baseOptions, { plugins: ['jsx'] });

exports.parse = function parse (code) {
  return babylon.parse(code, options);
};

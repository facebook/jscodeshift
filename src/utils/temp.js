/**
 * Copyright (c) Facebook, Inc. and its affiliates.
 * Copyright (c) 2010-2014 Bruce Williams
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

'use strict';

const fs = require('fs');
const path = require('path');
const os = require('os');
const constants = require('constants');

const RDWR_EXCL = constants.O_CREAT | constants.O_TRUNC | constants.O_RDWR | constants.O_EXCL;
const tempDir = path.resolve(os.tmpdir());

function generateName(suffix) {
  const now = new Date();
  return path.join(
    tempDir,
    [
      'jscodeshift',
      now.getFullYear(),
      now.getMonth(),
      now.getDate(),
      '-',
      process.pid,
      '-',
      (Math.random() * 0x100000000 + 1).toString(36),
      suffix || '',
    ].join('')
  );
}

exports.open = function open(opts, callback) {
  if (!opts) opts = {};
  const target = generateName(opts.suffix);
  return new Promise((resolve, reject) => {
    fs.open(target, RDWR_EXCL, 0o600, (error, fd) => {
      if (!error) {
        deleteFileOnExit(target);
      }
      const result = { path: target, fd };
      if (callback) callback(error, result);
      if (error) return reject(error);
      resolve(result);
    });
  });
};

exports.openSync = function open(opts) {
  if (!opts) opts = {};
  const target = generateName(opts.suffix);
  const fd = fs.openSync(target, RDWR_EXCL, 0o600);
  return { path: target, fd };
};

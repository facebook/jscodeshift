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

const fs = require('fs');
const mkdirp = require('mkdirp');
const path = require('path');
const temp = require('temp');

function renameFileTo(oldPath, newFilename) {
  const projectPath = path.dirname(oldPath);
  const newPath = path.join(projectPath, newFilename);
  mkdirp.sync(path.dirname(newPath));
  fs.renameSync(oldPath, newPath);
  return newPath;
}

module.exports = function createTempFileWith(content, filename) {
  const info = temp.openSync();
  let filePath = info.path;
  fs.writeSync(info.fd, content);
  fs.closeSync(info.fd);
  if (filename) {
    filePath = renameFileTo(filePath, filename);
  }
  return filePath;
};

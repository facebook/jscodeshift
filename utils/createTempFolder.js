/*
 *  Copyright (c) 2015, Facebook, Inc.
 *  All rights reserved.
 *
 *  This source code is licensed under the BSD-style license found in the
 *  LICENSE file in the root directory of this source tree. An additional grant
 *  of patent rights can be found in the PATENTS file in the same directory.
 *
 */

'use strict';

const fs = require('fs');
const temp = require('temp');

function createTempFolder() {
  var i = 0;
  var folder = temp.mkdirSync();

  function createFileWith(content, fileName) {
    var path = folder + '/' + (fileName || 'file' + (++i));
    fs.writeFileSync(path, content);
    return path;
  }

  function createTransformWith(content, fileName) {
    return createFileWith(
      'module.exports = function(fileInfo, api, options) { ' + content + ' }',
      fileName
    );
  }

  return {
    createFileWith,
    createTransformWith,
  };
}

module.exports = createTempFolder;

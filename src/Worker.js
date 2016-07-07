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

const EventEmitter = require('events').EventEmitter;

const async = require('async');
const fs = require('fs');
const writeFile = require('write');
const _ = require('lodash');
const getParser = require('./getParser');
const jscodeshift = require('./core');

let emitter;
let finish;
let notify;
let transform;
let parser;

if (module.parent) {
  emitter = new EventEmitter();
  emitter.send = (data) => { run(data); };
  finish = () => { emitter.emit('disconnect'); };
  notify = (data) => { emitter.emit('message', data); };
  module.exports = (args) => {
    setup(args[0], args[1]);
    return emitter;
  };
} else {
  finish = () => setImmediate(() => process.disconnect());
  notify = (data) => { process.send(data); };
  process.on('message', (data) => { run(data); });
  setup(process.argv[2], process.argv[3]);
}

function prepareJscodeshift(options) {
  if (parser) {
    return jscodeshift.withParser(parser);
  } else if (options.parser) {
    return jscodeshift.withParser(getParser(options.parser));
  } else {
    return jscodeshift;
  }
}

function setup(tr, babel) {
  if (babel === 'babel') {
    require('babel-register')({
      babelrc: false,
      presets: [require('babel-preset-es2015')],
    });
  }
  const module = require(tr);
  transform = typeof module.default === 'function' ?
    module.default :
    module;
  if (module.parser) {
    parser = typeof module.parser === 'string' ?
      getParser(module.parser) :
      module.parser;
  }
}

function free() {
  notify({action: 'free'});
}

function updateStatus(status, file, msg) {
  msg = msg  ?  file + ' ' + msg : file;
  notify({action: 'status', status: status, msg: msg});
}

function empty() {}

function stats(name, quantity) {
  quantity = typeof quantity !== 'number' ? 1 : quantity;
  notify({action: 'update', name: name, quantity: quantity});
}

function trimStackTrace(trace) {
  // Remove this file from the stack trace of an error thrown in the transformer
  var lines = trace.split('\n');
  var result = [];
  lines.every(function(line) {
    if (line.indexOf(__filename) === -1) {
      result.push(line);
      return true;
    }
  });
  return result.join('\n');
}

function writeFileCallback(file, callback) {
  return function writeCallback(err) {
    if (err) {
        updateStatus('error', file, 'File writer error: ' + err);
    } else {
      updateStatus('ok', file);
    }
    callback();
  };
}

function completeCallback(callback) {
  return function errorCallback(err) {
    if (err) {
      updateStatus('error', '', 'This should never be shown!');
    }
    callback();
  };
}

function normalizeFileList(fileList, sourcePath) {
  var paths = new Set();
  return fileList.map(file => {
    var normalizedFile;
    if (_.isString(file)) {
      normalizedFile = {path: sourcePath, source: file};
    } else {
      const pathName = _.has(file, 'path') ? file.path : sourcePath;
      normalizedFile = {source: file.source, path: pathName};
    }
    if (paths.has(normalizedFile.path)) {
      normalizedFile.isDuplicate = true;
    } else if (normalizedFile.source) {
      paths.add(normalizedFile.path);
    }
    return normalizedFile;
  });
}

function writeFileWithCallback(pathName, content, callback) {
  // Create file with any intermediate directories
  writeFile(
    pathName,
    content,
    writeFileCallback(pathName, callback)
  );
}

function fileError(file, err) {
  updateStatus('error', file, 'File error: ' + err);
}

function run(data) {
  var files = data.files;
  var options = data.options || {};
  if (!files.length) {
    finish();
    return;
  }
  async.each(
    files,
    function(file, callback) {
      fs.readFile(file, function(err, source) {
        if (err) {
          fileError(file, err);
          callback();
          return;
        }
        source = source.toString();
        try {
          var out = transform(
            {
              path: file,
              source: source,
            },
            {
              jscodeshift: prepareJscodeshift(options),
              stats: options.dry ? stats : empty
            },
            options
          );
          if (!out || out === source) {
            updateStatus(out ? 'nochange' : 'skip', file);
            callback();
            return;
          }
          if (options.print) {
            console.log(out); // eslint-disable-line no-console
          }
          if (!options.dry) {
            if (_.isArray(out)) {
              async.each(
                normalizeFileList(out, file),
                function (outFile, outCallback) {
                  var isSourceFile = outFile.path === file;
                  if (!outFile.source || outFile.isDuplicate) {
                    updateStatus('skip', outFile.path);
                    outCallback();
                    return;
                  } else if (isSourceFile && outFile.source === source) {
                    updateStatus('nochange', outFile.path);
                    outCallback();
                    return;
                  } else {
                    if (isSourceFile) {
                      writeFileWithCallback(
                        outFile.path,
                        outFile.source,
                        outCallback
                      );
                    } else {
                      fs.readFile(outFile.path, function (err, content) {
                         var fileNotExist = err && err.code === 'ENOENT';
                         if (err && !fileNotExist) {
                           fileError(outFile.path, err);
                           outCallback();
                         } else if (content === outFile.source) {
                           updateStatus('nochange', outFile.path);
                           outCallback();
                         } else {
                           if (fileNotExist) {
                             updateStatus('create', outFile.path);
                           }
                           writeFileWithCallback(
                             outFile.path,
                             outFile.source,
                             outCallback
                           );
                         }
                      });
                    }
                  }
                },
                completeCallback(callback)
              );
            } else {
              fs.writeFile(file, out, writeFileCallback(file, callback));
            }
          } else {
            updateStatus('ok', file);
            callback();
          }
        } catch(err) {
          updateStatus(
            'error',
            file,
            'Transformation error\n' + trimStackTrace(err.stack)
          );
          callback();
        }
      });
    },
    completeCallback(free)
  );
}

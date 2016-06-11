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
const jscodeshift = require('./core');

let emitter;
let finish;
let notify;
let transform;

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

function setup(tr, babel) {
  if (babel === 'babel') {
    // FIXME: use { babelrc: false } after migration to Babel 6
    require('babel-core/register')({ breakConfig: true });
  }
  transform = require(tr);
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

function run(data) {
  var files = data.files;
  var options = data.options;
  if (!files.length) {
    finish();
    return;
  }
  async.each(
    files,
    function(file, callback) {
      fs.readFile(file, function(err, source) {
        if (err) {
          updateStatus('error', file, 'File error: ' + err);
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
              jscodeshift: jscodeshift,
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
            console.log(out);
          }
          if (!options.dry) {
            if (_.isArray(out)) {
              async.each(
                out,
                function (outFile, outCallback) {
                  // Create file with any intermediate directories
                  writeFile(
                    outFile.path,
                    outFile.source,
                    writeFileCallback(outFile.path, outCallback)
                  );
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

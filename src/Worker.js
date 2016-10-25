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
const writeFileAtomic = require('write-file-atomic');
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
      presets: [
        require('babel-preset-es2015'),
        require('babel-preset-stage-1'),
      ],
      plugins: [
        require('babel-plugin-transform-flow-strip-types'),
      ]
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
  if (!trace) {
    return '';
  }
  // Remove this file from the stack trace of an error thrown in the transformer
  const lines = trace.split('\n');
  const result = [];
  lines.every(function(line) {
    if (line.indexOf(__filename) === -1) {
      result.push(line);
      return true;
    }
  });
  return result.join('\n');
}

function run(data) {
  const files = data.files;
  const options = data.options || {};
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
          const jscodeshift = prepareJscodeshift(options);
          const out = transform(
            {
              path: file,
              source: source,
            },
            {
              j: jscodeshift,
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
            console.log(out); // eslint-disable-line no-console
          }
          if (!options.dry) {
            writeFileAtomic(file, out, function(err) {
              if (err) {
                updateStatus('error', file, 'File writer error: ' + err);
              } else {
                updateStatus('ok', file);
              }
              callback();
            });
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
    function(err) {
      if (err) {
        updateStatus('error', '', 'This should never be shown!');
      }
      free();
    }
  );
}

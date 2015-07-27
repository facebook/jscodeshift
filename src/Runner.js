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

var child_process = require('child_process');
var clc = require('cli-color');
var cpus = require('os').cpus().length - 1;
var fs = require('fs');

function ok(msg, verbose) {
  verbose >= 2 && console.log(clc.white.bgGreen(' OKK '), msg);
}
function nochange(msg, verbose) {
  verbose >= 1 && console.log(clc.white.bgYellow(' NOC '), msg);
}
function skip(msg, verbose) {
  verbose >= 1 && console.log(clc.white.bgYellow(' SKIP'), msg);
}
function error(msg, verbose) {
  verbose >= 0 && console.log(clc.white.bgRedBright(' ERR '), msg);
}

function showFileStats(fileStats) {
  console.log(
    'Results:',
    clc.red(fileStats.error + ' errors'),
    clc.yellow(fileStats.nochange + ' unmodifed'),
    clc.yellow(fileStats.skip + ' skipped'),
    clc.green(fileStats.ok + ' ok')
  );
}

function showStats(stats) {
  var names = Object.keys(stats).sort();
  if (names.length) {
    console.log(clc.blue('Stats:'));
  }
  names.forEach(function(name) {
    console.log(name + ':', stats[name]);
  });
}

var log = {
  'ok': ok,
  'nochange': nochange,
  'skip': skip,
  'error': error
};

function run(transformFile, files, options) {
  if (!fs.existsSync(transformFile)) {
    console.log(
      clc.whiteBright.bgRed('ERROR') + ' Transform file %s does not exist',
      transformFile
    );
    return;
  }

  if (files.length === 0) {
    console.log('No files selected, nothing to do.');
    return;
  }

  if (options.cpus) {
    cpus = Math.min(cpus, options.cpus);
  }
  var processes = Math.min(files.length, cpus);
  var chunk_size = Math.ceil(files.length / processes);
  var file_chunks = [];
  for (var i = 0, l = files.length; i < l; i += chunk_size) {
    file_chunks.push(files.slice(i, i + chunk_size));
  }

  console.log('Processing %d files...', files.length);
  console.log(
    'Spawning %d workers with %d files each...',
    file_chunks.length,
    file_chunks[0].length
  );
  if (options.dry) {
    console.log(clc.green('Running in dry mode, no files be written!'));
  }

  var fileCounters = {error: 0, ok: 0, nochange: 0, skip: 0};
  var statsCounter = {};
  var doneCounter = 0;

  function onEnd() {
    doneCounter += 1;
    if (doneCounter === file_chunks.length) {
      var endTime = process.hrtime(startTime);
      console.log('All workers done.');
      showFileStats(fileCounters);
      showStats(statsCounter);
      console.log(
        'Time elapsed: %d.%d seconds',
        endTime[0],
        (endTime[1]/1000000).toFixed(0)
      );
    }
  }

  function onMessage(message) {
    switch (message.action) {
      case 'status':
        fileCounters[message.status] += 1;
        log[message.status](message.msg, options.verbose);
        break;
      case 'update':
        if (!statsCounter[message.name]) {
          statsCounter[message.name] = 0;
        }
        statsCounter[message.name] += message.quantity;
        break;
    }
  }

  var startTime = process.hrtime();
  file_chunks.forEach(function(files) {
    var child = child_process.fork(
      require.resolve('./Worker'),
      [transformFile, options.babel ? 'babel' : 'no-babel']
    );
    child.send({files: files, options: options});
    child.on('message', onMessage);
    child.on('disconnect', onEnd);
  });
}

exports.run = run;

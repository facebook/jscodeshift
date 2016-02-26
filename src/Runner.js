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

require('es6-promise').polyfill();

var Readable = require('stream').Readable;

var rs = new Readable;
var rs1 = new Readable;

const child_process = require('child_process');
const clc = require('cli-color');
const dir = require('node-dir');
const fs = require('fs');
const path = require('path');

const availableCpus = require('os').cpus().length - 1;

const log = {
  ok(msg, verbose) {
    verbose >= 2 && rs.push(clc.white.bgGreen(' OKK '), msg);
  },
  nochange(msg, verbose) {
    verbose >= 1 && rs.push(clc.white.bgYellow(' NOC '), msg);
  },
  skip(msg, verbose) {
    verbose >= 1 && rs.push(clc.white.bgYellow(' SKIP'), msg);
  },
  error(msg, verbose) {
    verbose >= 0 && rs.push(clc.white.bgRedBright(' ERR '), msg);
  },
};

function showFileStats(fileStats) {
  rs.push(
    'Results: \n'+
    clc.red(fileStats.error + ' errors\n')+
    clc.yellow(fileStats.nochange + ' unmodified\n')+
    clc.yellow(fileStats.skip + ' skipped\n')+
    clc.green(fileStats.ok + ' ok\n')
  );
}

function showStats(stats) {
  const names = Object.keys(stats).sort();
  if (names.length) {
    rs.push(clc.blue('Stats:'));
  }
  names.forEach(name => rs.push(name + ':', stats[name] + '\n'));
}

//stream done
function getAllFiles(paths, filter) {
  return Promise.all(
    paths.map(file => new Promise((resolve, reject) => {
      fs.lstat(file, (err, stat) => {
        if (err) {
          rs.push('Skipping path ' + file.toString() + ' which does not exist.\n');
          resolve();
          return;
        }

        if (stat.isDirectory()) {
          dir.files(
            file,
            (err, list) => resolve(list ? list.filter(filter) : [])
          );
        } else {
          resolve([file]);
        }
      })
    }))
  ).then(files => [].concat(...files));
}

function run(transformFile, paths, options) {
  const cpus = options.cpus ? Math.min(availableCpus, options.cpus) : availableCpus;
  const extensions =
    options.extensions && options.extensions.split(',').map(ext => '.' + ext);
  const fileChunks = [];
  const fileCounters = {error: 0, ok: 0, nochange: 0, skip: 0};
  const statsCounter = {};
  const startTime = process.hrtime();

  if (!fs.existsSync(transformFile)) {
    rs.push(
      clc.whiteBright.bgRed('ERROR') + ' Transform file ' + transormFile.toString() + ' does not exist\n'
    );
    return;
  }

  return getAllFiles(
    paths,
    name => !extensions || extensions.indexOf(path.extname(name)) != -1
  ).then(files => {
      if (files.length === 0) {
        rs.push('No files selected, nothing to do.\n');
        return;
      }

      const processes = Math.min(files.length, cpus);
      const chunkSize = Math.ceil(files.length / processes);
      for (let i = 0, l = files.length; i < l; i += chunkSize) {
        fileChunks.push(files.slice(i, i + chunkSize));
      }

      if (!options.silent) {
        rs1.push('Processing ' + files.length.toString() + ' files...\n');

        //rs1.pipe(process.stdout);
        //rs1.push('Processing 1 files...');
        //rs1.push(null);

        if (!options.runInBand) {
          rs1.push(
            'Spawning ' + fileChunks.length.toString() + ' workers with ' + fileChunks[0].length.toString() + ' files each...\n'
          );
/*
          console.log(
            'Spawning %d workers with %d files each...',
            fileChunks.length,
            fileChunks[0].length
          );
*/
        }
        rs1.push(null);
        rs1.pipe(process.stdout);

        if (options.dry) {
          rs.push(
            clc.green('Running in dry mode, no files will be written!\n')
          );
        }
      }

      return fileChunks.map(files => {
        const args = [transformFile, options.babel ? 'babel' : 'no-babel'];
        const child = options.runInBand ?
          require('./Worker')(args) :
          child_process.fork(require.resolve('./Worker'), args);
        child.send({files, options});
        child.on('message', message => {
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
        });
        return new Promise(resolve => child.on('disconnect', resolve));
      });
    })
    .then(pendingWorkers =>
      Promise.all(pendingWorkers).then(() => {
        if (!options.silent) {
          const endTime = process.hrtime(startTime);
          rs.push('All done.\n');
          showFileStats(fileCounters);
          showStats(statsCounter);
          rs.push(
            "Time elapsed: " + (endTime[0] + endTime[1]/1e9).toFixed(3) + " seconds\n"
          );
        }
        rs.push(null);
        rs.pipe(process.stdout);
        return fileCounters;
      })
    );
}

exports.run = run;

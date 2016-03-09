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

const child_process = require('child_process');
const clc = require('cli-color');
const fs = require('fs');
const path = require('path');

const availableCpus = require('os').cpus().length - 1;
const CHUNK_SIZE = 50;

const log = {
  ok(msg, verbose) {
    verbose >= 2 && console.log(clc.white.bgGreen(' OKK '), msg);
  },
  nochange(msg, verbose) {
    verbose >= 1 && console.log(clc.white.bgYellow(' NOC '), msg);
  },
  skip(msg, verbose) {
    verbose >= 1 && console.log(clc.white.bgYellow(' SKIP'), msg);
  },
  error(msg, verbose) {
    verbose >= 0 && console.log(clc.white.bgRedBright(' ERR '), msg);
  },
};

function showFileStats(fileStats) {
  console.log(
    'Results:',
    clc.red(fileStats.error + ' errors'),
    clc.yellow(fileStats.nochange + ' unmodified'),
    clc.yellow(fileStats.skip + ' skipped'),
    clc.green(fileStats.ok + ' ok')
  );
}

function showStats(stats) {
  const names = Object.keys(stats).sort();
  if (names.length) {
    console.log(clc.blue('Stats:'));
  }
  names.forEach(name => console.log(name + ':', stats[name]));
}

function dirFiles (dir, callback, acc) {
  // acc stores files found so far and counts remaining paths to be processed
  acc = acc || { files: [], remaining: 1 };

  function done() {
    // decrement count and return if there are no more paths left to process
    if (!--acc.remaining) {
      callback(acc.files);
    }
  }

  fs.readdir(dir, (err, files) => {
    // if dir does not exist or is not a directory, bail
    // (this should not happen as long as calls do the necessary checks)
    if (err) throw err;

    acc.remaining += files.length;
    files.forEach(file => {
      let name = dir + file;
      fs.stat(name, (err, stats) => {
        if (err) {
          // probably a symlink issue
          console.log('Skipping path "%s" which does not exist.', name);
          done();
        } else if (stats.isDirectory()) {
          dirFiles(name + "/", callback, acc);
        } else {
          acc.files.push(name);
          done();
        }
      });
    });
    done();
  });
}

function getAllFiles(paths, filter) {
  return Promise.all(
    paths.map(file => new Promise((resolve, reject) => {
      fs.lstat(file, (err, stat) => {
        if (err) {
          console.log('Skipping path "%s" which does not exist.', file);
          resolve();
          return;
        }

        if (stat.isDirectory()) {
          dirFiles(
            file,
            list => resolve(list.filter(filter))
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
  const fileCounters = {error: 0, ok: 0, nochange: 0, skip: 0};
  const statsCounter = {};
  const startTime = process.hrtime();

  if (!fs.existsSync(transformFile)) {
    console.log(
      clc.whiteBright.bgRed('ERROR') + ' Transform file %s does not exist',
      transformFile
    );
    return;
  }

  return getAllFiles(
    paths,
    name => !extensions || extensions.indexOf(path.extname(name)) != -1
  ).then(files => {
      const numFiles = files.length;

      if (numFiles === 0) {
        console.log('No files selected, nothing to do.');
        return;
      }

      const processes = Math.min(numFiles, cpus);
      const chunkSize = Math.min(Math.ceil(numFiles / processes), CHUNK_SIZE);

      let index = 0;
      // return the next chunk of work for a free worker
      function next() {
        if (!options.silent && !options.runInBand && index < numFiles) {
          console.log(
            'Sending %d files to free worker...',
            Math.min(chunkSize, numFiles-index)
          );
        }
        return files.slice(index, index += chunkSize);
      }

      if (!options.silent) {
        console.log('Processing %d files...', numFiles);
        if (!options.runInBand) {
          console.log(
            'Spawning %d workers...',
            processes,
          );
        }
        if (options.dry) {
          console.log(
            clc.green('Running in dry mode, no files will be written!')
          );
        }
      }

      const args = [transformFile, options.babel ? 'babel' : 'no-babel'];

      const workers = [];
      for (let i = 0; i < processes; i++) {
        workers.push(options.runInBand ?
          require('./Worker')(args) :
          child_process.fork(require.resolve('./Worker'), args)
        );
      }

      return workers.map(child => {
        child.send({files: next(), options});
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
            case 'free':
              child.send({files: next(), options});
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
          console.log('All done.');
          showFileStats(fileCounters);
          showStats(statsCounter);
          console.log(
            'Time elapsed: %s seconds',
            (endTime[0] + endTime[1]/1e9).toFixed(3)
          );
        }
        return fileCounters;
      })
    );
}

exports.run = run;

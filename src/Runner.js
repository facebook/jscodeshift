"use strict";

var child_process = require('child_process');
var clc = require('cli-color');
var cpus = require('os').cpus().length - 1;
var fs = require('fs');

function run(transformFile, files) {
  if (!fs.existsSync(transformFile)) {
    console.log(
      clc.whiteBright.bgRed('ERROR') + ' Transform file %s does not exist',
      transformFile
    );
    return;
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

  var counters = {error: 0, ok: 0, noChange: 0};
  var doneCounter = 0;
  function onEnd() {
    doneCounter += 1;
    if (doneCounter === file_chunks.length) {
      console.log('All workers done.');
      console.log(
        'Results:',
        clc.red(counters.error + ' errors'), 
        clc.yellow(counters.noChange + ' unmodifed'), 
        clc.green(counters.ok + ' ok')
      );
    }
  }

  file_chunks.forEach(function(files) {
    var child = child_process.fork(
      require.resolve('./Worker'),
      [transformFile]
    );
    child.send(files);
    child.on('message', function(status) {
      counters[status] += 1;
    });
    child.on('disconnect', onEnd);
  });
}

exports.run = run;

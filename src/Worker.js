"use strict";

var async = require('async');
var fs = require('fs');

global.jscs = require('./core');
global.stat = updateStats;
var transform = require(process.argv[2]);

function updateStatus(status, file, msg) {
  msg = msg  ?  file + ' ' + msg : file;
  process.send({action: 'status', status: status, msg: msg});
}

function updateStats(name, quantity) {
  process.send({action: 'update', name: name, quantity: quantity});
}

process.on('message', function(data) {
  var files = data.files;
  var dry = data.dry;
  if (!dry) {
    global.stat = function() {};
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
          var out = transform(file, source);
          if (!out || out === source) {
            updateStatus(out ? 'nochange' : 'skip', file);
            callback();
            return;
          }
          if (!dry) {
            fs.writeFile(file, out, function(err) {
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
          updateStatus('error', file, 'Transformation error: ' + err);
          callback();
        }
      });
    },
    function(err) {
      if (err) {
        updateStatus('error', '', 'This should never be shown!');
      }
      process.disconnect();
    }
  );
});

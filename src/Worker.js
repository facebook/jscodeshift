"use strict";

var async = require('async');
var clc = require('cli-color');
var fs = require('fs');
var transform = require(process.argv[2]);
global.jscs = require('./core');

function ok(msg) {
  console.log(clc.white.bgGreen(' OKK '), msg);
}
function nochange(msg) {
  console.log(clc.white.bgYellow(' NOC '), msg);
}
function error(msg) {
  console.log(clc.white.bgRedBright(' ERR '), msg);
}

function updateParent(status) {
  process.send(status);
}

process.on('message', function(files) {
  async.each(
    files,
    function(file, callback) {
      fs.readFile(file, function(err, source) {
        source = source.toString();
        try {
          var out = transform(source);
          if (out === source) {
            nochange(file);
            updateParent('noChange');
            callback();
            return;
          }
          fs.writeFile(file, out, function(err) {
            if (err) {
              updateParent('error');
              error(file + ' ' + err);
            } else {
              updateParent('ok');
              ok(file);
            }
            callback();
          });
        } catch(err) {
          error(file + ' ' + err);
          updateParent('error');
          callback();
        }
      });
    },
    function(err) {
      if (err) {
        error(err);
      }
      process.disconnect();
    }
  );
});

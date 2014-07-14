"use strict";

var jstransform = require('jstransform');
var es6ClassVisitors = require('jstransform/visitors/es6-class-visitors').visitorList;
var es6ArrowVisitors = require('jstransform/visitors/es6-arrow-function-visitors').visitorList;

var visitors = es6ClassVisitors.concat(es6ArrowVisitors);

function transform(source) {
  return jstransform.transform(
    visitors,
    source
  ).code;
}

exports.process = transform;

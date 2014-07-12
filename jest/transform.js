"use strict";

var jstransform = require('jstransform');
var es6ClassVisitors = require('jstransform/visitors/es6-class-visitors').visitorList;

var visitors = es6ClassVisitors;

function transform(source) {
  return jstransform.transform(
    visitors,
    source
  ).code;
}

exports.process = transform;

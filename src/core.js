"use strict";
var TypedCollections = require('./TypedCollections');
var Collection = require('./Collection');
var collections = [
  require('./JSXElementCollection'),
];

var esprima = require('esprima-fb');
var recast = require('recast');

collections.forEach(TypedCollections.register);

function core(source) {
  return typeof source === 'string' ? fromSource(source) : fromAST(source);
}

function fromAST(ast) {
  return Collection.create(ast);
}

function fromSource(source) {
  return fromAST(recast.parse(source, {esprima: esprima}).program);
}


module.exports = core;

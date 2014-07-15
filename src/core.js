"use strict";
var TypedCollections = require('./TypedCollections');
var Collection = require('./Collection');
var collections = [
  require('./JSXElementCollection'),
];

var assert = require('assert');
var esprima = require('esprima-fb');
var recast = require('recast');
var Node = recast.types.namedTypes.Node;
var NodePath = recast.types.NodePath;

collections.forEach(TypedCollections.register);

/**
 * Main entry point to the tool. The function accepts multiple different kinds
 * of arguments as a convenience. In particular the function accepts either
 *
 * - a string containing source code
 *   The string is parsed with Recast
 * - a single AST node
 * - a single node path
 * - an array of nodes
 * - an array of node paths
 *
 * @param {Node|NodePath|Array|string} source
 * @return {Collection}
 */
function core(source) {
  return typeof source === 'string' ? fromSource(source) : fromAST(source);
}

/**
 * Returns a collection from a node, node path, array of nodes or array of node
 * paths.
 *
 * @param {Node|NodePath|Array} source
 * @return {Collection}
 */
function fromAST(ast) {
  if (Array.isArray(ast)) {
    if (ast[0] instanceof NodePath || ast.length === 0) {
      return Collection.fromPaths(ast);
    } else if (Node.check(ast[0])) {
      return Collection.fromNodes(ast);
    }
  } else {
    if (ast instanceof NodePath) {
      return Collection.fromPaths([ast]);
    } else if (Node.check(ast)) {
      return Collection.fromNodes([ast]);
    }
  }
  throw new TypeError(
    'Received an unexpected value ' + Object.prototype.toString.call(ast)
  );
}

function fromSource(source) {
  return fromAST(recast.parse(source, {esprima: esprima}).program);
}


module.exports = core;

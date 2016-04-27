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
var Collection = require('./Collection');

var collections = require('./collections');
var babel = require('babel-core');
var matchNode = require('./matchNode');
var recast = require('recast');
var template = require('./template');
var _ = require('lodash');

var Node = recast.types.namedTypes.Node;
var NodePath = recast.types.NodePath;

// Register all built-in collections
for (var name in collections) {
  collections[name].register();
}

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
  return fromAST(recast.parse(source, {esprima: babel}));
}

/**
 * Utility function to match a node against a pattern.
 *
 * @param {Node|NodePath|Object} path
 * @parma {Object} filter
 * @return boolean
 */
function match(path, filter) {
  if (!(path instanceof NodePath)) {
    if (typeof path.get === 'function') {
      path = path.get();
    } else {
      path = {value: path};
    }
  }
  return matchNode(path.value, filter);
}

// add builders and types to the function for simple access
_.assign(core, recast.types.namedTypes);
_.assign(core, recast.types.builders);
core.registerMethods = Collection.registerMethods;
core.types = recast.types;
core.match = match;
core.template = template;

// add mappings and filters to function
core.filters = {};
core.mappings = {};
for (var name in collections) {
  if (collections[name].filters) {
    core.filters[name] = collections[name].filters;
  }
  if (collections[name].mappings) {
    core.mappings[name] = collections[name].mappings;
  }
}

var plugins = [];

/**
 * Utility function for registering plugins.
 * 
 * Plugins are simple functions that are passed the core jscodeshift instance. 
 * They should extend jscodeshift by calling `registerMethods`, etc.
 * This method guards against repeated registrations (the plugin callback will only be called once).
 * 
 * @param {Function} plugin
 */
function use(plugin) {
  if (plugins.indexOf(plugin) === -1) {
    plugins.push(plugin);
    plugin(core);
  }
}

core.use = use;

module.exports = core;

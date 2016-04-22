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

var assert = require('assert');
var recast = require('recast');
var _ = require('lodash');

var astTypes = recast.types;
var types = astTypes.namedTypes;
var NodePath = astTypes.NodePath;
var Node = types.Node;

/**
 * This represents a generic collection of node paths. It only has a generic
 * API to access and process the elements of the list. It doesn't know anything
 * about AST types.
 */
class Collection {

  /**
   * @param {Array} paths An array of AST paths
   * @param {Collection} parent A parent collection
   * @param {Array} types An array of types all the paths in the collection
   *  have in common. If not passed, it will be inferred from the paths.
   * @return {Collection}
   */
  constructor(paths, parent, types) {
    assert.ok(Array.isArray(paths), 'Collection is passed an array');
    assert.ok(
      paths.every(p => p instanceof NodePath),
      'Array contains only paths'
    );
    this._parent = parent;
    this.__paths = paths;
    if (types && !Array.isArray(types)) {
      types = _toTypeArray(types);
    } else if (!types || Array.isArray(types) && types.length === 0) {
      types = _inferTypes(paths);
    }
    this._types = types.length === 0 ? _defaultType : types;
  }

  /**
   * Returns a new collection containing the nodes for which the callback
   * returns true.
   *
   * @param {function} callback
   * @return {Collection}
   */
  filter(callback) {
    return new this.constructor(this.__paths.filter(callback), this);
  }

  /**
   * Executes callback for each node/path in the collection.
   *
   * @param {function} callback
   * @return {Collection} The collection itself
   */
  forEach(callback) {
    this.__paths.forEach(
      (path, i, paths) => callback.call(path, path, i, paths)
    );
    return this;
  }

  /**
   * Executes the callback for every path in the collection and returns a new
   * collection from the return values (which must be paths).
   *
   * The callback can return null to indicate to exclude the element from the
   * new collection.
   *
   * If an array is returned, the array will be flattened into the result
   * collection.
   *
   * @param {function} callback
   * @param {Type} type Force the new collection to be of a specific type
   */
  map(callback, type) {
    var paths = [];
    this.forEach(function(path) {
      /*jshint eqnull:true*/
      var result = callback.apply(path, arguments);
      if (result == null) return;
      if (!Array.isArray(result)) {
        result = [result];
      }
      for (var i = 0; i < result.length; i++) {
        if (paths.indexOf(result[i]) === -1) {
          paths.push(result[i]);
        }
      }
    });
    return fromPaths(paths, this, type);
  }

  /**
   * Returns the number of elements in this collection.
   *
   * @return {number}
   */
  size() {
    return this.__paths.length;
  }

  /**
   * Returns an array of AST nodes in this collection.
   *
   * @return {Array}
   */
  nodes() {
    return this.__paths.map(p => p.value);
  }

  paths() {
    return this.__paths;
  }

  getAST() {
    if (this._parent) {
      return this._parent.getAST();
    }
    return this.__paths;
  }

  toSource(options) {
    if (this._parent) {
      return this._parent.toSource(options);
    }
    if (this.__paths.length === 1) {
      return recast.print(this.__paths[0], options).code;
    } else {
      return this.__paths.map(p => recast.print(p, options).code);
    }
  }

  /**
   * Returns a new collection containing only the element at position index.
   *
   * In case of a negative index, the element is taken from the end:
   *
   *   .at(0)  - first element
   *   .at(-1) - last element
   *
   * @param {number} index
   * @return {Collection}
   */
  at(index) {
    return fromPaths(
      this.__paths.slice(
        index,
        index === -1 ? undefined : index + 1
      ),
      this
    );
  }

  /**
   * Proxies to NodePath#get of the first path.
   *
   * @param {string|number} ...fields
   */
  get() {
    var path = this.__paths[0];
    return path.get.apply(path, arguments);
  }

  /**
   * Returns the type(s) of the collection. This is only used for unit tests,
   * I don't think other consumers would need it.
   *
   * @return {Array<string>}
   */
  getTypes() {
    return this._types;
  }

  /**
   * Returns true if this collection has the type 'type'.
   *
   * @param {Type} type
   * @return {boolean}
   */
  isOfType(type) {
    return !!type && this._types.indexOf(type.toString()) > -1;
  }
}

/**
 * Given a set of paths, this infers the common types of all paths.
 *
 * @param {Array} paths An array of paths.
 * @return {Type} type An AST type
 */
function _inferTypes(paths) {
  var _types = [];

  if (paths.length > 0 && Node.check(paths[0].node)) {
    var nodeType = types[paths[0].node.type];
    var sameType = paths.length === 1 ||
      paths.every(path => nodeType.check(path.node));

    if (sameType) {
      _types = [nodeType.toString()].concat(
        astTypes.getSupertypeNames(nodeType.toString())
      );
    } else {
      // try to find a common type
      _types = _.intersection.apply(
        null,
        paths.map(path => astTypes.getSupertypeNames(path.node.type))
      );
    }
  }

  return _types;
}

function _toTypeArray(value) {
  value = !Array.isArray(value) ? [value] : value;
  value = value.map(v => v.toString());
  if (value.length > 1) {
    return _.union(value, _.intersection.apply(
      null,
      value.map(type => astTypes.getSupertypeNames(type))
    ));
  } else {
    return value.concat(astTypes.getSupertypeNames(value[0]));
  }
}

/**
 * Creates a new collection from an array of node paths.
 *
 * If type is passed, it will create a typed collection if such a collection
 * exists. The nodes or path values must be of the same type.
 *
 * Otherwise it will try to infer the type from the path list. If every
 * element has the same type, a typed collection is created (if it exists),
 * otherwise, a generic collection will be created.
 *
 * @param {Array} paths An array of paths
 * @param {Collection} parent A parent collection
 * @param {Type} type An AST type
 * @return {Collection}
 */
function fromPaths(paths, parent, type) {
  assert.ok(
    paths.every(n => n instanceof NodePath),
    'Every element in the array should be a NodePath'
  );

  return new Collection(paths, parent, type);
}

/**
 * Creates a new collection from an array of nodes. This is a convenience
 * method which converts the nodes to node paths first and calls
 *
 *    Collections.fromPaths(paths, parent, type)
 *
 * @param {Array} nodes An array of AST nodes
 * @param {Collection} parent A parent collection
 * @param {Type} type An AST type
 * @return {Collection}
 */
function fromNodes(nodes, parent, type) {
  assert.ok(
    nodes.every(n => Node.check(n)),
    'Every element in the array should be a Node'
  );
  return fromPaths(
    nodes.map(n => new NodePath(n)),
    parent,
    type
  );
}

var CPt = Collection.prototype;

/**
 * This function adds the provided methods to the prototype of the corresponding
 * typed collection. If no type is passed, the methods are added to
 * Collection.prototype and are available for all collections.
 *
 * @param {Object} methods Methods to add to the prototype
 * @param {Type=} type Optional type to add the methods to
 */
function registerMethods(methods, type) {
  for (var methodName in methods) {
    if (!methods.hasOwnProperty(methodName)) {
      return;
    }
    if (hasConflictingRegistration(methodName, type)) {
      var msg = `There is a conflicting registration for method with name "${methodName}".\nYou tried to register an additional method with `;
      
      if (type) {
        msg += `type "${type.toString()}".`
      } else {
        msg += 'universal type.'
      }
      
      msg += '\nThere are existing registrations for that method with ';
      
      var conflictingRegistrations = CPt[methodName].typedRegistrations;
      
      if (conflictingRegistrations) {
        msg += `type ${Object.keys(conflictingRegistrations).join(', ')}.`; 
      } else {
        msg += 'universal type.';
      }
      
      throw Error(msg);
    }
    if (!type) {
      CPt[methodName] = methods[methodName];
    } else {
      type = type.toString();
      if (!CPt.hasOwnProperty(methodName)) {
        installTypedMethod(methodName);
      }
      var registrations = CPt[methodName].typedRegistrations;
      registrations[type] = methods[methodName];
      astTypes.getSupertypeNames(type).forEach(function (name) {
        registrations[name] = false;
      });
    }
  }
} 

function installTypedMethod(methodName) {
  if (CPt.hasOwnProperty(methodName)) {
    throw new Error(`Internal Error: "${methodName}" method is already installed`);
  }

  var registrations = {};

  function typedMethod() {
    var types = Object.keys(registrations);
    
    for (var i = 0; i < types.length; i++) {
      var currentType = types[i];
      if (registrations[currentType] && this.isOfType(currentType)) {
        return registrations[currentType].apply(this, arguments);
      }
    }
    
    throw Error(
      `You have a collection of type [${this.getTypes()}]. ` +
      `"${methodName}" is only defined for one of [${types.join('|')}].`
    );
  }

  typedMethod.typedRegistrations = registrations;

  CPt[methodName] = typedMethod;
}

function hasConflictingRegistration(methodName, type) {
  if (!type) {
    return CPt.hasOwnProperty(methodName); 
  }

  if (!CPt.hasOwnProperty(methodName)) {
    return false;
  }

  var registrations = CPt[methodName] && CPt[methodName].typedRegistrations;
  
  if (!registrations) {
    return true;
  }
  
  type = type.toString();
  
  if (registrations.hasOwnProperty(type)) {
    return true;
  }

  return astTypes.getSupertypeNames(type.toString()).some(function (name) {
    return !!registrations[name];
  }); 
}

var _defaultType = [];

/**
 * Sets the default collection type. In case a collection is created form an
 * empty set of paths and no type is specified, we return a collection of this
 * type.
 *
 * @param {Type} type
 */
function setDefaultCollectionType(type) {
  _defaultType = _toTypeArray(type);
}

exports.fromPaths = fromPaths;
exports.fromNodes = fromNodes;
exports.registerMethods = registerMethods;
exports.hasConflictingRegistration = hasConflictingRegistration;
exports.setDefaultCollectionType = setDefaultCollectionType;

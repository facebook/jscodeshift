"use strict";

var TypedCollections = require('./TypedCollections');
var assert = require('assert');
var at = require('ast-types');

var types = at.namedTypes;
var hasOwn =
  Object.prototype.hasOwnProperty.call.bind(Object.prototype.hasOwnProperty);

/**
 * Checks whether needle is a strict subset of haystack.
 *
 * @param {Object} haystack The object to test
 * @param {Object} needle The properties to look for in test
 * @return {bool}
 */
function isPartialEqual(haystack, needle) {
  var props = Object.keys(needle);
  return props.every(function(prop) {
    if (!hasOwn(haystack, prop)) {
      return false;
    }
    if (haystack[prop] && typeof haystack[prop] === 'object') {
      return isPartialEqual(haystack[prop], needle[prop]);
    }
    return haystack[prop] === needle[prop];
  });
}

function methodNameFromType(type) {
  return 'visit' + type;
}

/**
 * This represents a generic collection of AST nodes. It contains default
 * methods to traverse and filter the nodes.
 */
class Collection {

  /**
   * Creates a new collection. Always use this method to create a new
   * collection.
   * It takes care of
   *
   *   - Handling typing the collection if either type or a single AST node is
   *     passed.
   *   - Creating an array if a single AST node is passed
   *
   * @param {Array|Node|Path} paths An array of AST nodes/paths or a single
   *                                node/path
   * @param {Collection} parent A parent collection
   * @param {Type} type An AST type
   * @return {Collection}
   */
  static create(paths, parent, type) {
    var collection;
    if (type || types.Node.check(paths)) {
      if (types.Node.check(paths)) {
        paths = [paths];
      }
      type = type || types[paths[0].type];
      collection = TypedCollections.create(type, paths, parent);
    }
    if (!collection) {
      collection = new Collection(paths, parent);
    }
    return collection;
  }

  /**
   * @param {Array} paths An array of AST nodes/paths
   * @param {Collection} parent A parent collection
   * @return {Collection}
   */
  constructor(paths, parent) {
    assert(Array.isArray(paths), 'Collection is passed an array');
    this._parent = parent;
    this.__paths = paths;
  }

  /**
   * Find nodes of a specific type within the nodes of this collection.
   *
   * @param {type}
   * @return {Collection}
   */
  find(type, filter) {
    var paths = [];
    var visitorMethodName = methodNameFromType(type);

    var visitor = {};
    visitor[visitorMethodName] = function(path) {
      if (!filter || isPartialEqual(path.value, filter)) {
        paths.push(path);
      }
      this.traverse(path);
    };
    this.__paths.forEach(function(p) {
      at.visit(p, visitor);
    });
    return TypedCollections.create(type, paths, this) ||
      new Collection(paths, this);
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
    this.__paths.forEach(function(value) {
      callback.apply(value, arguments);
    });
    return this;
  }

  /***** MUTATION METHODS ********/

  /**
   * Simply replaces the selected nodes with the provided node. If a function
   * is provided it is executed for every node and the node is replaced with the
   * functions return value.
   *
   * @param {Node|function} replacement
   * @return {Collection}
   */
   replaceWith(replacement) {
     var replacementFunc = typeof replacement === 'function' ?
       replacement :
       function() {
         return replacement;
       };

     this.forEach(function(path, i) {
       var newNode = replacementFunc.call(path, path, i);
       assert(types.Node.check(newNode), 'Replacement function returns a node');
       path.replace(newNode);
     });
     return this;
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
    return this.__paths.map(function(p) {
      return types.Node.check(p) ? p : p.value;
    });
  }
}

module.exports = Collection;

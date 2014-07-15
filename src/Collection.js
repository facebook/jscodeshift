"use strict";

var TypedCollections = require('./TypedCollections');
var assert = require('assert');
var recast = require('recast');
var types = recast.types;
var NodePath = types.NodePath;
var Node = types.namedTypes.Node;

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

function functionify(value) {
  return typeof value === 'function' ? value : function() {
    return value;
  };
}

/**
 * This represents a generic collection of AST nodes. It contains default
 * methods to traverse and filter the nodes.
 */
class Collection {

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
  static fromPaths(paths, parent, type) {
    if (paths.length === 0) {
      return new Collection(paths, parent, type);
    }
    assert.ok(
      paths.every(n => n instanceof NodePath),
      'Every element in the array is a NodePath'
    );

    var collection;

    if (!type && Node.check(paths[0].value)) {
      var nodeType = types.namedTypes[paths[0].value.type];
      var sameType = paths.length === 1 ||
        paths.every(path => nodeType.check(path.value));

      if (sameType) {
        type = nodeType;
      }
    }
    if (type) {
      collection = TypedCollections.create(type, paths, parent);
    }

    if (!collection) {
      collection = new Collection(paths, parent);
    }
    return collection;
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
  static fromNodes(nodes, parent, type) {
    assert.ok(
      nodes.every(n => Node.check(n)),
      'Every element in the array is a Node'
    );
    return Collection.fromPaths(
      nodes.map(n => new NodePath(n)),
      parent,
      type
    );
  }

  /**
   * @param {Array} paths An array of AST paths
   * @param {Collection} parent A parent collection
   * @return {Collection}
   */
  constructor(paths, parent) {
    assert.ok(Array.isArray(paths), 'Collection is passed an array');
    assert.ok(
      paths.every(p => p instanceof NodePath),
      'Array contains only paths'
    );
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
    function visit(path) {
      /*jshint validthis:true */
      if (!filter || isPartialEqual(path.value, filter)) {
        paths.push(path);
      }
      this.traverse(path);
    }
    this.__paths.forEach(function(p, i) {
      var self = this;
      visitor[visitorMethodName] = function(path) {
        if (self.__paths[i] === path) {
          this.traverse(path);
        } else {
          return visit.call(this, path);
        }
      };
      recast.visit(p, visitor);
    }, this);

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
    this.__paths.forEach(path => callback.apply(path, arguments));
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
    replacement = functionify(replacement);

    return this.forEach(function(path, i) {
      var newNode = replacement.call(path, path, i);
      assert(Node.check(newNode), 'Replacement function returns a node');
      path.replace(newNode);
    });
  }

  /**
   * Inserts a new node before the current one.
   *
   * @param {Node|function} insert
   * @return {Collection}
   */
  insertBefore(insert) {
    insert = functionify(insert);

    return this.forEach(function(path, i) {
      var node = insert.call(path, path, i);
      assert(Node.check(node), 'Insert function returns a node');
      path.insertBefore(node);
    });
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

  /**
   * Returns a new collection containing only the element at position index.
   *
   * @param {number} index
   * @return {Collection}
   */
  get(index) {
    return Collection.fromPaths(this.__paths.slice(index, index+1), this);
  }
}

module.exports = Collection;

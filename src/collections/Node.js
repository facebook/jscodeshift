"use strict";

var Collection = require('../Collection');

var assert = require('assert');
var recast = require('recast');

var Node = recast.types.namedTypes.Node;
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

var methods = {

  /**
   * Find nodes of a specific type within the nodes of this collection.
   *
   * @param {type}
   * @return {Collection}
   */
  find: function(type, filter) {
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

    return Collection.fromPaths(paths, this, type);
  },

  /**
   * Simply replaces the selected nodes with the provided node. If a function
   * is provided it is executed for every node and the node is replaced with the
   * functions return value.
   *
   * @param {Node|function} replacement
   * @return {Collection}
   */
  replaceWith: function(replacement) {
    replacement = functionify(replacement);

    return this.forEach(function(path, i) {
      var newNode = replacement.call(path, path, i);
      assert(Node.check(newNode), 'Replacement function returns a node');
      path.replace(newNode);
    });
  },

  /**
   * Inserts a new node before the current one.
   *
   * @param {Node|function} insert
   * @return {Collection}
   */
  insertBefore: function(insert) {
    insert = functionify(insert);

    return this.forEach(function(path, i) {
      var node = insert.call(path, path, i);
      assert(Node.check(node), 'Insert function returns a node');
      path.insertBefore(node);
    });
  }

};

function register() {
  Collection.registerMethods(methods, Node);
  Collection.setDefaultCollectionType(Node);
}

exports.register = register;

"use strict";

var Collection = require('../Collection');

var assert = require('assert');
var recast = require('recast');

var Node = recast.types.namedTypes.Node;
var hasOwn =
  Object.prototype.hasOwnProperty.call.bind(Object.prototype.hasOwnProperty);
var types = recast.types.namedTypes;

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
    if (haystack[prop] &&
      typeof haystack[prop] === 'object' &&
      typeof needle[prop] === 'object') {
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

var traversalMethods = {

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
   * Returns a collection containing the paths that create the scope of the
   * currently selected paths. Dedupes the paths.
   *
   * @return {Collection}
   */
  closestScope: function() {
    return this.map(path => path.scope && path.scope.path);
  },

  /**
   * Traverse the AST up and finds the closest node of the provided type.
   *
   * @param {Collection}
   */
  closest: function(type) {
    return this.map(function(path) {
      var parent = path.parent;
      while (parent && !type.check(parent.value)) {
        parent = parent.parent;
      }
      return parent || null;
    });
  },

  /**
   * Finds the declaration for each selected path. Useful for member expressions
   * or XJSElements. Expects a callback function that maps each path to the name
   * to look for.
   *
   * If the callback returns a falsey value, the element is skipped.
   *
   * @param {function} nameGetter
   *
   * @return {Collection}
   */
  getVariableDeclarators: function(nameGetter) {
    return this.map(function(path) {
      /*jshint curly:false*/
      var scope = path.scope;
      if (!scope) return;
      var name = nameGetter.apply(path, arguments);
      if (!name) return;
      scope = scope.lookup(name);
      if (!scope) return;
      var bindings = scope.getBindings()[name];
      if (!bindings) return;
      var decl = Collection.fromPaths(bindings)
        .closest(types.VariableDeclarator);
      if (decl.size() === 1) {
        return decl.paths()[0];
      }
    }, types.VariableDeclarator);
  },
};

var mutationMethods = {
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
  Collection.registerMethods(traversalMethods, Node);
  Collection.registerMethods(mutationMethods, Node);
  Collection.setDefaultCollectionType(Node);
}

exports.register = register;

"use strict";
var Collection = require('../Collection');
var NodeCollection = require('./Node');
var recast = require('recast');

var astNodesAreEquivalent = recast.types.astNodesAreEquivalent;
var b = recast.types.builders;
var types = recast.types.namedTypes;

var VariableDeclarator = recast.types.namedTypes.VariableDeclarator;

var globalMethods = {
  findVariableDeclarators: function(name) {
    var filter = name ? {id: {name: name}} : null;
    return this.find(VariableDeclarator, filter);
  }
};


var filterMethods = {
  filterByRequire: function(names) {
    if (names && !Array.isArray(names)) {
      names = [names];
    }
    var requireIdentifier = b.identifier('require');
    return function(path) {
      var node = path.value;
      if (!VariableDeclarator.check(node) ||
          !types.CallExpression.check(node.init) ||
          !astNodesAreEquivalent(node.init.callee, requireIdentifier)) {
        return false;
      }
      return !names ||
        names.some(
          n => astNodesAreEquivalent(node.init.arguments[0], b.literal(n))
        );
    };
  }
};

var transformMethods = {
  renameTo: function(newName) {
    return this.forEach(function(path) {
      var node = path.value;
      var oldName = node.id.name;
      var rootScope = path.scope;
      var rootPath = rootScope.path;
      Collection.fromPaths([rootPath])
        .find(types.Identifier, {name: oldName})
        .forEach(function(path) {
          var scope = path.scope;
          while (scope && scope !== rootScope) {
            if (scope.declares(oldName)) {
              return;
            }
            scope = scope.parent;
          }
          if (scope) { // identifier must refer to declared variable
            path.get('name').replace(newName);
          }
        });
    });
  }
};


function register() {
  NodeCollection.register();
  Collection.registerMethods(globalMethods);
  Collection.registerMethods(transformMethods, VariableDeclarator);
}

exports.register = register;
exports.filters = filterMethods;

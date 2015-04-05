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

var _ = require('lodash');
var Collection = require('../Collection');
var NodeCollection = require('./Node');

var assert = require('assert');
var recast = require('recast');
var requiresModule = require('./VariableDeclarator').filters.requiresModule;

var types = recast.types.namedTypes;
var JSXElement = types.JSXElement;
var JSXAttribute = types.JSXAttribute;
var Literal = types.Literal;

/**
 * Contains filter methods and mutation methods for processing JSXElements.
 */
var globalMethods = {
  /**
   * Finds all JSXElements optionally filtered by name
   *
   * @param {string} name
   * @return {Collection}
   */
  findJSXElements: function(name) {
    var nameFilter = name && {openingElement: {name: {name: name}}};
    return this.find(JSXElement, nameFilter);
  },

  /**
   * Finds all JSXElements by module name. Given
   *
   *     var Bar = require('Foo');
   *     <Bar />
   *
   * findJSXElementsByModuleName('Foo') will find <Bar />, without having to
   * know the variable name.
   */
  findJSXElementsByModuleName: function(moduleName) {
    assert.ok(
      moduleName && typeof moduleName === 'string',
      'findJSXElementsByModuleName(...) needs a name to look for'
    );

    return this.find(types.VariableDeclarator)
      .filter(requiresModule(moduleName))
      .map(function(path) {
        var id = path.value.id.name;
        if (id) {
          return Collection.fromPaths([path])
            .closestScope()
            .findJSXElements(id)
            .paths();
        }
      });
  }
};

var filterMethods = {

  /**
   * Filter method for attributes.
   *
   * @param {Object} attributeFilter
   * @return {function}
   */
  hasAttributes: function(attributeFilter) {
    var attributeNames = Object.keys(attributeFilter);
    return function filter(path) {
      if (!JSXElement.check(path.value)) {
        return false;
      }
      var elementAttributes = Object.create(null);
      path.value.openingElement.attributes.forEach(function(attr) {
        if (!JSXAttribute.check(attr) ||
          !(attr.name.name in attributeFilter)) {
          return;
        }
        elementAttributes[attr.name.name] = attr;
      });

      return attributeNames.every(function(name) {
        if (!(name in elementAttributes) ){
          return false;
        }
        var value = elementAttributes[name].value;
        var expected = attributeFilter[name];
        var actual = Literal.check(value) ? value.value : value.expression;
        if (typeof expected === 'function') {
          return expected(actual);
        } else {
          // Literal attribute values are always strings
          return String(expected) === actual;
        }
      });
    };
  },

  /**
   * Filter elements which contain a specific child type
   *
   * @param {string} name
   * @return {function}
   */
  hasChildren: function(name) {
    return function filter(path) {
      return JSXElement.check(path.value) &&
        path.value.children.some(
          child => JSXElement.check(child) &&
                   child.openingElement.name.name === name
        );
    };
  }
};

var traversalMethods = {

  /**
   * Returns all child nodes, including literals and expressions.
   *
   * @return {Collection}
   */
  childNodes: function() {
    var paths = [];
    this.forEach(function(path) {
      var children = path.get('children');
      var l = children.value.length;
      for (var i = 0; i < l; i++) {
        paths.push(children.get(i));
      }
    });
    return Collection.fromPaths(paths, this);
  },

  /**
   * Returns all children that are JSXElements.
   *
   * @return {JSXElementCollection}
   */
  childElements: function() {
    var paths = [];
    this.forEach(function(path) {
      var children = path.get('children');
      var l = children.value.length;
      for (var i = 0; i < l; i++) {
        if (types.JSXElement.check(children.value[i])) {
          paths.push(children.get(i));
        }
      }
    });
    return Collection.fromPaths(paths, this, JSXElement);
  },
};

var mappingMethods = {
  /**
   * Given a JSXElement, returns its "root" name. E.g. it would return "Foo" for
   * both <Foo /> and <Foo.Bar />.
   *
   * @param {NodePath} path
   * @return {string}
   */
  getRootName: function(path) {
    var name = path.value.openingElement.name;
    while (types.JSXMemberExpression.check(name)) {
      name = name.object;
    }

    return name && name.name || null;
  }
};

function register() {
  NodeCollection.register();
  Collection.registerMethods(globalMethods, types.Node);
  Collection.registerMethods(traversalMethods, JSXElement);
}

exports.register = _.once(register);
exports.filters = filterMethods;
exports.mappings = mappingMethods;

"use strict";

var Collection = require('../Collection');
var NodeCollection = require('./Node');
var recast = require('recast');

var types = recast.types.namedTypes;
var XJSElement = types.XJSElement;
var XJSAttribute = types.XJSAttribute;
var Literal = types.Literal;

/**
 * Contains filter methods and mutation methods for processing XJSElements.
 */


var globalMethods = {
  findXJSElements: function(name) {
    var nameFilter = name && {openingElement: {name: {name: name}}};
    return this.find(XJSElement, nameFilter);
  }
};

var filterMethods = {

  /**
   * Filter method for attributes.
   *
   * @param {Object} attributeFilter
   * @return {function}
   */
  filterByAttributes: function(attributeFilter) {
    var attributeNames = Object.keys(attributeFilter);
    return function filter(path) {
      if (!XJSElement.check(path.value)) {
        return false;
      }
      var elementAttributes = Object.create(null);
      path.value.openingElement.attributes.forEach(function(attr) {
        if (!XJSAttribute.check(attr) ||
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
  filterByHasChildren: function(name) {
    return function filter(path) {
      return XJSElement.check(path.value) &&
        path.value.children.some(
          child => XJSElement.check(child) &&
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
   * Returns all children that are XJSElements.
   *
   * @return {XJSElementCollection}
   */
  childElements: function() {
    var paths = [];
    this.forEach(function(path) {
      var children = path.get('children');
      var l = children.value.length;
      for (var i = 0; i < l; i++) {
        if (types.XJSElement.check(children.value[i])) {
          paths.push(children.get(i));
        }
      }
    });
    return Collection.fromPaths(paths, this, XJSElement);
  }
};

function register() {
  NodeCollection.register();
  Collection.registerMethods(globalMethods, types.Node);
  Collection.registerMethods(traversalMethods, XJSElement);
}

exports.register = register;
exports.filters = filterMethods;

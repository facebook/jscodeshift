
/**
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

'use strict';

const Collection = require('../Collection');
const NodeCollection = require('./Node');

const assert = require('assert');
const once = require('../utils/once');
const recast = require('recast');
const requiresModule = require('./VariableDeclarator').filters.requiresModule;

const types = recast.types.namedTypes;
const JSXElement = types.JSXElement;
const JSXAttribute = types.JSXAttribute;
const Literal = types.Literal;

/**
 * Returns the value an attribute carries, so filters can work on values instead
 * of AST nodes: both `attr="foo"` and `attr={'foo'}` give 'foo', `attr={true}`
 * gives true and a value-less `attr` gives null. An attribute whose value is
 * computed (`attr={foo()}`) has no static value, so its expression node is
 * returned.
 */
function getAttributeValue(value) {
  if (!value) {
    return value;
  }
  if (Literal.check(value)) {
    return value.value;
  }
  if (value.expression && Literal.check(value.expression)) {
    return value.expression.value;
  }
  return value.expression;
}

/**
 * Contains filter methods and mutation methods for processing JSXElements.
 * @mixin
 */
const globalMethods = {
  /**
   * Finds all JSXElements optionally filtered by name
   *
   * @param {string} name
   * @return {Collection}
   */
  findJSXElements: function(name) {
    const nameFilter = name && {openingElement: {name: {name: name}}};
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
        const id = path.value.id.name;
        if (id) {
          return Collection.fromPaths([path])
            .closestScope()
            .findJSXElements(id)
            .paths();
        }
      });
  }
};

const filterMethods = {

  /**
   * Filter method for attributes.
   *
   * Each entry of the filter maps an attribute name to the value the attribute
   * must carry: either a literal to look for, compared against the attribute
   * value as strings, or a callback that receives the attribute value.
   *
   * @param {Object} attributeFilter
   * @return {function}
   */
  hasAttributes: function(attributeFilter) {
    const attributeNames = Object.keys(attributeFilter);
    return function filter(path) {
      if (!JSXElement.check(path.value)) {
        return false;
      }
      const elementAttributes = Object.create(null);
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

        const value = elementAttributes[name].value;
        const expected = attributeFilter[name];
        const actual = getAttributeValue(value);

        if (typeof expected === 'function') {
          return expected(actual);
        }

        // Only attributes that carry a value can be compared to the filter. Both
        // sides become strings so `{count: 1}` matches `count={1}` the way
        // `{name: 'foo'}` has always matched `name="foo"`.
        switch (typeof actual) {
          case 'string':
          case 'number':
          case 'boolean':
          case 'bigint':
            return String(expected) === String(actual);
          default:
            return false;
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

/**
* @mixin
*/
const traversalMethods = {

  /**
   * Returns all child nodes, including literals and expressions.
   *
   * @return {Collection}
   */
  childNodes: function() {
    const paths = [];
    this.forEach(function(path) {
      const children = path.get('children');
      const l = children.value.length;
      for (let i = 0; i < l; i++) {
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
    const paths = [];
    this.forEach(function(path) {
      const children = path.get('children');
      const l = children.value.length;
      for (let i = 0; i < l; i++) {
        if (types.JSXElement.check(children.value[i])) {
          paths.push(children.get(i));
        }
      }
    });
    return Collection.fromPaths(paths, this, JSXElement);
  },

  /**
   * Returns all children that are of jsxElementType.
   *
   * @return {Collection<jsxElementType>}
   */
  childNodesOfType: function(jsxChildElementType) {
    const paths = [];
    this.forEach(function(path) {
      const children = path.get('children');
      const l = children.value.length;
      for (let i = 0; i < l; i++) {
        if (jsxChildElementType.check(children.value[i])) {
          paths.push(children.get(i));
        }
      }
    });
    return Collection.fromPaths(paths, this, jsxChildElementType);
  },
};

const mappingMethods = {
  /**
   * Given a JSXElement, returns its "root" name. E.g. it would return "Foo" for
   * both <Foo /> and <Foo.Bar />.
   *
   * @param {NodePath} path
   * @return {string}
   */
  getRootName: function(path) {
    let name = path.value.openingElement.name;
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

exports.register = once(register);
exports.filters = filterMethods;
exports.mappings = mappingMethods;

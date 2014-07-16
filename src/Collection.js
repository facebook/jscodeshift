"use strict";

var assert = require('assert');
var recast = require('recast');
var _ = require('lodash');

var types = recast.types;
var NodePath = types.NodePath;
var Node = types.namedTypes.Node;


var _typedCollectionCache = Object.create(null);

function _createCollectionForType(type) {
  /*jshint evil:true*/
  // Yeah this is ugly, but I want to give the function a proper name to make
  // debugging easier. Maybe can omit the name at some point.
  var Constr = eval(
    '(function ' + type + 'Collection() { Collection.apply(this, arguments);})'
  );

  // TODO: Try to find a solution for types having multiple supertypes.
  // E.g. a FunctionExpression has the supertypes Function and Expression.
  // Not sure if this is an issue so far.
  var supertypes = types.getSupertypeNames(type.toString());
  var superTypePrototype = supertypes[0] ?
    _getCollectionForType(supertypes[0]).prototype :
    Collection.prototype;

  Constr.prototype = Object.create(
    superTypePrototype,
    {constructor: {value: Constr, writeable: true, configurable: true}}
  );

  return Constr;
}

function _getCollectionForType(type) {
  if (!(type in _typedCollectionCache)) {
    _typedCollectionCache[type] = _createCollectionForType(type);
  }
  return _typedCollectionCache[type];
}

/**
 * This represents a generic collection of node paths. It only has a generic
 * API to access and process the elements of the list. It doesn't know anything
 * about AST types.
 */
class Collection {

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

  getPaths() {
    return this.__paths;
  }

  /**
   * Returns a new collection containing only the element at position index.
   *
   * @param {number} index
   * @return {Collection}
   */
  get(index) {
    return fromPaths(this.__paths.slice(index, index+1), this);
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
    'Every element in the array is a NodePath'
  );

  var collection;

  if (!type && paths.length > 0 && Node.check(paths[0].value)) {
    var nodeType = types.namedTypes[paths[0].value.type];
    var sameType = paths.length === 1 ||
      paths.every(path => nodeType.check(path.value));

    if (sameType) {
      type = nodeType;
    } else {
      // try to find a common type
      type = _.intersection.apply(
        null,
        paths.map(path => types.getSupertypeNames(path.value.type))
      )[0];
    }
  }
  if (type) {
    collection = new (_getCollectionForType(type))(paths, parent);
  }

  if (!collection) {
    /*jshint newcap:false*/
    collection = new _defaultCollection(paths, parent);
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
function fromNodes(nodes, parent, type) {
  assert.ok(
    nodes.every(n => Node.check(n)),
    'Every element in the array is a Node'
  );
  return fromPaths(
    nodes.map(n => new NodePath(n)),
    parent,
    type
  );
}

/**
 * This function adds the provided methods to the prototype of the corresponding
 * typed collection. If no type is passed, the methods are added to
 * Collection.prototype and are available for all collections.
 *
 * @param {Object} methods Methods to add to the prototype
 * @param {Type=} type Optional type to add the methods to
 */
function registerMethods(methods, type) {
  var constructor = type ? _getCollectionForType(type) : Collection;
  _.assign(constructor.prototype, methods);
}

var _defaultCollection = Collection;

/**
 * Sets the default collection type. In case a collection is created form an
 * empty set of paths and no type is specified, we return a collection of this
 * type.
 *
 * @param {Type} type
 */
function setDefaultCollectionType(type) {
  _defaultCollection = _getCollectionForType(type);
}

exports.fromPaths = fromPaths;
exports.fromNodes = fromNodes;
exports.registerMethods = registerMethods;
exports.setDefaultCollectionType = setDefaultCollectionType;

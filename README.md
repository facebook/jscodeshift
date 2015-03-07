## jscodeshift

jscodeshift provides a higher level API over Recast, which lets you perform AST transforms while preserving as much of the original code formatting as possible.

### Goals

The goal of jscodeshift is to provide convenience methods to perform common AST transformations, so that you don't have to write your own visitor and deal with AST nodes yourself. It's designed to be extensible.

jscodeshift is to the AST what jQuery is to the DOM (no, not something horrible).

### Concepts

First we have to define / explain a couple of terms from Recast:

- **Node**: The AST is composed of nodes. A node is basically a plain object and has a specific type, in accordance with the [Mozilla Parser API][1]. For example, the identifier `foo` is represented by

    ```js
    {
 	type: 'Identifier',
	name: 'foo'
    }
    ```
 
     It only holds data about the syntax construct it represents and has no additional API.
     
- **NodePath**: A node path is a wrapper around an AST node. It contains context information for node. These can be AST related (e.g. the parent of the node) or code related (e.g. a static version of the scope the node is in). It also provides an API to mutate the node (or replace it completely).

On top of this, jscs adds **collections**. A collection is a set of node paths. These paths can be processed (e.g. traversed or mutated) by the methods the collection has.  
By default a collection has only a very simply API to access the elements of the collection. The power of collections comes from **typed collections**. If a collection contains a set of node paths, then the type of the collection is the node type that all of the node paths have in common.  
Typed collections follow the type hierarchy defined by Recast. For example, an `IdentifierCollection` is an `ExpressionCollection` is a `NodeCollection`. That means that an `IdentifierCollection` has methods that have been registered for Identifiers, Expressions and Nodes.

jscs provides a set of common methods for various types, such as finding all nodes of a given type or replacing a node with a new node.


### API examples

#### Finding elements and do stuff

```js
// Logs the value of every identifier in ast
jscs(ast).find(jscs.Identifier).forEach(function(path) {
	console.log(path.value.name);
});

// Get all XJSElement child nodes of nodes with name "Foo"
var children = jscs(ast).findXJSElement('Foo').childElements();
```

#### How to add new methods to collections

```js
// Adding a method to all Identifiers
jscs.registerMethods({
	logNames: function() {
		return this.forEach(function(path) {
			console.log(path.value.name);
		});
	}
}, jscs.Identifier);

// Adding a method to all collections
jscs.registerMethods({
	findIdentifiers: function() {
		return this.find(jscs.Identifier);
	}
});

jscs(ast).findIdentifiers().logNames();
jscs(ast).logNames(); // error, unless `ast` only consists of Identifier nodes
```

### Runner

If the package is globally installed, it adds the executable `jscs`. Example usage:

```bash
$ jscs -t transformFile files to transform
$ jscs files to transform
```
If no transform file is provided, it will look in the current directory for the file `transform.js`. The file should be a node module and export a single function which accepts the source of a file and returns the transformed source. Example:

```js
// transform.js
module.exports = function(source) {
  return jscs(source)
    .findVariableDeclarators('foo')
    .renameTo('xyz')
    .toSource();
};
```

`jscs` is made available to the transform module as global variable.

[1]: https://developer.mozilla.org/en-US/docs/Mozilla/Projects/SpiderMonkey/Parser_API

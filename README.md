## //FIXME cool tool name (for now we call it CoolTool)

CoolTool provides a higher level API over Recast, which lets you perform AST transforms while preserving as much of the original code formatting as possible.

### Goals

The goal of CoolTool is to provide convenience methods to perform common AST transformations, so that you don't have to write your own visitor and deal with AST nodes yourself. It's designed to be extensible.

CoolTool is to the AST what jQuery is to the DOM (no, not something horrible).

### Concepts

First we have to define / explain a couple of terms from Recast:

- **Node**: The AST is composed of nodes. A node is basically a plain object and has a specific type, in accordance with the [Mozilla Parser API][1]. For example, the identifier `foo` is represented by

    ```
    {
 	type: 'Identifier',
	name: 'foo'    }
    ```
 
     It only holds data about the syntax construct it represents and has no additional API.
     
- **NodePath**: A node path is a wrapper around an AST node. It contains context information for node. These can be AST related (e.g. the parent of the node) or code related (e.g. a static version of the scope the node is in). It also provides an API to mutate the node (or replace it completely).

On top of this, CoolTool adds **collections**. A collection is a set of node paths. These paths can be processed (e.g. traversed or mutated) by the methods the collection has.  
By default a collection has only a very simply API to access the elements of the collection. The power of collections comes from **typed collections**. If a collection contains a set of node paths, then the type of the collection is the node type that all of the node paths have in common.  
Typed collections follow the type hierarchy defined by Recast. For example, an `IdentifierCollection` is an `ExpressionCollection` is a `NodeCollection`. That means that an `IdentifierCollection` has methods that have been registered for Identifiers, Expressions and Nodes.

CoolTool provides a set of common methods for various types, such as finding all nodes of a given type or replacing a node with a new node.


### API examples

#### Finding elements and do stuff

```
var t = require('cooltool');

// Logs the value of every identifier in ast
t(ast).find(t.Identifier).forEach(function(path) {
	console.log(path.value.name);});

// Get all XJSElement child nodes of nodes with name "Foo"
var children = t(ast).findXJSElement('Foo').childElements();
```

#### How to add new methods to collections

```
var t = require('cooltool');

// Adding a method to all Identifiers
t.registerMethods({
	logNames: function() {
		return this.forEach(function(path) {
			console.log(path.value.name);		});	}}, t.Identifier);

// Adding a method to all collections
t.registerMethods({
	findIdentifiers: function() {
		return this.find(t.Identifier);	}});

t(ast).findIdentifiers().logNames();
t(ast).logNames(); // error, unless `ast` only consists of Identifier nodes
```


[1]: https://developer.mozilla.org/en-US/docs/Mozilla/Projects/SpiderMonkey/Parser_API
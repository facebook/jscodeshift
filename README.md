# jscodeshift [![Build Status](https://travis-ci.org/facebook/jscodeshift.svg?branch=master)](https://travis-ci.org/facebook/jscodeshift)

jscodeshift is a toolkit for running codemods over multiple JS files.
It provides:

- A runner, which executes the provided transform for each file passed to it.
  It also outputs a summary of how many files have (not) been transformed.
- A wrapper around [recast][], providing a different API.  Recast is an
  AST-to-AST transform tool and also tries to preserve the style of original code
  as much as possible.

## Install

Get jscodeshift from [npm][]:

```
$ npm install -g jscodeshift
```

This will install the runner as `jscodeshift`.

## Usage (CLI)

The CLI provides the following options:

```text
$ jscodeshift --help

Usage: jscodeshift <path>... [options]

path     Files or directory to transform

Options:
   -t FILE, --transform FILE   Path to the transform file. Can be either a local path or url  [./transform.js]
   -c, --cpus                  (all by default) Determines the number of processes started.
   -v, --verbose               Show more information about the transform process  [0]
   -d, --dry                   Dry run (no changes are made to files)
   -p, --print                 Print output, useful for development
   --babel                     Apply Babel to transform files  [true]
   --extensions                File extensions the transform file should be applied to  [js]
   --ignore-pattern            Ignore files that match a provided glob expression
   --ignore-config FILE        Ignore files if they match patterns sourced from a configuration file (e.g., a .gitignore)
   --run-in-band               Run serially in the current process  [false]
   -s, --silent                No output  [false]
   --parser                    The parser to use for parsing your source files (babel | babylon | flow)  [babel]
   --version                   print version and exit
```

This passes the source of all passed through the transform module specified
with `-t` or `--transform` (defaults to `transform.js` in the current
directory). The next section explains the structure of the transform module.

## Transform module

The transform is simply a module that exports a function of the form:

```js
module.exports = function(fileInfo, api, options) {
  // transform `fileInfo.source` here
  // ...
  // return changed source
  return source;
};
```

### Arguments

#### `fileInfo`

Holds information about the currently processed file.

Property    | Description
------------|------------
path        | File path
source      | File content

#### `api`

This object exposes the `jscodeshift` library and helper functions from the
runner.

Property    | Description
------------|------------
jscodeshift | A reference to the jscodeshift library
stats       | A function to collect statistics during `--dry` runs

`jscodeshift` is a reference to the wrapper around recast and provides a
jQuery-like API to navigate and transform the AST. Here is a quick example,
a more detailed description can be found below.

```js
/**
 * This replaces every occurrence of variable "foo".
 */
module.exports = function(fileInfo, api) {
  return api.jscodeshift(fileInfo.source)
    .findVariableDeclarators('foo')
    .renameTo('bar')
    .toSource();
}
```

**Note:** This API is exposed for convenience, but you don't have to use it.
You can use any tool to modify the source.

`stats` is a function that only works when the `--dry` options is set. It accepts
a string, and will simply count how often it was called with that value.

At the end, the CLI will report those values. This can be useful while
developing the transform, e.g. to find out how often a certain construct
appears in the source(s).

#### `options`

Contains all options that have been passed to runner. This allows you to pass
additional options to the transform. For example, if the CLI is called with

```
$ jscodeshift -t myTransforms fileA fileB --foo=bar
```

`options` would contain `{foo: 'bar'}`. jscodeshift uses [nomnom][] to parse
command line options.

### Return value

The return value of the function determines the status of the transformation:

- If a string is returned and it is different from passed source, the
  transform is considered to be successful.
- If a string is returned but it's the same as the source, the transform
  is considered to be unsuccessful.
- If nothing is returned, the file is not supposed to be transformed (which is
  ok).

The CLI provides a summary of the transformation at the end. You can get more
detailed information by setting the `-v` option to `1` or `2`.

You can collect even more stats via the `stats` function as explained above.

### Parser

The transform can let jscodeshift know with which parser to parse the source 
files (and features like templates).

To do that, the transform module can export `parser`, which can either be one 
of the strings `"babel"`, `"babylon"`, or `"flow"`, or it can be a parser 
object that is compatible with recast.

For example:

```js
module.exports.parser = 'flow'; // use the flow parser
// or
module.exports.parser = {
  parse: function(source) {
    // return estree compatible AST
  },
};
```

### Example output

```text
$ jscodeshift -t myTransform.js src
Processing 10 files...
Spawning 2 workers with 5 files each...
All workers done.
Results: 0 errors 2 unmodified 3 skipped 5 ok
```

## The jscodeshift API

As already mentioned, jscodeshift also provides a wrapper around [recast][].
In order to properly use the jscodeshift API, one has to understand the basic
building blocks of recast (and ASTs) as well.

### Core Concepts

#### AST nodes

An AST node is a plain JavaScript object with a specific set of fields, in
accordance with the [Mozilla Parser API][]. The primary way to identify nodes
is via their `type`.

For example, string literals are represented via `Literal` nodes, which
have the structure

```js
// "foo"
{
  type: 'Literal',
  value: 'foo',
  raw: '"foo"'
}
```

It's OK to not know the structure of every AST node type.
The [(esprima) AST explorer][ast-explorer] is an online tool to inspect the AST
for a given piece of JS code.

#### Path objects

Recast itself relies heavily on [ast-types][] which defines methods to traverse
the AST, access node fields and build new nodes. ast-types wraps every AST node
into a *path object*. Paths contain meta-information and helper methods to
process AST nodes.

For example, the child-parent relationship between two nodes is not explicitly
defined. Given a plain AST node, it is not possible to traverse the tree *up*.
Given a path object however, the parent can be traversed to via `path.parent`.

For more information about the path object API, please have a look at
[ast-types][].

#### Builders

To make creating AST nodes a bit simpler and "safer", ast-types defines a couple
of *builder methods*, which are also exposed on `jscodeshift`.

For example, the following creates an AST equivalent to `foo(bar)`:

```js
// inside a module transform
var j = jscodeshift;
// foo(bar);
var ast = j.callExpression(
  j.identifier('foo'),
  [j.identifier('bar')]
);
```

The signature of each builder function is best learned by having a look at the
[definition files](https://github.com/benjamn/ast-types/blob/master/def/).

### Collections and Traversal

In order to transform the AST, you have to traverse it and find the nodes that
need to be changed. jscodeshift is built around the idea of **collections** of
paths and thus provides a different way of processing an AST than recast or
ast-types.

A collection has methods to process the nodes inside a collection, often
resulting in a new collection. This results in a fluent interface, which can
make the transform more readable.

Collections are "typed" which means that the type of a collection is the
"lowest" type all AST nodes in the collection have in common. That means you
cannot call a method for a `FunctionExpression` collection on an `Identifier`
collection.

Here is an example of how one would find/traverse all `Identifier` nodes with
jscodeshift and with recast:

```js
// recast
var ast = recast.parse(src);
recast.visit(ast, {
  visitIdentifier: function(path) {
    // do something with path
    return false;
  }
});

// jscodeshift
jscodeshift(src)
  .find(jscodeshift.Identifier)
  .forEach(function(path) {
    // do something with path
  });
```

To learn about the provided methods, have a look at the
[Collection.js](src/Collection.js) and its [extensions](src/collections/).

### Extensibility

jscodeshift provides an API to extend collections. By moving common operators
into helper functions (which can be stored separately in other modules), a
transform can be made more readable.

There are two types of extensions: generic extensions and type-specific
extensions. **Generic extensions** are applicable to all collections. As such,
they typically don't access specific node data, but rather traverse the AST from
the nodes in the collection. **Type-specific** extensions work only on specific
node types and are not callable on differently typed collections.

#### Examples

```js
// Adding a method to all Identifiers
jscodeshift.registerMethods({
	logNames: function() {
		return this.forEach(function(path) {
			console.log(path.node.name);
		});
	}
}, jscodeshift.Identifier);

// Adding a method to all collections
jscodeshift.registerMethods({
	findIdentifiers: function() {
		return this.find(jscodeshift.Identifier);
	}
});

jscodeshift(ast).findIdentifiers().logNames();
jscodeshift(ast).logNames(); // error, unless `ast` only consists of Identifier nodes
```

### Passing options to [recast]

You may want to change some of the output settings (like setting `'` instead of `"`).
This can be done by passing config options to [recast].

```js
.toSource({quote: 'single'}); // sets strings to use single quotes in transformed code.
```

You can also pass options to recast's `parse` method by passing an object to 
jscodeshift as second argument:

```js
jscodeshift(source, {...})
```

More on config options [here](https://github.com/benjamn/recast/blob/52a7ec3eaaa37e78436841ed8afc948033a86252/lib/options.js#L61)

### Unit Testing

jscodeshift comes with a simple utility to allow easy unit testing with [Jest](https://facebook.github.io/jest/), without having to write a lot of boilerplate code. This utility makes some assumptions in order to reduce the amount of configuration required:

 - The test is located in a subdirectory under the directory the transform itself is located in (eg. `__tests__`)
 - Test fixtures are located in a `__testfixtures__` directory

This results in a directory structure like this:
```
/MyTransform.js
/__tests__/MyTransform-test.js
/__testfixtures__/MyTransform.input.js
/__testfixtures__/MyTransform.output.js
```

To define a test, use `defineTest` or `defineInlineTest` from the `testUtils` module. A simple example is bundled in the [sample directory](sample).

#### `defineTest`
```js
jest.autoMockOff();
const defineTest = require('jscodeshift/dist/testUtils').defineTest;
defineTest(__dirname, 'MyTransform');
```

An alternate fixture filename can be provided as the fourth argument to `defineTest`. This also means that multiple test fixtures can be provided:
```js
defineTest(__dirname, 'MyTransform', null, 'FirstFixture');
defineTest(__dirname, 'MyTransform', null, 'SecondFixture');
```
This will run two tests: One for `__testfixtures__/FirstFixture.input.js` and one for `__testfixtures__/SecondFixture.input.js`

#### `defineInlineTest`
```js
const transform = require('../myTransform');
defineInlineTest(transform, {}, 'input', 'expected output', 'test name (optional)');
```

### Example Codemods

- [react-codemod](https://github.com/reactjs/react-codemod) - React codemod scripts to update React APIs.
- [js-codemod](https://github.com/cpojer/js-codemod/) - Codemod scripts to transform code to next generation JS.
- [js-transforms](https://github.com/jhgg/js-transforms) - Some documented codemod experiments to help you learn.

### Recipes

- [Retain leading comment(s) in file when replacing/removing first statement](recipes/retain-first-comment.md)

### Support

* Discord - [#codemod](https://discordapp.com/channels/102860784329052160/103748721107292160) on [Reactiflux](http://www.reactiflux.com/)

[npm]: https://www.npmjs.com/
[Mozilla Parser API]: https://developer.mozilla.org/en-US/docs/Mozilla/Projects/SpiderMonkey/Parser_API
[recast]: https://github.com/benjamn/recast
[ast-types]: https://github.com/benjamn/ast-types
[ast-explorer]: http://astexplorer.net/
[nomnom]: https://www.npmjs.com/package/nomnom

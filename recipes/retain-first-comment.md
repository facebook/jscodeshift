# Retain comment on first line

## Problem

When removing or replacing the first statement in a file, it is possible for [leading comments at the top of the file to be removed](https://github.com/facebook/jscodeshift/issues/44).

## Solution

To retain the leading comments during a transformation, the `comments` array on the statement's `node` _must_ be copied to the next statement's `node` that will be at the top of the file.

## Examples

#### Bad

##### Transform
```javascript
export default function transformer(file, api) {
  const j = api.jscodeshift;

  return j(file.source)
    .find(j.VariableDeclaration)
    .replaceWith(
        j.expressionStatement(j.callExpression(
                j.identifier('foo'), []
            )
        )
    )
    .toSource();
};
```

##### In
```javascript
// Comment on first line
const firstStatement = require('some-module');
```

##### Out
```javascript
foo();
```

#### Good

##### Transform
```javascript
export default function transformer(file, api) {
  const j = api.jscodeshift;
  const root = j(file.source);

  const getFirstNode = () => root.find(j.Program).get('body', 0).node;

  // Save the comments attached to the first node
  const firstNode = getFirstNode();
  const { comments } = firstNode;

  root.find(j.VariableDeclaration).replaceWith(
    j.expressionStatement(j.callExpression(
        j.identifier('foo'),
        []
    ))
  );

  // If the first node has been modified or deleted, reattach the comments
  const firstNode2 = getFirstNode();
  if (firstNode2 !== firstNode) {
    firstNode2.comments = comments;
  }

  return root.toSource();
};
```

##### In
```javascript
// Comment on first line
const firstStatement = require('some-module');
```

##### Out
```javascript
// Comment on first line
foo();
```


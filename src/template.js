let babel = require('babel');

function splice(arr, element, replacement) {
  arr.splice(arr.indexOf(element), 1, ...replacement);
}

function getPlugin(varName, nodes) {
  let counter = 0;

  return function({Plugin, types: t}) {
    return new Plugin('template', {
      visitor: {
        Identifier: {
          exit: function(node, parent) {
            if (node.name !== varName) {
              return node;
            }

            let replacement = nodes[counter++];
            if (Array.isArray(replacement)) {
              // check whether we can explode arrays here
              if (t.isFunction(parent) && parent.params.indexOf(node) > -1) {
                // function foo(${bar}) {}
                splice(parent.params, node, replacement);
              } else if (t.isVariableDeclarator(parent)) {
                // var foo = ${bar}, baz = 42;
                splice(
                  this.parentPath.parentPath.node.declarations,
                  parent,
                  replacement
                );
              } else if (t.isArrayExpression(parent)) {
                // var foo = [${bar}, baz];
                splice(parent.elements, node, replacement);
              } else if (t.isProperty(parent) && parent.shorthand) {
                // var foo = {${bar}, baz: 42};
                splice(
                  this.parentPath.parentPath.node.properties,
                  parent,
                  replacement
                );
              } else if (t.isCallExpression(parent) &&
                  parent.arguments.indexOf(node) > -1) {
                // foo(${bar}, baz)
                splice(parent.arguments, node, replacement);
              } else if (t.isExpressionStatement(parent)) {
                this.parentPath.replaceWithMultiple(replacement);
              } else {
                this.replaceWithMultiple(replacement);
              }
            } else if (t.isExpressionStatement(parent)) {
              this.parentPath.replaceWith(replacement);
            } else {
              return replacement;
            }
          }
        }
      }
    });
  }
}

function replaceNodes(src, varName, nodes) {
  return babel.transform(
    src,
    {
      plugins: [getPlugin(varName, nodes)],
      whitelist: [],
      code: false,
    }
  ).ast;
}

function getRandomVarName() {
  return `$jscodeshift${Math.floor(Math.random() * 1000)}$`;
}

export function statements(template, ...nodes) {
  template = [...template];
  let varName = getRandomVarName();
  let src = template.join(varName);
  return replaceNodes(src, varName, nodes).program.body;
}

export function statement(template, ...nodes) {
  return statements(template, ...nodes)[0];
}

export function expression(template, ...nodes) {
  // wrap code in `(...)` to force evaluation as expression
  template = [...template];
  if (template.length > 1) {
    template[0] = '(' + template[0];
    template[template.length - 1] += ')';
  } else if (template.length === 0) {
    template[0] = '(' + template[0] + ')';
  }

  return statement(template, ...nodes).expression;
}

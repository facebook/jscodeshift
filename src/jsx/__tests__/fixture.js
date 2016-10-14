const j = require('../../core');
const { fromNodes } = require('../../Collection');

// var a; var b;
function variableDeclarations() {
  return fromNodes([
    j.variableDeclaration('var', [j.variableDeclarator(j.identifier('a'), null)]),
    j.variableDeclaration('var', [j.variableDeclarator(j.identifier('b'), null)]),
  ]);
}

// var a;
function variableDeclaration() {
  return fromNodes([
    j.variableDeclaration('var', [j.variableDeclarator(j.identifier('a'), null)]),
  ]);
}

// [].map(num => num + 1)
function callExpression() {
  return fromNodes([
    j.callExpression(
      j.memberExpression(
        j.arrayExpression([]),
        j.identifier('map'),
      ),
      [
        j.arrowFunctionExpression(
          [j.identifier('num')],
          j.binaryExpression('+', j.identifier('num'), j.literal(1))
        ),
      ],
    ),
  ]);
}

// const result = _.map([1,2,3], () => {});
function lodashCallExpression() {
  return fromNodes([
    j.variableDeclaration('var', [
      j.variableDeclarator(j.identifier('result'),
        j.callExpression(
          j.memberExpression(j.identifier('_'), j.identifier('map')),
          [
            j.arrayExpression([j.literal(1)]),
            j.arrowFunctionExpression([], j.blockStatement([])),
          ]
        )),
    ]),
  ]);
}

module.exports = {
  callExpression: callExpression,
  lodashCallExpression: lodashCallExpression,
  variableDeclaration: variableDeclaration,
  variableDeclarations: variableDeclarations,
};

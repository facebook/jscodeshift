/**
 * This is an example transform demonstrating how to modify object properties.
 * It shows how to:
 * - Change the value of an existing property
 * - Add a new property to an object
 *
 * To run this transform:
 *   jscodeshift -t transform-object-property.js <file>
 *   jscodeshift -t transform-object-property.js --dry -p <file>
 */

import { parse } from 'recast';
import { objectExpression, property, identifier, numericLiteral, stringLiteral } from 'babel-types';

// The main transform function receives the source code as a string
// and returns the transformed source code
function transformObjectProperty(fileInfo, api) {
  const j = api.jscodeshift;
  const source = fileInfo.source;

  // Parse the source into an AST
  const ast = j.withParser('babylon')(source);

  // Find all object expressions (object literals like { foo: 3 })
  ast.find(j.ObjectExpression)
    .forEach(path => {
      // Check if the object has a 'foo' property
      const fooProperty = path.node.properties.find(
        prop => prop.key && prop.key.name === 'foo'
      );

      // If 'foo' property exists, change its value from 3 to 4
      if (fooProperty) {
        fooProperty.value = numericLiteral(4);
      }

      // Add a new 'bar' property with value '5'
      const newProperty = j.property(
        'init',
        identifier('bar'),
        stringLiteral('5')
      );
      path.node.properties.push(newProperty);
    });

  // Return the transformed source code
  return ast.toSource();
}

export default transformObjectProperty;

// Also support CommonJS for older Node versions
if (typeof module !== 'undefined' && module.exports) {
  module.exports = transformObjectProperty;
}

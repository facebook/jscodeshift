/**
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

import type {
  ASTPath,
  Collection,
  JSCodeshift,
  Transform,
} from 'jscodeshift';

/**
 * Example jscodeshift transformer. Simply reverses the names of all
 * identifiers.
 */
const transform: Transform = (file, api: JSCodeshift) => {
  const j = api.jscodeshift;

  const buildTransformer = () => {
    return (path: ASTPath) => {
      const reversed = path.node.name.split('').reverse().join('');
      path.node.name = reversed;
    };
  };

  const root: Collection = j(file.source);

  root.find(j.Identifier).forEach(buildTransformer());

  return root.toSource();
};

export default transform;

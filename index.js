
/**
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

module.exports = require('./src/core');
module.exports.run = require('./src/core').run;
module.exports.transform = require('./src/core').transform;
module.exports.defineFixture = require('./src/core').defineFixture;
module.exports.registerConfig = require('./src/core').registerConfig;
module.exports.printResults = require('./src/core').printResults;
module.exports.parseArgs = require('./src/core').parseArgs;
module.exports.createExtension = require('./src/core').createExtension;
module.exports.builtinDecorators = require('./src/core').builtinDecorators;
module.exports.builtinTransforms = require('./src/core').builtinTransforms;
module.exports.builtinParsers = require('./src/core').builtinParsers;
module.exports.ParsingSourceError = require('./src/core').ParsingSourceError;
module.exports.InvalidSourceError = require('./src/core').InvalidSourceError;
module.exports.SyntaxError = require('./src/core').SyntaxError;
module.exports.Suite = require('./src/core').Suite;
module.exports.Test = require('./src/core').Test;

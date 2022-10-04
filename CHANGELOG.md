# Changelog
All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/)
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [0.14.0] 2022-10-04

### Added
- Added a `defineSnapshotTestFromFixture` test util (#471, @shriuken)
- Added `renameTo` filters for Babel 6+ node types (#412 and #504, @elonvolo and @henryqdineen)
- Added `childNodesOfType` to JSX traversal methods (#415, @j13huang)


### Changed
- Bumped dependency versions
- Allow arguments in `--help` to be listed in an order other than alphabetically, so they can instead be grouped thematically (#507, @elonvolo)
- Allow the `j` shortcut in test utils (#515, @no23reason)



## [0.13.1] 2022-01-10

### Changed

- Switched from `colors` to `chalk` to mitigate a security vulnerability in `colors@1.4.1`.

## [0.13.0] 2021-06-26

### Added

- Added a `--fail-on-error` flag to return a `1` error code when errors were found (#416, @marcodejongh)
- Created `template.asyncExpression` (#405, @jedwards1211)

### Changed

- Removed lodash dependency from tsx parser (#432, @JHilker and @robyoder)

## [0.12.0] 2021-04-21
### Changed
- Allow transform to be a Promise (#237, @rektide)
- Support newer TypeScript syntax by upgrading to newer Babel parser (#410, @wdoug and @mfeckie)

## [0.11.0] 2020-09-01
### Changed
- Updated `recast` to latest

## [0.10.0] 2020-06-01
### Changed
- Updated `flow-parser` to latest, and enabled Flow Enums parsing by default when using Flow parser

## [0.8.0] 2020-05-03
### Changed
- Dropped support for Node versions 6 and 8

## [0.7.0] 2019-12-11
## Added
- Added jest snapshot utils (#297, @dogoku)

### Changed
- Moved from BSD to MIT license

### Fixed
- No longer throw an error when calling jscodeshift on a non-existent path (#334, @threepointone)
- Preserve the original file extension in remote files (#317, @samselikoff)

## [0.6.4] 2019-04-30
### Changed
- Allow writing tests in TypeScript ([PR #308](https://github.com/facebook/jscodeshift/pull/308))
- Better handling of `.gitingore` files: Ignore comments and support `\r\n` line breaks ([PR #306](https://github.com/facebook/jscodeshift/pull/306))


## [0.6.3] 2019-01-18
### Fixed
- Don't throw an error when jscodeshift processes an empty set of files (#295,
@skovhus).
- `renameTo` should not rename class properties (#296, @henryqdineen).
- Custom/unknown CLI parameters are parsed as JSON, just like nomnom used to
do.


## [0.6.2] 2018-12-05
### Changed
- `@babel/register`/`@babel/preset-env` is configured to not transpile any
language features that the running Node process supports. That means if you use
features in your transform code supported by the Node version you are running,
they will be left as is. Most of ES2015 is actually supported since Node v6.
- Do not transpile object rest/spread in transform code if supported by running
Node version.

### Fixed
- Presets and plugins passed to `@babel/register` are now properly named and
  loaded.


## [0.6.1] 2018-12-04
### Added
- Tranform files can be written in Typescript. If the file extension of the
transform file is `.ts` or `.tsx`, `@babel/preset-typescript` is used to
convert them. This requires the `--babel` option to be set (which it is by
default). ( #287 , @brieb )

### Changed
- The preset and plugins for converting the transform file itself via babeljs
have been updated to work with babel v7. This included removing
`babel-preset-es2015` and `babel-preset-stage-1` in favor of
`@babel/preset-env`. Only `@babel/proposal-class-properties` and
`@babel/proposal-object-rest-spread` are enabled as experimental features. If
you want to use other's in your transform file, please create a PR.

### Fixed
- Typescript parses use `@babel/parser` instead of Babylon ( #291, @elliottsj )

### Bumped
- `micromatch` => v3.1.10, which doesn't (indirectly) depend on `randomatic` <
v3 anymore (see #292).

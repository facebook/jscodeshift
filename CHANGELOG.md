# Changelog
All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/)
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

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

# Contributing to evcodeshift
We want to make contributing to this project as easy and transparent as
possible.

## Code of Conduct
The code of conduct is described in [`CODE_OF_CONDUCT.md`](CODE_OF_CONDUCT.md)

## Our Development Process
The majority of development on evcodeshift will occur through GitHub. Accordingly,
the process for contributing will follow standard GitHub protocol.

## Pull Requests
We actively welcome your pull requests.

1. Fork the repo and create your branch from `master`.
2. If you've added code that should be tested, add tests.
3. If you've changed APIs, update the documentation.
4. Ensure the test suite passes.
5. Make sure your code lints.
6. If you haven't already, complete the Contributor License Agreement ("CLA").

## Issues
We use GitHub issues to track public bugs. Please ensure your description is
clear and has sufficient instructions to be able to reproduce the issue.
## Coding Style
* Use semicolons;
* Commas last,
* 2 spaces for indentation (no tabs)
* Prefer `'` over `"`
* `'use strict';`
* 80 character line length
* "Attractive"
* More lines is more better. More lines means easier to debug.
* New code should have no tail calls. The only thing "return" should ever be followed by is a variable name.
* Nesting is for the birds. New code should never have foo(bar()). mybar = bar();\nfoo(mybar);

### License

evcodeshift is [MIT licensed](./LICENSE).

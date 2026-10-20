---
"jscodeshift": patch
---

Fix `hasAttributes` never matching an attribute whose value is written as an expression, like `<Foo count={1} flag={true} name={'bar'} />`

The filter compared the expected value against the attribute's AST node instead of the value that node carries, and compared it with `===` to a string. Both are fixed: literal values inside a `JSXExpressionContainer` are unwrapped, and the comparison is made between the string forms, so `{count: 1}` and `{count: '1'}` now match `count={1}` the way `{name: 'bar'}` has always matched `name="bar"`. Callback filters now receive the attribute value for expression attributes too, consistent with the `null` they already receive for an attribute that has no value.

---
"jscodeshift": patch
---

Fix `insertBefore` and `insertAfter` throwing "does not match type array" when called on the declaration of an `export` statement

Paths such as the `declaration` of `export function foo() {}` or `export interface Foo {}` are a single child of the export statement, not a list item. The new nodes are now inserted before or after the export statement itself.

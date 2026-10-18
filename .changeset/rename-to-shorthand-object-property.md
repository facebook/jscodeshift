---
"jscodeshift": patch
---

Fix `renameTo` changing the key of shorthand object properties with the babylon, ts and tsx parsers

These parsers produce `ObjectProperty` nodes, which were not expanded like `Property` nodes, so `{ foo }` was printed as `{ newFoo }` instead of `{ foo: newFoo }`.

---
"jscodeshift": patch
---

Fix `renameTo` changing export specifiers

Renaming a variable that is exported with `export { foo }` now produces `export { newFoo as foo }` instead of changing the exported name, and specifiers re-exported from another module (`export { foo } from 'module'`) are no longer renamed.

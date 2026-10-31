---
"jscodeshift": patch
---

`renameTo` no longer renames statement labels (`foo: for (;;) { break foo; }`) or private class members (`#foo`) that share the variable's name.

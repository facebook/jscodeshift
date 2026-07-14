---
"jscodeshift": patch
---

Fix `--ignore-pattern` not matching files when the source path is relative and starts with `../` (or `./`)

Ignore patterns such as `**/node_modules/**` were silently skipped for files enumerated from a relative source path like `../app/src`, because picomatch's `**` wildcard does not match across a leading `../`/`./` traversal segment. The path is now also matched with any leading traversal prefix stripped, so ignore behavior is consistent for relative and absolute source paths.
